/*
 * GET & PATCH /api/agent/orders/[orderId]:
 *   GET checks delivery phase, staging URLs, SOW, and payment status (requires order accessToken or operator key).
 *   PATCH advances fulfillment phases / attaches deliverables (requires operator Authorization: Bearer <AGENT_API_KEY>).
 */
import { agentJson, agentOptions, readJsonBody } from '@/lib/server/agent-http';
import { updateOrderFulfillment } from '@/lib/server/agent-orders';
import {
	getOrder,
	isOperatorAuthorized,
	isOrderAuthorized,
	publicOrderView,
	type AgentOrderRecord,
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

	const validPaymentStatuses: AgentOrderRecord['payment']['status'][] = [
		'pending_payment',
		'awaiting_payment_rails',
		'escrow_locked',
		'paid',
		'released',
	];
	const paymentStatus = validPaymentStatuses.includes(body.paymentStatus as AgentOrderRecord['payment']['status'])
		? (body.paymentStatus as AgentOrderRecord['payment']['status'])
		: undefined;

	const updated = await updateOrderFulfillment(orderId, {
		currentPhase: typeof body.currentPhase === 'string' ? body.currentPhase : undefined,
		phaseStatus,
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

