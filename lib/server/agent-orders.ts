/*
 * Shared quote and order orchestration for TechFiyr A2A Commerce (server only).
 * Used identically by REST (/api/v1/agent-order, /api/agent/*), MCP (/api/mcp),
 * A2A (/api/agent/a2a), and the Gemini Sales Closer tool-call execution.
 */
import { AGENT_SERVICES, GUARDRAILS } from '@/lib/agent/catalog';
import {
	enforceOrderGuardrails,
	evaluateProjectSpec,
	type PaymentRail,
	type QuoteEvaluation,
	type QuoteInput,
} from '@/lib/agent/pricing';
import { SITE_URL } from '@/lib/site';
import { notifyFounderOrderEvent } from './agent-notify';
import { createPaymentForOrder } from './agent-payments';
import {
	canPersistAgentStore,
	generateId,
	generateOrderToken,
	getOrder,
	getQuote,
	publicOrderView,
	saveOrder,
	saveQuote,
	type AgentOrderRecord,
	type AgentQuoteRecord,
	type OrderPhaseState,
} from './agent-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_RAILS: PaymentRail[] = ['stripe', 'crypto_escrow_base', 'crypto_escrow_solana', 'invoice'];

export type CreateQuoteParams = QuoteInput & {
	clientAgentId?: string;
	clientDid?: string;
	clientEmail?: string;
};

export async function createAgentQuote(params: CreateQuoteParams): Promise<{
	quote: AgentQuoteRecord;
	persisted: boolean;
}> {
	const evaluation = evaluateProjectSpec(params);
	const now = new Date();
	const expiresAt = new Date(now.getTime() + GUARDRAILS.quoteValidityHours * 3600_000);

	const quote: AgentQuoteRecord = {
		id: generateId('tf_qt'),
		createdAt: now.toISOString(),
		expiresAt: expiresAt.toISOString(),
		clientAgentId: (params.clientAgentId || 'anonymous-agent').slice(0, 120),
		clientDid: params.clientDid ? params.clientDid.slice(0, 200) : undefined,
		clientEmail: params.clientEmail && EMAIL_RE.test(params.clientEmail.trim()) ? params.clientEmail.trim() : undefined,
		input: {
			projectTitle: (params.projectTitle || 'Custom Software Project').trim().slice(0, 140),
			serviceId: evaluation.serviceId,
			platform: params.platform,
			description: (params.description || '').trim().slice(0, 8000),
			techStack: evaluation.normalizedStack.length ? evaluation.normalizedStack : params.techStack,
			crudEntities: evaluation.scopeMetrics.crudEntities,
			mobileScreens: evaluation.scopeMetrics.mobileScreens,
			integrationsCount: evaluation.scopeMetrics.integrationsCount,
			requiresCustomAiTraining: Boolean(params.requiresCustomAiTraining),
			budgetUSD: params.budgetUSD,
			requestedDays: params.requestedDays,
			paymentPreference: params.paymentPreference,
		},
		evaluation,
		status:
			evaluation.decision === 'approved'
				? 'quoted'
				: evaluation.decision === 'counter_offer'
					? 'countered'
					: 'rejected',
	};

	const persisted = await saveQuote(quote);
	return { quote, persisted };
}

export type CreateOrderParams = {
	quoteId?: string;
	clientAgentId?: string;
	clientDid?: string;
	clientEmail: string;
	callbackUrl?: string;
	projectTitle: string;
	scopeSummary: string;
	techStack?: string[];
	agreedPriceUSD?: number;
	deliveryDays?: number;
	crudEntities?: number;
	mobileScreens?: number;
	integrationsCount?: number;
	requiresCustomAiTraining?: boolean;
	paymentPreference?: PaymentRail;
};

export type CreateOrderResult =
	| {
			ok: true;
			order: ReturnType<typeof publicOrderView>;
			accessToken: string;
			statusUrl: string;
	  }
	| {
			ok: false;
			status: number;
			code: string;
			error: string;
			evaluation?: QuoteEvaluation;
	  };

export async function createAgentOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
	if (!canPersistAgentStore()) {
		return {
			ok: false,
			status: 503,
			code: 'STORE_UNAVAILABLE',
			error: 'Order store is not configured on this deployment.',
		};
	}

	const clientEmail = (params.clientEmail || '').trim();
	if (!EMAIL_RE.test(clientEmail)) {
		return {
			ok: false,
			status: 400,
			code: 'INVALID_CLIENT_EMAIL',
			error: 'A valid clientEmail address is required for SOW issuance, payment links, and repository transfer.',
		};
	}

	let existingQuote: AgentQuoteRecord | null = null;
	if (params.quoteId) {
		existingQuote = await getQuote(params.quoteId.trim());
		if (!existingQuote) {
			return {
				ok: false,
				status: 404,
				code: 'QUOTE_NOT_FOUND',
				error: `Quote ${params.quoteId} was not found or has expired.`,
			};
		}
		if (existingQuote.status === 'converted' && existingQuote.orderId) {
			return {
				ok: false,
				status: 409,
				code: 'QUOTE_ALREADY_CONVERTED',
				error: `Quote ${existingQuote.id} has already been converted to order ${existingQuote.orderId}.`,
			};
		}
	}

	const projectTitle = (params.projectTitle || existingQuote?.input.projectTitle || '').trim().slice(0, 140);
	const scopeSummary = (params.scopeSummary || existingQuote?.input.description || '').trim().slice(0, 8000);

	if (!projectTitle || scopeSummary.length < 12) {
		return {
			ok: false,
			status: 400,
			code: 'INVALID_SPEC',
			error: 'Both projectTitle and a concrete scopeSummary (min 12 chars) are required.',
		};
	}

	const techStack = params.techStack?.length
		? params.techStack
		: existingQuote?.evaluation.normalizedStack || [];
	const crudEntities = params.crudEntities ?? existingQuote?.evaluation.scopeMetrics.crudEntities;
	const mobileScreens = params.mobileScreens ?? existingQuote?.evaluation.scopeMetrics.mobileScreens;
	const integrationsCount = params.integrationsCount ?? existingQuote?.evaluation.scopeMetrics.integrationsCount;
	const requiresCustomAiTraining = params.requiresCustomAiTraining ?? existingQuote?.input.requiresCustomAiTraining;

	// If no explicit price/days passed, use the quote or deterministic recommended values
	const previewEval = evaluateProjectSpec({
		projectTitle,
		description: scopeSummary,
		techStack,
		crudEntities,
		mobileScreens,
		integrationsCount,
		requiresCustomAiTraining,
	});

	const agreedPriceUSD =
		typeof params.agreedPriceUSD === 'number' && Number.isFinite(params.agreedPriceUSD)
			? Math.round(params.agreedPriceUSD)
			: existingQuote?.evaluation.proposedPriceUSD || previewEval.recommendedPriceUSD;

	const deliveryDays =
		typeof params.deliveryDays === 'number' && Number.isFinite(params.deliveryDays)
			? Math.round(params.deliveryDays)
			: existingQuote?.evaluation.requiredDeliveryDays || previewEval.requiredDeliveryDays;

	// Hard programmatic boundary check (cannot be bypassed by LLM or client agent)
	const guardrailCheck = enforceOrderGuardrails({
		agreedPriceUSD,
		deliveryDays,
		description: scopeSummary,
		techStack,
		crudEntities,
		mobileScreens,
		integrationsCount,
		requiresCustomAiTraining,
	});

	if (!guardrailCheck.ok) {
		return {
			ok: false,
			status: 422,
			code: guardrailCheck.code,
			error: guardrailCheck.reason,
			evaluation: guardrailCheck.evaluation,
		};
	}

	const evaluation = guardrailCheck.evaluation;
	const rail: PaymentRail =
		params.paymentPreference && VALID_RAILS.includes(params.paymentPreference)
			? params.paymentPreference
			: existingQuote?.input.paymentPreference && VALID_RAILS.includes(existingQuote.input.paymentPreference)
				? existingQuote.input.paymentPreference
				: 'stripe';

	const orderId = generateId('tf_ord');
	const { rawToken, tokenHash } = generateOrderToken();
	const now = new Date().toISOString();
	const service = AGENT_SERVICES.find((s) => s.id === evaluation.serviceId) || AGENT_SERVICES[0];

	const payment = await createPaymentForOrder({
		orderId,
		projectTitle,
		clientEmail,
		amountUSD: agreedPriceUSD,
		deliveryDays,
		rail,
	});

	const phases: OrderPhaseState[] = evaluation.phases.map((p, idx) => ({
		...p,
		status: idx === 0 ? 'in_progress' : 'pending',
		updatedAt: idx === 0 ? now : undefined,
	}));

	const callbackUrl =
		params.callbackUrl && /^https:\/\//i.test(params.callbackUrl.trim())
			? params.callbackUrl.trim().slice(0, 500)
			: undefined;

	const order: AgentOrderRecord = {
		id: orderId,
		orderTokenHash: tokenHash,
		quoteId: existingQuote?.id,
		clientAgentId: (params.clientAgentId || existingQuote?.clientAgentId || 'autonomous-buyer').slice(0, 120),
		clientDid: (params.clientDid || existingQuote?.clientDid || '').slice(0, 200) || undefined,
		clientEmail,
		callbackUrl,
		projectTitle,
		scopeSummary,
		techStack: evaluation.normalizedStack,
		agreedPriceUSD,
		deliveryDays,
		tier: evaluation.tier,
		milestones: evaluation.milestones,
		sow: {
			sowId: `SOW-${orderId.replace(/^tf_ord_/, '').toUpperCase()}`,
			issuedAt: now,
			provider: 'TechFiyr',
			clientEmail,
			clientAgentId: (params.clientAgentId || 'autonomous-buyer').slice(0, 120),
			deliverables: service.deliverables,
			acceptanceCriteria: [
				'TypeScript / linter / unit tests pass inside clean Docker build',
				'Cloud staging URL live and verified against SOW scope',
				'GitHub repository transfer / org invite delivered to client principal',
			],
			guardrailsVerified: true,
		},
		currentPhase: phases[0].id,
		phases,
		payment,
		deliverables: {},
		notifications: {
			whatsappSent: false,
			webhookSent: false,
		},
		createdAt: now,
		updatedAt: now,
	};

	const notifyResult = await notifyFounderOrderEvent(order, 'deal_closed');
	order.notifications = notifyResult;

	await saveOrder(order);

	if (existingQuote) {
		await saveQuote({
			...existingQuote,
			status: 'converted',
			orderId: order.id,
		});
	}

	return {
		ok: true,
		order: publicOrderView(order),
		accessToken: rawToken,
		statusUrl: `${SITE_URL}/api/agent/orders/${order.id}`,
	};
}

export async function updateOrderFulfillment(
	orderId: string,
	patch: {
		currentPhase?: string;
		phaseStatus?: 'pending' | 'in_progress' | 'completed';
		repoUrl?: string;
		stagingUrl?: string;
		deliveryReportUrl?: string;
		paymentStatus?: AgentOrderRecord['payment']['status'];
	},
): Promise<AgentOrderRecord | null> {
	const order = await getOrder(orderId);
	if (!order) return null;

	const now = new Date().toISOString();
	let updatedPhases = [...order.phases];
	let currentPhase = order.currentPhase;

	if (patch.currentPhase) {
		const targetIdx = updatedPhases.findIndex((p) => p.id === patch.currentPhase);
		if (targetIdx >= 0) {
			currentPhase = patch.currentPhase;
			updatedPhases = updatedPhases.map((p, idx) => {
				if (idx < targetIdx) return { ...p, status: 'completed', updatedAt: p.updatedAt || now };
				if (idx === targetIdx) {
					return {
						...p,
						status: patch.phaseStatus || 'in_progress',
						updatedAt: now,
						artifactUrl: patch.stagingUrl || p.artifactUrl,
					};
				}
				return { ...p, status: 'pending' };
			});
		}
	}

	const updated: AgentOrderRecord = {
		...order,
		currentPhase,
		phases: updatedPhases,
		deliverables: {
			...order.deliverables,
			...(patch.repoUrl ? { repoUrl: patch.repoUrl.slice(0, 400) } : {}),
			...(patch.stagingUrl ? { stagingUrl: patch.stagingUrl.slice(0, 400) } : {}),
			...(patch.deliveryReportUrl ? { deliveryReportUrl: patch.deliveryReportUrl.slice(0, 400) } : {}),
		},
		payment: {
			...order.payment,
			...(patch.paymentStatus ? { status: patch.paymentStatus, updatedAt: now } : {}),
		},
		updatedAt: now,
	};

	await saveOrder(updated);
	return updated;
}

