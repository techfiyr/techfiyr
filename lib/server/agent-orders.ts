/*
 * Shared quote, AI-Developer-Ready SRS, and order orchestration for TechFiyr A2A & Email Commerce.
 * Used identically by Zoho Email Worker, Gemini Sales Agent, REST (/api/v1/agent-order, /api/agent/*),
 * MCP (/api/mcp), A2A (/api/agent/a2a), and the Admin Dashboard.
 */
import { AGENT_SERVICES, GUARDRAILS } from '@/lib/agent/catalog';
import {
	enforceOrderGuardrails,
	evaluateProjectSpec,
	VALID_PAYMENT_RAILS,
	type PaymentRail,
	type QuoteEvaluation,
	type QuoteInput,
} from '@/lib/agent/pricing';
import { inspectAgentInteraction, validateSafeCallbackUrl } from '@/lib/agent/security';
import { SITE_URL } from '@/lib/site';
import { normalizeSrs, srsToMarkdown, type AiDeveloperSrs } from '@/types/srs';
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
	type MilestoneStatus,
	type OrderPhaseState,
} from './agent-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
	inquiryId?: string;
	quoteId?: string;
	clientAgentId?: string;
	clientDid?: string;
	clientEmail: string;
	callbackUrl?: string;
	projectTitle: string;
	executiveOverview?: string;
	scopeSummary: string;
	techStack?: string[];
	agreedPriceUSD?: number;
	deliveryDays?: number;
	crudEntities?: number;
	mobileScreens?: number;
	integrationsCount?: number;
	requiresCustomAiTraining?: boolean;
	paymentPreference?: PaymentRail;
	cryptoTxHash?: string;
	payoneerReference?: string;
	srsOverride?: Partial<AiDeveloperSrs>;
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
	const clientEmail = (params.clientEmail || '').trim();
	if (!EMAIL_RE.test(clientEmail)) {
		return {
			ok: false,
			status: 400,
			code: 'INVALID_CLIENT_EMAIL',
			error: 'A valid clientEmail address is required for SOW issuance, payment coordinates, and repository transfer.',
		};
	}

	const callbackCheck = validateSafeCallbackUrl(params.callbackUrl);
	if (!callbackCheck.ok) {
		return {
			ok: false,
			status: 400,
			code: 'INVALID_CALLBACK_URL',
			error: callbackCheck.reason,
		};
	}

	const earlySecurity = inspectAgentInteraction(
		`${params.projectTitle || ''}\n${params.scopeSummary || ''}\n${params.executiveOverview || ''}`,
	);
	if (!earlySecurity.safe) {
		return {
			ok: false,
			status: 400,
			code: 'SECURITY_BLOCKED',
			error: earlySecurity.refusalMessage || 'Order blocked by TechFiyr security guardrails.',
		};
	}

	if (!canPersistAgentStore()) {
		return {
			ok: false,
			status: 503,
			code: 'STORE_UNAVAILABLE',
			error: 'Order store is not configured on this deployment.',
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

	const security = inspectAgentInteraction(`${projectTitle}\n${scopeSummary}\n${params.executiveOverview || ''}`);
	if (!security.safe) {
		return {
			ok: false,
			status: 400,
			code: 'SECURITY_BLOCKED',
			error: security.refusalMessage || 'Order blocked by TechFiyr security guardrails.',
		};
	}

	const techStack = params.techStack?.length
		? params.techStack
		: existingQuote?.evaluation.normalizedStack || [];
	const crudEntities = params.crudEntities ?? existingQuote?.evaluation.scopeMetrics.crudEntities;
	const mobileScreens = params.mobileScreens ?? existingQuote?.evaluation.scopeMetrics.mobileScreens;
	const integrationsCount = params.integrationsCount ?? existingQuote?.evaluation.scopeMetrics.integrationsCount;
	const requiresCustomAiTraining = params.requiresCustomAiTraining ?? existingQuote?.input.requiresCustomAiTraining;

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
		params.paymentPreference && VALID_PAYMENT_RAILS.includes(params.paymentPreference)
			? params.paymentPreference
			: existingQuote?.input.paymentPreference && VALID_PAYMENT_RAILS.includes(existingQuote.input.paymentPreference)
				? existingQuote.input.paymentPreference
				: 'crypto_usdc_solana';

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

	const srsJson = normalizeSrs(params.srsOverride, {
		projectId: orderId,
		projectTitle,
		scopeSummary: params.executiveOverview?.trim() || scopeSummary,
		techStack: evaluation.normalizedStack,
		deliveryDays,
	});
	const srsMarkdown = srsToMarkdown(srsJson);

	const phases: OrderPhaseState[] = evaluation.phases.map((p, idx) => ({
		...p,
		status: idx === 0 ? 'in_progress' : 'pending',
		updatedAt: idx === 0 ? now : undefined,
	}));

	const callbackUrl = callbackCheck.url;

	const initialMilestoneStatus: MilestoneStatus =
		params.cryptoTxHash || params.payoneerReference ? 'UPFRONT_PAID' : 'AWAITING_DEPOSIT';

	const order: AgentOrderRecord = {
		id: orderId,
		orderTokenHash: tokenHash,
		inquiry_id: params.inquiryId,
		quoteId: existingQuote?.id,
		clientAgentId: (params.clientAgentId || existingQuote?.clientAgentId || 'autonomous-buyer').slice(0, 120),
		clientDid: (params.clientDid || existingQuote?.clientDid || '').slice(0, 200) || undefined,
		client_contact: clientEmail,
		clientEmail,
		callbackUrl,
		projectTitle,
		executive_overview: srsJson.executive_overview,
		scopeSummary,
		techStack: evaluation.normalizedStack,
		total_price_usd: agreedPriceUSD,
		agreedPriceUSD,
		timeline_days: deliveryDays,
		deliveryDays,
		tier: evaluation.tier,
		milestone_status: initialMilestoneStatus,
		milestones: evaluation.milestones,
		crypto_chain: payment.crypto_chain || rail,
		crypto_tx_hash: (params.cryptoTxHash || '').trim().slice(0, 200),
		payoneer_reference: (params.payoneerReference || '').trim().slice(0, 200),
		srs_markdown: srsMarkdown,
		srs_json: srsJson,
		sow: {
			sowId: `SOW-${orderId.replace(/^tf_ord_/, '').toUpperCase()}`,
			issuedAt: now,
			provider: 'TechFiyr',
			clientEmail,
			clientAgentId: (params.clientAgentId || 'autonomous-buyer').slice(0, 120),
			deliverables: service.deliverables,
			acceptanceCriteria: srsJson.acceptance_criteria.map((c) => `[${c.id}] ${c.assertion}`),
			guardrailsVerified: true,
		},
		currentPhase: phases[0].id,
		phases,
		payment: {
			...payment,
			...(initialMilestoneStatus === 'UPFRONT_PAID' ? { status: 'upfront_25_paid' } : {}),
			...(params.cryptoTxHash ? { crypto_tx_hash: params.cryptoTxHash.trim() } : {}),
			...(params.payoneerReference ? { payoneer_reference: params.payoneerReference.trim() } : {}),
		},
		deliverables: {},
		notifications: {
			emailAlertSent: false,
			webhookSent: false,
		},
		created_at: now,
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
		milestoneStatus?: MilestoneStatus;
		cryptoChain?: string;
		cryptoTxHash?: string;
		payoneerReference?: string;
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

	const milestoneStatus = patch.milestoneStatus || order.milestone_status;
	const inferredPaymentStatus: AgentOrderRecord['payment']['status'] =
		patch.paymentStatus ||
		(milestoneStatus === 'UPFRONT_PAID'
			? 'upfront_25_paid'
			: milestoneStatus === 'MVP_DELIVERED'
				? 'staging_50_paid'
				: milestoneStatus === 'FULLY_PAID'
					? 'fully_paid'
					: order.payment.status);

	const updated: AgentOrderRecord = {
		...order,
		currentPhase,
		phases: updatedPhases,
		milestone_status: milestoneStatus,
		crypto_chain: patch.cryptoChain !== undefined ? patch.cryptoChain.slice(0, 80) : order.crypto_chain,
		crypto_tx_hash: patch.cryptoTxHash !== undefined ? patch.cryptoTxHash.slice(0, 200) : order.crypto_tx_hash,
		payoneer_reference:
			patch.payoneerReference !== undefined ? patch.payoneerReference.slice(0, 200) : order.payoneer_reference,
		deliverables: {
			...order.deliverables,
			...(patch.repoUrl ? { repoUrl: patch.repoUrl.slice(0, 400) } : {}),
			...(patch.stagingUrl ? { stagingUrl: patch.stagingUrl.slice(0, 400) } : {}),
			...(patch.deliveryReportUrl ? { deliveryReportUrl: patch.deliveryReportUrl.slice(0, 400) } : {}),
		},
		payment: {
			...order.payment,
			status: inferredPaymentStatus,
			...(patch.cryptoChain ? { crypto_chain: patch.cryptoChain } : {}),
			...(patch.cryptoTxHash ? { crypto_tx_hash: patch.cryptoTxHash } : {}),
			...(patch.payoneerReference ? { payoneer_reference: patch.payoneerReference } : {}),
			updatedAt: now,
		},
		updatedAt: now,
	};

	await saveOrder(updated);
	return updated;
}
