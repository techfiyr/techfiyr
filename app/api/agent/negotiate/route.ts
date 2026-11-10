/*
 * POST /api/agent/negotiate: autonomous Gemini-backed Sales Negotiation Agent
 * constrained by deterministic pricing and SLA guardrails.
 */
import type { PaymentRail } from '@/lib/agent/pricing';
import { recordAgentHit } from '@/lib/server/agent-audit';
import { agentJson, agentOptions, readJsonBody } from '@/lib/server/agent-http';
import { negotiateWithAgent } from '@/lib/server/agent-negotiator';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function POST(req: Request) {
	const startedAtMs = Date.now();
	const parsed = await readJsonBody<Record<string, unknown>>(req);
	if (!parsed.ok) {
		await recordAgentHit(req, {
			protocol: 'rest',
			action: 'negotiate',
			statusCode: 400,
			startedAtMs,
			summary: `Negotiate invalid JSON: ${parsed.error}`,
		});
		return agentJson({ ok: false, code: 'INVALID_JSON', error: parsed.error }, 400);
	}

	const body = parsed.data;
	const message = typeof body.message === 'string' ? body.message.trim() : '';
	const description = typeof body.description === 'string' ? body.description.trim() : '';

	if (!message && !description) {
		return agentJson(
			{
				ok: false,
				code: 'MISSING_INPUT',
				error: 'Provide "message" and/or "description" to negotiate project terms.',
			},
			400,
		);
	}

	const agentId =
		(typeof body.clientAgentId === 'string' ? body.clientAgentId : req.headers.get('x-agent-id')) || undefined;

	const result = await negotiateWithAgent({
		channel: 'a2a',
		sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
		clientAgentId: agentId,
		clientDid: (typeof body.clientDid === 'string' ? body.clientDid : req.headers.get('x-agent-did')) || undefined,
		clientEmail: typeof body.clientEmail === 'string' ? body.clientEmail : undefined,
		message: message || undefined,
		projectTitle: typeof body.projectTitle === 'string' ? body.projectTitle : undefined,
		description: description || undefined,
		techStack: Array.isArray(body.techStack)
			? body.techStack.filter((x): x is string => typeof x === 'string')
			: undefined,
		crudEntities: typeof body.crudEntities === 'number' ? body.crudEntities : undefined,
		mobileScreens: typeof body.mobileScreens === 'number' ? body.mobileScreens : undefined,
		integrationsCount: typeof body.integrationsCount === 'number' ? body.integrationsCount : undefined,
		requiresCustomAiTraining: typeof body.requiresCustomAiTraining === 'boolean' ? body.requiresCustomAiTraining : undefined,
		budgetUSD: typeof body.budgetUSD === 'number' ? body.budgetUSD : undefined,
		requestedDays: typeof body.requestedDays === 'number' ? body.requestedDays : undefined,
		paymentPreference:
			typeof body.paymentPreference === 'string' ? (body.paymentPreference as PaymentRail) : undefined,
		acceptOffer: typeof body.acceptOffer === 'boolean' ? body.acceptOffer : undefined,
	});

	await recordAgentHit(req, {
		protocol: 'rest',
		action: 'negotiate',
		agentName: agentId,
		statusCode: 200,
		startedAtMs,
		inquiryId: result.inquiryId,
		orderId: result.order?.id,
		summary: result.dealClosed
			? `Negotiation closed deal ${result.order?.id} ($${result.order?.agreedPriceUSD})`
			: `Negotiation turn (${result.decision}): $${result.evaluation.proposedPriceUSD}`,
	});

	return agentJson({
		ok: result.decision !== 'rejected',
		...result,
	});
}

