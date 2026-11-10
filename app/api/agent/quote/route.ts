/*
 * POST /api/agent/quote: evaluates an autonomous client agent's project spec against
 * deterministic pricing matrix and 7-day / 14-day scope boundary guardrails.
 */
import type { PaymentRail } from '@/lib/agent/pricing';
import { agentJson, agentOptions, readJsonBody } from '@/lib/server/agent-http';
import { createAgentQuote } from '@/lib/server/agent-orders';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function POST(req: Request) {
	const parsed = await readJsonBody<Record<string, unknown>>(req);
	if (!parsed.ok) {
		return agentJson({ ok: false, code: 'INVALID_JSON', error: parsed.error }, 400);
	}

	const body = parsed.data;
	const description = typeof body.description === 'string' ? body.description.trim() : '';
	if (!description) {
		return agentJson(
			{
				ok: false,
				code: 'MISSING_DESCRIPTION',
				error: 'Field "description" (functional project specification) is required.',
			},
			400,
		);
	}

	const { quote, persisted } = await createAgentQuote({
		clientAgentId:
			(typeof body.clientAgentId === 'string' ? body.clientAgentId : req.headers.get('x-agent-id')) || undefined,
		clientDid: (typeof body.clientDid === 'string' ? body.clientDid : req.headers.get('x-agent-did')) || undefined,
		clientEmail: typeof body.clientEmail === 'string' ? body.clientEmail : undefined,
		projectTitle: typeof body.projectTitle === 'string' ? body.projectTitle : undefined,
		serviceId: typeof body.serviceId === 'string' ? body.serviceId : undefined,
		platform:
			body.platform === 'web' ||
			body.platform === 'mobile' ||
			body.platform === 'fullstack' ||
			body.platform === 'ai' ||
			body.platform === 'design'
				? body.platform
				: undefined,
		description,
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
	});

	const statusCode =
		quote.evaluation.decision === 'rejected' && quote.evaluation.reasonCode === 'INVALID_SPEC' ? 400 : 200;

	return agentJson(
		{
			ok: quote.evaluation.decision !== 'rejected',
			quoteId: quote.id,
			expiresAt: quote.expiresAt,
			status: quote.status,
			persisted,
			evaluation: quote.evaluation,
		},
		statusCode,
	);
}

