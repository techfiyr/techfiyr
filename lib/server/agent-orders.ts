/*
 * Shared quote, AI-Developer-Ready SRS, and order orchestration for TechFiyr A2A & Email Commerce.
 * Used identically by Zoho Email Worker, Gemini Sales Agent, REST (/api/v1/agent-order, /api/agent/*),
 * MCP (/api/mcp), A2A (/api/agent/a2a), and the Admin Dashboard.
 */
import { AGENT_SERVICES, GUARDRAILS, MEETING_BOOKING_URL } from '@/lib/agent/catalog';
import {
	enforceOrderGuardrails,
	evaluateProjectSpec,
	VALID_PAYMENT_RAILS,
	type PaymentRail,
	type QuoteEvaluation,
	type QuoteInput,
} from '@/lib/agent/pricing';
import {
	inspectAgentInteraction,
	isGenericAgentIdentity,
	validateSafeCallbackUrl,
} from '@/lib/agent/security';
import { CONTACT, SITE_URL } from '@/lib/site';
import { normalizeSrs, srsToMarkdown, type AiDeveloperSrs } from '@/types/srs';
import { notifyFounderOrderEvent } from './agent-notify';
import { createPaymentForOrder } from './agent-payments';
import {
	canPersistAgentStore,
	generateId,
	generateOrderToken,
	getInquiry,
	getOrder,
	getQuote,
	publicOrderView,
	saveInquiry,
	saveOrder,
	saveQuote,
	type AgentOrderRecord,
	type AgentQuoteRecord,
	type MilestoneStatus,
	type OrderPhaseState,
} from './agent-store';
import { sendAgentEmail } from './emailWorker';

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
		clientAgentId: (params.clientAgentId || '').slice(0, 120),
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
	clientName?: string;
	companyName?: string;
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
	if (!EMAIL_RE.test(clientEmail) || isGenericAgentIdentity(clientEmail) || clientEmail.endsWith('@a2a.client')) {
		return {
			ok: false,
			status: 400,
			code: 'CLIENT_VERIFICATION_REQUIRED',
			error: 'Order verification required: To verify this is a real order rather than a test or fake order, a verified client email address is required before order acceptance.',
		};
	}

	const hasIdentifiedClient = Boolean(
		(params.clientName && !isGenericAgentIdentity(params.clientName)) ||
		(params.companyName && !isGenericAgentIdentity(params.companyName)) ||
		(params.clientAgentId && !isGenericAgentIdentity(params.clientAgentId))
	);
	if (!hasIdentifiedClient) {
		return {
			ok: false,
			status: 400,
			code: 'CLIENT_VERIFICATION_REQUIRED',
			error: 'Order verification required: To verify this is a real order rather than a test or fake order, client name, company name, or agent operator name is required before order acceptance.',
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

	const initialMilestoneStatus: MilestoneStatus =
		params.cryptoTxHash ? 'UPFRONT_PAID' : 'AWAITING_DEPOSIT';

	const phases: OrderPhaseState[] = evaluation.phases.map((p) => ({
		...p,
		status: 'pending',
		updatedAt: undefined,
	}));

	const callbackUrl = callbackCheck.url;

	const order: AgentOrderRecord = {
		id: orderId,
		orderTokenHash: tokenHash,
		inquiry_id: params.inquiryId,
		quoteId: existingQuote?.id,
		clientAgentId: (params.clientAgentId || existingQuote?.clientAgentId || '').slice(0, 120),
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
		bank_reference: '',
		payoneer_reference: '',
		started_at: undefined,
		deadline: undefined,
		srs_markdown: srsMarkdown,
		srs_json: srsJson,
		sow: {
			sowId: `SOW-${orderId.replace(/^tf_ord_/, '').toUpperCase()}`,
			issuedAt: now,
			provider: 'TechFiyr',
			clientEmail,
			clientAgentId: (params.clientAgentId || existingQuote?.clientAgentId || '').slice(0, 120),
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

	const notifyResult = await notifyFounderOrderEvent(order, 'order_placed');
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
		bankReference?: string;
		repoUrl?: string;
		stagingUrl?: string;
		deliveryReportUrl?: string;
		paymentStatus?: AgentOrderRecord['payment']['status'];
		notes?: string;
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
		bank_reference: patch.bankReference !== undefined ? patch.bankReference.slice(0, 200) : order.bank_reference,
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
			updatedAt: now,
		},
		updatedAt: now,
	};

	await saveOrder(updated);

	// Post sales agent update notice to inquiry thread
	if (order.inquiry_id) {
		const inq = await getInquiry(order.inquiry_id);
		if (inq) {
			const updateNotice = [
				`📢 **TechFiyr Order Status Update (Order ${order.id}):**`,
				'',
				`- **Project:** ${order.projectTitle}`,
				`- **Milestone Status:** ${updated.milestone_status}`,
				`- **Active Phase:** ${updated.currentPhase} (${patch.phaseStatus || 'in_progress'})`,
				...(patch.stagingUrl ? [`- **Live Staging Environment:** ${patch.stagingUrl}`] : []),
				...(patch.repoUrl ? [`- **GitHub Source Code Repository:** ${patch.repoUrl}`] : []),
				...(patch.notes ? [`- **Engineering Note:** ${patch.notes}`] : []),
				`- **Updated:** ${new Date(now).toUTCString()}`,
				'',
				`Our engineering team is actively executing according to your agreed SRS milestones. Reach out at ${MEETING_BOOKING_URL} or WhatsApp ${CONTACT.phoneDisplay} for live sync.`,
			].join('\n');

			const msgs = Array.isArray(inq.messages) ? [...inq.messages] : [];
			msgs.push({
				timestamp: now,
				role: 'sales_agent',
				text: updateNotice,
			});
			await saveInquiry({
				...inq,
				messages: msgs,
				updated_at: now,
			});
		}
	}

	// Send notifications on status change
	if (updated.clientEmail && !updated.clientEmail.endsWith('@a2a.client')) {
		await sendAgentEmail({
			to: updated.clientEmail,
			fromName: 'TechFiyr Engineering',
			subject: `[TechFiyr] Order Status Update: ${order.projectTitle} (${updated.milestone_status})`,
			bodyText: `Status update for ${order.projectTitle} (${order.id}):\nMilestone: ${updated.milestone_status}\nPhase: ${updated.currentPhase}\n${patch.stagingUrl ? `Staging: ${patch.stagingUrl}\n` : ''}${patch.repoUrl ? `Repo: ${patch.repoUrl}\n` : ''}\nContact: https://techfiyr.com/contact#contact`,
		}).catch(() => {});
	}

	return updated;
}

/**
 * Confirms 25% upfront payment received for an order, advancing status to UPFRONT_PAID.
 */
export async function confirmOrderUpfrontPayment(
	orderId: string,
	details?: {
		txHash?: string;
		bankReference?: string;
		confirmedBy?: string;
		notes?: string;
	},
): Promise<{ ok: boolean; order?: AgentOrderRecord; error?: string }> {
	const order = await getOrder(orderId);
	if (!order) return { ok: false, error: `Order ${orderId} not found.` };

	const now = new Date().toISOString();
	const updated: AgentOrderRecord = {
		...order,
		milestone_status: 'UPFRONT_PAID',
		crypto_tx_hash: details?.txHash ? details.txHash.trim().slice(0, 200) : order.crypto_tx_hash,
		bank_reference: details?.bankReference ? details.bankReference.trim().slice(0, 200) : order.bank_reference,
		payment: {
			...order.payment,
			status: 'upfront_25_paid',
			...(details?.txHash ? { crypto_tx_hash: details.txHash.trim() } : {}),
			updatedAt: now,
		},
		updatedAt: now,
	};

	await saveOrder(updated);

	// Post confirmation notice to the linked inquiry thread
	if (order.inquiry_id) {
		const inq = await getInquiry(order.inquiry_id);
		if (inq) {
			const confirmNotice = [
				`TechFiyr Founder Notice: 25% Upfront Deposit ($${order.payment.upfrontDepositUSD} USD) Confirmed!`,
				'',
				`We have verified your deposit${details?.txHash ? ` (Tx: ${details.txHash})` : details?.bankReference ? ` (Ref: ${details.bankReference})` : ''}.`,
				`Order ${order.id} status is now UPFRONT_PAID. Founders will kick off development shortly.`,
				'',
				`Kickoff Meeting: Please book your discovery & kickoff meeting with our team at ${MEETING_BOOKING_URL} or WhatsApp ${CONTACT.phoneDisplay}.`,
			].join('\n');

			const msgs = Array.isArray(inq.messages) ? [...inq.messages] : [];
			msgs.push({
				timestamp: now,
				role: 'sales_agent',
				text: confirmNotice,
			});

			await saveInquiry({
				...inq,
				messages: msgs,
				updated_at: now,
			});
		}
	}

	if (updated.clientEmail && !updated.clientEmail.endsWith('@a2a.client') && !isGenericAgentIdentity(updated.clientEmail)) {
		await sendAgentEmail({
			to: updated.clientEmail,
			fromName: 'TechFiyr Finance',
			subject: `[TechFiyr] Upfront Deposit Verified: ${order.projectTitle} (${order.id})`,
			bodyText: `Your 25% upfront deposit ($${order.payment.upfrontDepositUSD} USD) for "${order.projectTitle}" has been confirmed.\n\nNext Step: Schedule your kickoff & discovery meeting with our founders & lead developers at ${MEETING_BOOKING_URL} or WhatsApp ${CONTACT.phoneDisplay}.`,
		}).catch(() => {});
	}

	await notifyFounderOrderEvent(updated, 'payment_confirmed').catch(() => {});

	return { ok: true, order: updated };
}

/**
 * Starts order development officially by human founders.
 * Sets started_at and calculates delivery deadline based on timeline_days SLA.
 * Sets Phase 1 to in_progress, posts announcement to inquiry thread, and notifies client and founder.
 */
export async function startOrderDevelopment(
	orderId: string,
	details?: {
		startedBy?: string;
		notes?: string;
	},
): Promise<{ ok: boolean; order?: AgentOrderRecord; error?: string }> {
	const order = await getOrder(orderId);
	if (!order) return { ok: false, error: `Order ${orderId} not found.` };

	const now = new Date().toISOString();
	const deadline = new Date(Date.now() + order.timeline_days * 86400000).toISOString();

	const updatedPhases: OrderPhaseState[] = order.phases.map((p, idx) => ({
		...p,
		status: idx === 0 ? 'in_progress' : p.status,
		updatedAt: idx === 0 ? now : p.updatedAt,
	}));

	const updated: AgentOrderRecord = {
		...order,
		started_at: now,
		deadline,
		currentPhase: updatedPhases[0]?.id || order.currentPhase,
		phases: updatedPhases,
		milestone_status: order.milestone_status === 'AWAITING_DEPOSIT' ? 'UPFRONT_PAID' : order.milestone_status,
		payment: {
			...order.payment,
			status: order.payment.status === 'awaiting_upfront_25' ? 'upfront_25_paid' : order.payment.status,
			updatedAt: now,
		},
		updatedAt: now,
	};

	await saveOrder(updated);

	// Post announcement from Sales Agent into the inquiry thread
	if (order.inquiry_id) {
		const inq = await getInquiry(order.inquiry_id);
		if (inq) {
			const startNotice = [
				`🚀 **Order Development Officially Started by TechFiyr Engineering Team!**`,
				'',
				`Order **${order.id}** for "${order.projectTitle}" has been officially approved and started by our engineering leads${details?.startedBy ? ` (${details.startedBy})` : ''}.`,
				'',
				`**Sprint Delivery Timeline:**`,
				`- **Started At:** ${new Date(now).toUTCString()}`,
				`- **Turnaround SLA:** ${order.timeline_days} Days`,
				`- **Target Handover Deadline:** ${new Date(deadline).toUTCString()}`,
				`- **Current Phase:** Phase 1 (${order.phases[0]?.phase || 'Architecture & Repository Scaffold'})`,
				...(details?.notes ? [`- **Engineering Note:** ${details.notes}`] : []),
				'',
				`Our lead engineer is actively scaffolding the repository, configuring Docker containers, and setting up the database schema per your agreed SRS specification.`,
				'',
				`*Track your order in real time or book a developer sync at ${MEETING_BOOKING_URL} or WhatsApp ${CONTACT.phoneDisplay}.*`,
			].join('\n');

			const msgs = Array.isArray(inq.messages) ? [...inq.messages] : [];
			msgs.push({
				timestamp: now,
				role: 'sales_agent',
				text: startNotice,
			});
			await saveInquiry({
				...inq,
				status: 'CLOSED',
				messages: msgs,
				updated_at: now,
			});
		}
	}

	// Send notification to founder and client
	await notifyFounderOrderEvent(updated, 'order_placed');
	if (updated.clientEmail && !updated.clientEmail.endsWith('@a2a.client')) {
		await sendAgentEmail({
			to: updated.clientEmail,
			fromName: 'TechFiyr Engineering',
			subject: `[TechFiyr] Sprint Started: ${order.projectTitle} (${order.id})`,
			bodyText: `Your TechFiyr development sprint for ${order.projectTitle} has officially started! Handover deadline: ${new Date(deadline).toUTCString()}.\n\nTrack progress: https://techfiyr.com/admin/agent?order=${order.id}`,
		}).catch(() => {});
	}

	return { ok: true, order: updated };
}

/**
 * Sends a polite payment reminder to the client/agent if their order is awaiting the 25% deposit.
 */
export async function sendOrderPaymentReminder(
	orderId: string,
): Promise<{ ok: boolean; order?: AgentOrderRecord; messageSent?: string; error?: string }> {
	const order = await getOrder(orderId);
	if (!order) return { ok: false, error: `Order ${orderId} not found.` };

	if (order.milestone_status !== 'AWAITING_DEPOSIT' && order.payment.status !== 'awaiting_upfront_25') {
		return { ok: false, error: `Order ${orderId} deposit is already confirmed (${order.milestone_status}).` };
	}

	const now = new Date().toISOString();
	const upfront = order.payment.upfrontDepositUSD;
	const rail = order.payment.rail;
	const receivingAddress = order.payment.wallet_address || 'Provided in SOW / on invoice';

	const reminderText = [
		`Payment Reminder from TechFiyr Sales Agent:`,
		'',
		`Your Order ${order.id} for "${order.projectTitle}" is currently awaiting the 25% upfront deposit ($${upfront} USD).`,
		'',
		`Important Policy Notice: Per TechFiyr engineering protocol, sprint development will NOT begin until the 25% upfront deposit is confirmed by our founders.`,
		'',
		`Deposit Instructions:`,
		`- Amount Due: $${upfront} USD (${order.payment.currency || 'USD'})`,
		`- Rail / Channel: ${rail}`,
		`- Receiving Destination: ${receivingAddress}`,
		'',
		`If you are paying via alternative payment methods (Bank Wire / Fiat Invoice), please book a confirmation meeting with our founders at https://techfiyr.com/contact#contact or WhatsApp +880 1540659530.`,
		'',
		`Once you have sent the deposit, please reply here with the transaction hash or confirmation so our founders can verify and immediately kick off Day 1 development!`,
	].join('\n');

	if (order.inquiry_id) {
		const inq = await getInquiry(order.inquiry_id);
		if (inq) {
			const msgs = Array.isArray(inq.messages) ? [...inq.messages] : [];
			msgs.push({
				timestamp: now,
				role: 'sales_agent',
				text: reminderText,
			});
			await saveInquiry({
				...inq,
				messages: msgs,
				updated_at: now,
			});
		}
	}

	if (order.clientEmail && !order.clientEmail.endsWith('@a2a.client') && !isGenericAgentIdentity(order.clientEmail)) {
		await sendAgentEmail({
			to: order.clientEmail,
			fromName: 'TechFiyr Sales Agent',
			subject: `[TechFiyr] Upfront Deposit Reminder: ${order.projectTitle} (${order.id})`,
			bodyText: reminderText,
		}).catch(() => {});
	}

	return { ok: true, order, messageSent: reminderText };
}
