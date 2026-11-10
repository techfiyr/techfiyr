/*
 * Gemini Sales & Deal-Closing Agent (salesAgent.ts) for TechFiyr.
 * Enforces 7-day delivery turnaround, $600 USD minimum floor price, 25% / 50% / 25% milestones,
 * supported tech stacks (Next.js/React, Flutter/React Native, Node.js/PostgreSQL/Supabase, Docker),
 * Crypto (Solana/Base USDC, TRC20/Polygon USDT) & Payoneer payment routing,
 * and invokes closeDealAndGenerateOrder to emit an Order + AI-Developer-Ready SRS.
 */
import { GUARDRAILS, SALES_AGENT_EMAIL } from '@/lib/agent/catalog';
import {
	enforceOrderGuardrails,
	evaluateProjectSpec,
	VALID_PAYMENT_RAILS,
	type PaymentRail,
	type QuoteEvaluation,
} from '@/lib/agent/pricing';
import type { AiDeveloperSrs } from '@/types/srs';
import { createAgentOrder } from './agent-orders';
import { formatPaymentInstructionsBlock } from './agent-payments';
import {
	generateId,
	getInquiry,
	getSession,
	publicOrderView,
	saveInquiry,
	saveSession,
	type InquiryMessage,
	type InquiryRecord,
	type NegotiationSessionRecord,
	type NegotiationTurn,
} from './agent-store';
import { geminiApiKey } from './gemini';
import { env } from './google';

export const SALES_AGENT_SYSTEM_INSTRUCTION = `You are Saurav Wahid's Autonomous Lead Solutions Architect and Sales Closer at TechFiyr (${SALES_AGENT_EMAIL} | https://techfiyr.com).
Your mission is to scope, negotiate, and close custom software projects with human clients and autonomous buyer agents via email and A2A channels.

NON-NEGOTIABLE RULES & GUARDRAILS:
1. Minimum Price Floor: $${GUARDRAILS.minFloorPriceUSD} USD. Never propose, accept, or confirm any project below $${GUARDRAILS.minFloorPriceUSD} USD.
2. 7-Day Turnaround Delivery Model:
   - Standard 7-Day MVP Sprint ($${GUARDRAILS.minFloorPriceUSD}+ USD): up to ${GUARDRAILS.maxCrudEntities7Day} CRUD entities (web) or ${GUARDRAILS.maxMobileScreens7Day} core screens (mobile), auth, and up to ${GUARDRAILS.maxThirdPartyIntegrations7Day} third-party integrations.
   - Extended 14-Day Build ($${GUARDRAILS.extendedMinPriceUSD}+ USD): required if scope exceeds 5 entities, 4 mobile screens, 3 integrations, or requires custom AI/RAG training.
3. Milestone Payment Schedule (STRICT):
   - 25% Upfront Deposit (Day 1: schema + modular boilerplate start)
   - 50% Staging MVP Delivery (Day 4: live staging build verification)
   - 25% Final Code Handover (Day 7: QA pass + GitHub repo transfer)
4. Accepted Payment Channels (NO Stripe):
   - Crypto: USDC on Solana (SPL) or Base (EVM), plus USDT (TRC20/Polygon, Binance P2P ready)
   - Fiat: Payoneer Virtual Receiving Account or Bank Transfer Invoice
5. Supported Tech Stacks:
   - Next.js / React, Flutter / React Native, Node.js / PostgreSQL / Supabase, Docker (plus FastAPI, Java Spring Boot, Laravel).
6. Tone: Direct, authoritative, senior engineering tone. Concise email/A2A formatting with zero marketing fluff.
7. Tool Execution: Invoke 'closeDealAndGenerateOrder' ONLY when the client explicitly confirms agreement to the scope, total price, 7-day/14-day timeline, and 25% upfront deposit terms (or provides a deposit tx hash / Payoneer confirmation), AND provide a valid clientContact email and complete AI-Developer-Ready SRS schema.`;

export const SALES_AGENT_TOOLS = [
	{
		functionDeclarations: [
			{
				name: 'closeDealAndGenerateOrder',
				description:
					'Closes the deal when client accepts terms and 25% deposit schedule. Creates an Order with payment coordinates (Solana/Base USDC, USDT, Payoneer) and an AI-Developer-Ready SRS.',
				parameters: {
					type: 'OBJECT',
					properties: {
						clientContact: { type: 'STRING', description: 'Client email address.' },
						projectTitle: { type: 'STRING', description: 'Concise project title.' },
						agreedPriceUSD: { type: 'NUMBER', description: 'Total agreed price in USD (minimum 600).' },
						deliveryDays: { type: 'NUMBER', description: 'Delivery timeline in days (minimum 7).' },
						paymentPreference: {
							type: 'STRING',
							description: 'One of: crypto_usdc_solana, crypto_usdc_base, crypto_usdt_trc20, crypto_usdt_polygon, payoneer, bank_invoice',
						},
						executiveOverview: { type: 'STRING', description: 'Executive summary of scope and deliverables.' },
						techStack: { type: 'ARRAY', items: { type: 'STRING' } },
						architecturePattern: { type: 'STRING', description: 'e.g. modular-monorepo' },
						databaseModelsJson: {
							type: 'STRING',
							description: 'JSON string array of database_models [{ table_name, description, columns, foreign_keys }].',
						},
						apiEndpointsJson: {
							type: 'STRING',
							description: 'JSON string array of api_endpoints [{ method, route, auth_required, description, request_payload, response_schema }].',
						},
						uiScreensJson: {
							type: 'STRING',
							description: 'JSON string array of ui_screens [{ screen_id, route, title, components, user_interactions }].',
						},
						acceptanceCriteriaJson: {
							type: 'STRING',
							description: 'JSON string array of acceptance_criteria [{ id, category, assertion, verification_command }].',
						},
					},
					required: ['clientContact', 'projectTitle', 'agreedPriceUSD', 'deliveryDays', 'executiveOverview'],
				},
			},
		],
	},
];

export type SalesAgentInput = {
	inquiryId?: string;
	sessionId?: string;
	threadId?: string;
	subject?: string;
	channel?: 'gmail' | 'zoho_email' | 'email' | 'a2a' | 'mcp';
	clientAgentId?: string;
	clientDid?: string;
	clientEmail?: string;
	clientName?: string;
	message?: string;
	projectTitle?: string;
	description?: string;
	techStack?: string[];
	crudEntities?: number;
	mobileScreens?: number;
	integrationsCount?: number;
	requiresCustomAiTraining?: boolean;
	budgetUSD?: number;
	requestedDays?: number;
	paymentPreference?: PaymentRail;
	acceptOffer?: boolean;
};

export type SalesAgentResult = {
	inquiryId: string;
	sessionId: string;
	status: 'open' | 'deal_closed' | 'rejected';
	reply: string;
	decision: QuoteEvaluation['decision'];
	evaluation: QuoteEvaluation;
	dealClosed: boolean;
	order?: ReturnType<typeof publicOrderView>;
	accessToken?: string;
	statusUrl?: string;
	paymentInstructions?: string;
	usedLlm: boolean;
	persisted: boolean;
};

type GeminiFunctionCall = {
	name?: string;
	args?: Record<string, unknown>;
};

function safeJsonArray<T>(raw: unknown): T[] | undefined {
	if (Array.isArray(raw)) return raw as T[];
	if (typeof raw !== 'string' || !raw.trim()) return undefined;
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as T[]) : undefined;
	} catch {
		return undefined;
	}
}

async function callGeminiSalesCloser(
	turns: NegotiationTurn[],
	evaluation: QuoteEvaluation,
	contextSummary: string,
): Promise<{ text: string; functionCall?: GeminiFunctionCall; usedLlm: boolean }> {
	const apiKey = geminiApiKey();
	if (!apiKey) return { text: '', usedLlm: false };

	const modelsToTry = [
		env('GEMINI_MODEL'),
		'gemini-2.5-flash',
		'gemini-2.0-flash',
		'gemini-1.5-flash',
		'gemini-2.0-flash-lite',
		'gemini-1.5-pro',
	].filter((m): m is string => Boolean(m));

	const guardrailContext = `PROGRAMMATIC PRICING GUARDRAIL VERDICT (NON-NEGOTIABLE):
- Decision: ${evaluation.decision} (${evaluation.reasonCode})
- Reason: ${evaluation.reason}
- Tier: ${evaluation.tier} (${evaluation.requiredDeliveryDays} days)
- Floor Price: $${evaluation.floorPriceUSD} USD
- Recommended Price: $${evaluation.recommendedPriceUSD} USD
- Minimum Acceptable Price: $${evaluation.minimumAcceptableUSD} USD
- Proposed Price: $${evaluation.proposedPriceUSD} USD
- Milestones: 25% Upfront ($${evaluation.milestones[0]?.amountUSD || Math.round(evaluation.proposedPriceUSD * 0.25)}), 50% Staging MVP ($${evaluation.milestones[1]?.amountUSD || Math.round(evaluation.proposedPriceUSD * 0.5)}), 25% Final Handover ($${evaluation.milestones[2]?.amountUSD || Math.round(evaluation.proposedPriceUSD * 0.25)})
- Normalized Stack: ${evaluation.normalizedStack.join(', ') || 'None'}
${contextSummary}`;

	const contents = turns.slice(-12).map((t) => ({
		role: t.role === 'buyer_agent' ? 'user' : 'model',
		parts: [{ text: t.content }],
	}));

	if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
		const last = contents[contents.length - 1];
		last.parts = [{ text: `${last.parts[0].text}\n\n[INTERNAL PRICING GUARDRAIL CONTEXT]\n${guardrailContext}` }];
	}

	for (let i = 0; i < modelsToTry.length; i++) {
		const model = modelsToTry[i];
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 25000);

		try {
			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						systemInstruction: { parts: [{ text: SALES_AGENT_SYSTEM_INSTRUCTION }] },
						contents,
						tools: SALES_AGENT_TOOLS,
						generationConfig: {
							temperature: 0.3,
							maxOutputTokens: 1200,
						},
					}),
					signal: controller.signal,
					cache: 'no-store',
				},
			);
			clearTimeout(timeout);

			if (!res.ok) {
				if (i < modelsToTry.length - 1) continue;
				break;
			}

			const data = (await res.json()) as {
				candidates?: {
					content?: {
						parts?: {
							text?: string;
							functionCall?: GeminiFunctionCall;
						}[];
					};
				}[];
			};

			const parts = data.candidates?.[0]?.content?.parts || [];
			const textPart = parts.map((p) => p.text).filter(Boolean).join('\n').trim();
			const fnPart = parts.find((p) => p.functionCall)?.functionCall;

			if (textPart || fnPart) {
				return { text: textPart, functionCall: fnPart, usedLlm: true };
			}
		} catch {
			clearTimeout(timeout);
			if (i < modelsToTry.length - 1) continue;
		}
	}

	return { text: '', usedLlm: false };
}

export async function runSalesAgent(input: SalesAgentInput): Promise<SalesAgentResult> {
	const existingSession = input.sessionId ? await getSession(input.sessionId.trim()) : null;
	const existingInquiry =
		(input.inquiryId ? await getInquiry(input.inquiryId.trim()) : null) ||
		(existingSession?.inquiryId ? await getInquiry(existingSession.inquiryId) : null);

	const now = new Date().toISOString();
	const sessionId = existingSession?.id || generateId('tf_neg');
	const inquiryId = existingInquiry?.id || input.inquiryId || generateId('tf_inq');

	const priorBuyerMessages = existingSession
		? existingSession.turns
				.filter((t) => t.role === 'buyer_agent')
				.map((t) => t.content)
				.join('\n')
		: existingInquiry
			? existingInquiry.messages
					.filter((m) => m.role === 'client')
					.map((m) => m.text)
					.join('\n')
			: '';

	const combinedDescription = [input.description, input.message, priorBuyerMessages]
		.filter((s): s is string => Boolean(s && s.trim()))
		.join('\n')
		.trim()
		.slice(0, 8000);

	const evaluation = evaluateProjectSpec({
		projectTitle: input.projectTitle || existingInquiry?.subject,
		description: combinedDescription,
		techStack: input.techStack,
		crudEntities: input.crudEntities,
		mobileScreens: input.mobileScreens,
		integrationsCount: input.integrationsCount,
		requiresCustomAiTraining: input.requiresCustomAiTraining,
		budgetUSD: input.budgetUSD,
		requestedDays: input.requestedDays,
		paymentPreference: input.paymentPreference,
	});

	const buyerText = (input.message || input.description || '').trim() || 'Requesting project quote & scoping.';
	const clientEmail = (input.clientEmail || existingInquiry?.sender_email || existingSession?.clientEmail || '').trim();
	const clientAgentId = (input.clientAgentId || existingSession?.clientAgentId || 'autonomous-buyer').slice(0, 120);

	const baseTurns: NegotiationTurn[] =
		existingSession?.turns ||
		(existingInquiry?.messages.map((m) => ({
			role: m.role === 'client' ? ('buyer_agent' as const) : ('sales_agent' as const),
			content: m.text,
			timestamp: m.timestamp,
		})) ??
			[]);

	// Avoid duplicating the latest buyer message if the caller (e.g. emailWorker) already pushed it onto inquiry
	const lastTurn = baseTurns[baseTurns.length - 1];
	const turns: NegotiationTurn[] =
		lastTurn && lastTurn.role === 'buyer_agent' && lastTurn.content === buyerText
			? [...baseTurns]
			: [...baseTurns, { role: 'buyer_agent', content: buyerText, timestamp: now }];

	const contextSummary = [
		`- Client Contact Email: ${clientEmail || 'NOT PROVIDED YET'}`,
		`- Explicit acceptOffer Flag: ${Boolean(input.acceptOffer)}`,
		`- Project Title: ${input.projectTitle || existingInquiry?.subject || 'Custom Software Build'}`,
	].join('\n');

	const llmResult = await callGeminiSalesCloser(turns, evaluation, contextSummary);

	let dealClosed = false;
	let createdOrder: ReturnType<typeof publicOrderView> | undefined;
	let accessToken: string | undefined;
	let statusUrl: string | undefined;
	let paymentInstructions: string | undefined;
	let reply = llmResult.text;

	const toolInvoked = llmResult.functionCall?.name === 'closeDealAndGenerateOrder';
	const buyerConfirmedText = /\b(accept|confirm|approve|proceed|close|deal|lock|agreed|send invoice|send wallet|ready to pay)\b/i.test(
		buyerText,
	);
	const wantsClose = Boolean(input.acceptOffer) || (toolInvoked && buyerConfirmedText);

	if (wantsClose && evaluation.decision === 'approved') {
		const fnArgs = llmResult.functionCall?.args || {};
		const targetEmail = String(clientEmail || fnArgs.clientContact || '').trim();
		const targetTitle = String(input.projectTitle || fnArgs.projectTitle || existingInquiry?.subject || 'TechFiyr Build').trim();
		const executiveOverview = String(fnArgs.executiveOverview || input.description || combinedDescription).trim();
		const targetPrice =
			typeof input.budgetUSD === 'number' && Number.isFinite(input.budgetUSD)
				? input.budgetUSD
				: typeof fnArgs.agreedPriceUSD === 'number'
					? Number(fnArgs.agreedPriceUSD)
					: evaluation.proposedPriceUSD;
		const targetDays =
			typeof input.requestedDays === 'number' && Number.isFinite(input.requestedDays)
				? Math.round(input.requestedDays)
				: evaluation.requiredDeliveryDays;

		const rawRail = String(input.paymentPreference || fnArgs.paymentPreference || '').trim() as PaymentRail;
		const paymentPref: PaymentRail = VALID_PAYMENT_RAILS.includes(rawRail) ? rawRail : 'crypto_usdc_solana';

		const check = enforceOrderGuardrails({
			agreedPriceUSD: targetPrice,
			deliveryDays: targetDays,
			description: executiveOverview,
			techStack: evaluation.normalizedStack,
			crudEntities: evaluation.scopeMetrics.crudEntities,
			mobileScreens: evaluation.scopeMetrics.mobileScreens,
			integrationsCount: evaluation.scopeMetrics.integrationsCount,
			requiresCustomAiTraining: input.requiresCustomAiTraining,
		});

		if (check.ok && targetEmail) {
			const srsOverride: Partial<AiDeveloperSrs> = {
				executive_overview: executiveOverview,
				architecture_pattern:
					typeof fnArgs.architecturePattern === 'string' ? fnArgs.architecturePattern : undefined,
				database_models: safeJsonArray(fnArgs.databaseModelsJson),
				api_endpoints: safeJsonArray(fnArgs.apiEndpointsJson),
				ui_screens: safeJsonArray(fnArgs.uiScreensJson),
				acceptance_criteria: safeJsonArray(fnArgs.acceptanceCriteriaJson),
			};

			const orderRes = await createAgentOrder({
				inquiryId,
				clientAgentId,
				clientDid: input.clientDid,
				clientEmail: targetEmail,
				projectTitle: targetTitle,
				executiveOverview,
				scopeSummary: executiveOverview,
				techStack: evaluation.normalizedStack,
				agreedPriceUSD: targetPrice,
				deliveryDays: targetDays,
				crudEntities: evaluation.scopeMetrics.crudEntities,
				mobileScreens: evaluation.scopeMetrics.mobileScreens,
				integrationsCount: evaluation.scopeMetrics.integrationsCount,
				requiresCustomAiTraining: input.requiresCustomAiTraining,
				paymentPreference: paymentPref,
				srsOverride,
			});

			if (orderRes.ok) {
				dealClosed = true;
				createdOrder = orderRes.order;
				accessToken = orderRes.accessToken;
				statusUrl = orderRes.statusUrl;
				paymentInstructions = formatPaymentInstructionsBlock(
					orderRes.order.id,
					orderRes.order.total_price_usd,
					orderRes.order.payment.upfrontDepositUSD,
				);
				reply = [
					`Order Confirmed: ${orderRes.order.id} (SOW ${orderRes.order.sow.sowId})`,
					'',
					`Executive Overview:`,
					orderRes.order.executive_overview,
					'',
					`Tech Stack & SLA: ${orderRes.order.techStack.join(', ')} | ${orderRes.order.timeline_days}-Day Turnaround`,
					'',
					paymentInstructions,
					'',
					`Once the 25% deposit ($${orderRes.order.payment.upfrontDepositUSD} USD) is remitted, reply with the transaction hash or Payoneer reference to kick off Day 1 schema + boilerplate.`,
				].join('\n');
			} else {
				reply = `Guardrail validation paused order creation: ${orderRes.error}`;
			}
		} else if (!targetEmail) {
			reply = `Terms fit our ${evaluation.requiredDeliveryDays}-day SLA at $${evaluation.proposedPriceUSD} USD (25% / 50% / 25% milestones), but a valid client email is required before issuing the order and payment instructions.`;
		} else if (!check.ok) {
			reply = `Programmatic guardrail blocked proposed terms: ${check.reason}`;
		}
	}

	if (!reply) {
		if (evaluation.decision === 'approved') {
			const upfront = evaluation.milestones[0]?.amountUSD || Math.round(evaluation.proposedPriceUSD * 0.25);
			const staging = evaluation.milestones[1]?.amountUSD || Math.round(evaluation.proposedPriceUSD * 0.5);
			const finalAmt = evaluation.milestones[2]?.amountUSD || evaluation.proposedPriceUSD - upfront - staging;
			reply = [
				`TechFiyr Proposal (${evaluation.requiredDeliveryDays}-Day Turnaround):`,
				`- Total Quote: $${evaluation.proposedPriceUSD} USD (minimum acceptable: $${evaluation.minimumAcceptableUSD} USD)`,
				`- Stack: ${evaluation.normalizedStack.join(', ')}`,
				`- Milestones: 25% Upfront ($${upfront}) / 50% Day-4 Staging MVP ($${staging}) / 25% Final Handover ($${finalAmt})`,
				`- Accepted Payment: USDC (Solana SPL / Base EVM), USDT (TRC20 / Polygon), or Payoneer USD.`,
				'',
				'Confirm to accept terms and lock the 25% deposit to receive your Order ID, payment coordinates, and Day 1 kickoff.',
			].join('\n');
		} else {
			reply = evaluation.reason;
		}
	}

	const finalStatus: NegotiationSessionRecord['status'] = dealClosed
		? 'deal_closed'
		: evaluation.decision === 'rejected'
			? 'rejected'
			: 'open';

	const replyTs = new Date().toISOString();
	turns.push({
		role: 'sales_agent',
		content: reply,
		timestamp: replyTs,
		decision: evaluation.decision,
	});

	const persistedSession = await saveSession({
		id: sessionId,
		inquiryId,
		createdAt: existingSession?.createdAt || now,
		updatedAt: replyTs,
		clientAgentId,
		clientEmail: clientEmail || undefined,
		turns,
		latestEvaluation: evaluation,
		status: finalStatus,
		orderId: createdOrder?.id,
	});

	// Keep the Inquiry record synchronized for Tab 1 (Live Inquiries Monitor) when invoked outside emailWorker
	const inquiryMessages: InquiryMessage[] = existingInquiry
		? [...existingInquiry.messages]
		: [{ timestamp: now, role: 'client', text: buyerText }];
	if (!existingInquiry || inquiryMessages[inquiryMessages.length - 1]?.text !== reply) {
		if (existingInquiry && existingInquiry.messages[existingInquiry.messages.length - 1]?.text !== buyerText) {
			inquiryMessages.push({ timestamp: now, role: 'client', text: buyerText });
		}
		inquiryMessages.push({ timestamp: replyTs, role: 'sales_agent', text: reply });
	}

	const inquiryStatus: InquiryRecord['status'] = dealClosed
		? 'CLOSED'
		: evaluation.decision === 'rejected'
			? 'REJECTED'
			: 'NEGOTIATING';

	const persistedInquiry = await saveInquiry({
		id: inquiryId,
		sender_email: clientEmail || `${clientAgentId}@a2a.client`,
		sender_name: input.clientName || existingInquiry?.sender_name || clientAgentId,
		subject: input.projectTitle || existingInquiry?.subject || 'A2A / Sales Inquiry',
		thread_id: input.threadId || existingInquiry?.thread_id || sessionId,
		status: inquiryStatus,
		channel: input.channel || existingInquiry?.channel || 'a2a',
		messages: inquiryMessages,
		order_id: createdOrder?.id || existingInquiry?.order_id,
		created_at: existingInquiry?.created_at || now,
		updated_at: replyTs,
	});

	return {
		inquiryId,
		sessionId,
		status: finalStatus,
		reply,
		decision: evaluation.decision,
		evaluation,
		dealClosed,
		order: createdOrder,
		accessToken,
		statusUrl,
		paymentInstructions,
		usedLlm: llmResult.usedLlm,
		persisted: persistedSession || persistedInquiry,
	};
}

