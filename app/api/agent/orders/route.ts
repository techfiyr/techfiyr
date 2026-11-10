/*
 * POST /api/agent/orders & GET /api/agent/orders:
 *   POST creates a guardrail-verified autonomous order, SOW, payment rail, and 7/14-day tracker.
 *   GET lists orders (requires operator Authorization: Bearer <AGENT_SALES_API_KEY>).
 */
import type { PaymentRail } from '@/lib/agent/pricing';
import { recordAgentHit } from '@/lib/server/agent-audit';
import { agentJson, agentOptions, readJsonBody } from '@/lib/server/agent-http';
import { createAgentOrder } from '@/lib/server/agent-orders';
import { isOperatorAuthorized, listOrders, publicOrderView } from '@/lib/server/agent-store';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function handleCreateOrderRequest(req: Request) {
	const startedAtMs = Date.now();
	const parsed = await readJsonBody<Record<string, unknown>>(req);
	if (!parsed.ok) {
		await recordAgentHit(req, {
			protocol: 'rest',
			action: 'create_order',
			statusCode: 400,
			startedAtMs,
			summary: `Order invalid JSON: ${parsed.error}`,
		});
		return agentJson({ ok: false, code: 'INVALID_JSON', error: parsed.error }, 400);
	}

	const body = parsed.data;
	const agentId =
		(typeof body.clientAgentId === 'string' ? body.clientAgentId : req.headers.get('x-agent-id')) || undefined;

	const result = await createAgentOrder({
		quoteId: typeof body.quoteId === 'string' ? body.quoteId : undefined,
		clientAgentId: agentId,
		clientDid: (typeof body.clientDid === 'string' ? body.clientDid : req.headers.get('x-agent-did')) || undefined,
		clientEmail: typeof body.clientEmail === 'string' ? body.clientEmail : '',
		callbackUrl: typeof body.callbackUrl === 'string' ? body.callbackUrl : undefined,
		projectTitle: typeof body.projectTitle === 'string' ? body.projectTitle : '',
		scopeSummary:
			typeof body.scopeSummary === 'string'
				? body.scopeSummary
				: typeof body.description === 'string'
					? body.description
					: '',
		techStack: Array.isArray(body.techStack)
			? body.techStack.filter((x): x is string => typeof x === 'string')
			: undefined,
		agreedPriceUSD: typeof body.agreedPriceUSD === 'number' ? body.agreedPriceUSD : undefined,
		deliveryDays: typeof body.deliveryDays === 'number' ? body.deliveryDays : undefined,
		crudEntities: typeof body.crudEntities === 'number' ? body.crudEntities : undefined,
		mobileScreens: typeof body.mobileScreens === 'number' ? body.mobileScreens : undefined,
		integrationsCount: typeof body.integrationsCount === 'number' ? body.integrationsCount : undefined,
		requiresCustomAiTraining:
			typeof body.requiresCustomAiTraining === 'boolean' ? body.requiresCustomAiTraining : undefined,
		paymentPreference:
			typeof body.paymentPreference === 'string' ? (body.paymentPreference as PaymentRail) : undefined,
	});

	if (!result.ok) {
		await recordAgentHit(req, {
			protocol: 'rest',
			action: 'create_order',
			agentName: agentId,
			statusCode: result.status,
			startedAtMs,
			summary: `Order blocked (${result.code}): ${result.error}`,
		});
		return agentJson(
			{
				ok: false,
				code: result.code,
				error: result.error,
				evaluation: result.evaluation,
			},
			result.status,
		);
	}

	await recordAgentHit(req, {
		protocol: 'rest',
		action: 'create_order',
		agentName: agentId,
		statusCode: 201,
		startedAtMs,
		orderId: result.order.id,
		summary: `Order created: ${result.order.id} ($${result.order.agreedPriceUSD}, ${result.order.deliveryDays}d)`,
	});

	return agentJson(
		{
			ok: true,
			order: result.order,
			accessToken: result.accessToken,
			statusUrl: result.statusUrl,
		},
		201,
	);
}

export async function POST(req: Request) {
	return handleCreateOrderRequest(req);
}

export async function GET(req: Request) {
	if (!isOperatorAuthorized(req)) {
		return agentJson(
			{
				ok: false,
				code: 'UNAUTHORIZED',
				error: 'Listing orders requires operator Authorization: Bearer <AGENT_SALES_API_KEY>.',
			},
			401,
		);
	}
	const orders = await listOrders();
	return agentJson({
		ok: true,
		count: orders.length,
		orders: orders.map(publicOrderView),
	});
}

