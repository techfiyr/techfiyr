/*
 * GET & PATCH /api/agent/orders/[orderId]:
 *   GET checks delivery phase, milestone status, SRS, and payment state (requires order accessToken or operator key).
 *   PATCH advances fulfillment phases, milestone_status, or payment tx hashes (requires operator key).
 */
import { agentJson, agentOptions, readJsonBody } from '@/lib/server/agent-http';
import { updateOrderFulfillment } from '@/lib/server/agent-orders';
import {
	getOrder,
	isOperatorAuthorized,
	isOrderAuthorized,
	publicOrderView,
	type AgentOrderRecord,
	type MilestoneStatus,
} from '@/lib/server/agent-store';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function GET(req: Request, context: { params: Promise<{ orderId: string }> }) {
	const { orderId } = await context.params;
	const order = await getOrder(orderId);
	if (!order) {
		return agentJson({ ok: false, code: 'ORDER_NOT_FOUND', error: `Order ${orderId} not found.` }, 404);
	}

	if (!isOrderAuthorized(req, order)) {
		return agentJson(
			{
				ok: false,
				code: 'UNAUTHORIZED',
				error: 'Provide the order accessToken via Authorization: Bearer <token> or X-Order-Token.',
			},
			401,
		);
	}

	return agentJson({ ok: true, order: publicOrderView(order) });
}

export async function PATCH(req: Request, context: { params: Promise<{ orderId: string }> }) {
	if (!isOperatorAuthorized(req)) {
		return agentJson(
			{
				ok: false,
				code: 'UNAUTHORIZED',
				error: 'Updating fulfillment phases requires operator Authorization: Bearer <AGENT_API_KEY>.',
			},
			401,
		);
	}

	const { orderId } = await context.params;
	const parsed = await readJsonBody<Record<string, unknown>>(req);
	if (!parsed.ok) {
		return agentJson({ ok: false, code: 'INVALID_JSON', error: parsed.error }, 400);
	}

	const body = parsed.data;
	const phaseStatus =
		body.phaseStatus === 'pending' || body.phaseStatus === 'in_progress' || body.phaseStatus === 'completed'
			? body.phaseStatus
			: undefined;

	const validMilestones: MilestoneStatus[] = ['AWAITING_DEPOSIT', 'UPFRONT_PAID', 'MVP_DELIVERED', 'FULLY_PAID'];
	const milestoneStatus = validMilestones.includes(body.milestoneStatus as MilestoneStatus)
		? (body.milestoneStatus as MilestoneStatus)
		: undefined;

	const validPaymentStatuses: AgentOrderRecord['payment']['status'][] = [
		'awaiting_upfront_25',
		'upfront_25_paid',
		'staging_50_paid',
		'fully_paid',
	];
	const paymentStatus = validPaymentStatuses.includes(body.paymentStatus as AgentOrderRecord['payment']['status'])
		? (body.paymentStatus as AgentOrderRecord['payment']['status'])
		: undefined;

	const updated = await updateOrderFulfillment(orderId, {
		currentPhase: typeof body.currentPhase === 'string' ? body.currentPhase : undefined,
		phaseStatus,
		milestoneStatus,
		cryptoChain: typeof body.cryptoChain === 'string' ? body.cryptoChain : undefined,
		cryptoTxHash: typeof body.cryptoTxHash === 'string' ? body.cryptoTxHash : undefined,
		payoneerReference: typeof body.payoneerReference === 'string' ? body.payoneerReference : undefined,
		repoUrl: typeof body.repoUrl === 'string' ? body.repoUrl : undefined,
		stagingUrl: typeof body.stagingUrl === 'string' ? body.stagingUrl : undefined,
		deliveryReportUrl: typeof body.deliveryReportUrl === 'string' ? body.deliveryReportUrl : undefined,
		paymentStatus,
	});

	if (!updated) {
		return agentJson({ ok: false, code: 'ORDER_NOT_FOUND', error: `Order ${orderId} not found.` }, 404);
	}

	return agentJson({ ok: true, order: publicOrderView(updated) });
}
