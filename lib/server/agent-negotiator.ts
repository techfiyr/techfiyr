/*
 * Autonomous Gemini Sales Negotiation Agent for TechFiyr A2A Commerce (server only).
 * Combines Gemini function calling (generateContractAndPayment) with strict programmatic
 * guardrails from lib/agent/pricing.ts so neither prompt injection nor LLM drift can violate
 * minimum pricing ($600 / $1,500) or SLA limits (7-day / 14-day).
 */
import { GUARDRAILS } from '@/lib/agent/catalog';
import {
	enforceOrderGuardrails,
	evaluateProjectSpec,
	type PaymentRail,
	type QuoteEvaluation,
} from '@/lib/agent/pricing';
import { createAgentOrder } from './agent-orders';
import {
	generateId,
	getSession,
	publicOrderView,
	saveSession,
	type NegotiationSessionRecord,
	type NegotiationTurn,
} from './agent-store';
import { geminiApiKey } from './gemini';
import { env } from './google';

const SALES_AGENT_SYSTEM_INSTRUCTION = `You are the Lead Solutions Architect and Autonomous Sales Closer at TechFiyr (https://techfiyr.com).
Your mission is to negotiate and close custom software development deals with autonomous buyer agents within TechFiyr's 7-day and 14-day delivery models.

STRICT RULES & GUARDRAILS:
1. Minimum project price is $${GUARDRAILS.minFloorPriceUSD} USD. Never offer or agree to anything lower.
2. 7-Day SDLC Scope Limits:
   - Web: Full-stack Next.js/React + Node.js/FastAPI/PostgreSQL with up to ${GUARDRAILS.maxCrudEntities7Day} CRUD entities, standard auth, and up to ${GUARDRAILS.maxThirdPartyIntegrations7Day} third-party integrations.
   - Mobile: Flutter/React Native app with up to ${GUARDRAILS.maxMobileScreens7Day} main screens, Firebase/REST integration, and up to ${GUARDRAILS.maxThirdPartyIntegrations7Day} integrations.
   - Any project requiring bespoke AI/ML model training, complex RAG/multi-agent pipelines, >${GUARDRAILS.maxCrudEntities7Day} entities, >${GUARDRAILS.maxMobileScreens7Day} mobile screens, or >${GUARDRAILS.maxThirdPartyIntegrations7Day} custom integrations must be quoted for a ${GUARDRAILS.extendedTurnaroundDays}-day timeline at $${GUARDRAILS.extendedMinPriceUSD}+ USD.
3. Communication Tone: Direct, precise, senior engineering tone. Cite TechFiyr's 11+ years lead engineering experience, 8-person core team, and 5.0 delivery record on Fiverr/Upwork.
4. Only invoke 'generateContractAndPayment' when the buyer agent has explicitly confirmed agreement to the scope, price, and timeline, AND provided a valid clientEmail AND concrete scopeSummary. Never invent an email address.`;

const SALES_TOOLS = [
	{
		functionDeclarations: [
			{
				name: 'generateContractAndPayment',
				description:
					'Creates an official Statement of Work (SOW), payment link/escrow instruction, 7/14-day delivery plan, and notifies the TechFiyr engineering lead. Call ONLY when buyer explicitly accepts terms and clientEmail is provided.',
				parameters: {
					type: 'OBJECT',
					properties: {
						clientEmail: { type: 'STRING' },
						projectTitle: { type: 'STRING' },
						agreedPriceUSD: { type: 'NUMBER' },
						deliveryDays: { type: 'NUMBER' },
						scopeSummary: { type: 'STRING' },
						techStack: { type: 'ARRAY', items: { type: 'STRING' } },
					},
					required: ['clientEmail', 'projectTitle', 'agreedPriceUSD', 'deliveryDays', 'scopeSummary'],
				},
			},
		],
	},
];

export type NegotiateInput = {
	sessionId?: string;
	clientAgentId?: string;
	clientDid?: string;
	clientEmail?: string;
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

export type NegotiateResult = {
	sessionId: string;
	status: 'open' | 'deal_closed' | 'rejected';
	reply: string;
	decision: QuoteEvaluation['decision'];
	evaluation: QuoteEvaluation;
	dealClosed: boolean;
	order?: ReturnType<typeof publicOrderView>;
	accessToken?: string;
	statusUrl?: string;
	usedLlm: boolean;
	persisted: boolean;
};

type GeminiFunctionCall = {
	name?: string;
	args?: Record<string, unknown>;
};

async function callGeminiSalesAgent(
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

	const guardrailContext = `PROGRAMMATIC PRICING ENGINE VERDICT (NON-NEGOTIABLE):
- Decision: ${evaluation.decision} (${evaluation.reasonCode})
- Reason: ${evaluation.reason}
- Tier: ${evaluation.tier} (${evaluation.requiredDeliveryDays} days)
- Floor Price: $${evaluation.floorPriceUSD} USD
- Recommended Price: $${evaluation.recommendedPriceUSD} USD
- Minimum Acceptable Price: $${evaluation.minimumAcceptableUSD} USD
- Proposed Price: $${evaluation.proposedPriceUSD} USD
- Normalized Stack: ${evaluation.normalizedStack.join(', ') || 'None'}
${contextSummary}`;

	const contents = [
		...turns.slice(-10).map((t) => ({
			role: t.role === 'buyer_agent' ? 'user' : 'model',
			parts: [{ text: t.content }],
		})),
	];

	// Attach deterministic engine context to the latest user turn so Gemini reasons strictly inside bounds
	if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
		const last = contents[contents.length - 1];
		last.parts = [{ text: `${last.parts[0].text}\n\n[INTERNAL PRICING GUARDRAIL CONTEXT]\n${guardrailContext}` }];
	}

	for (let i = 0; i < modelsToTry.length; i++) {
		const model = modelsToTry[i];
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 20000);

		try {
			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						systemInstruction: {
							parts: [{ text: SALES_AGENT_SYSTEM_INSTRUCTION }],
						},
						contents,
						tools: SALES_TOOLS,
						generationConfig: {
							temperature: 0.3,
							maxOutputTokens: 700,
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

export async function negotiateWithAgent(input: NegotiateInput): Promise<NegotiateResult> {
	const existingSession = input.sessionId ? await getSession(input.sessionId.trim()) : null;
	const now = new Date().toISOString();
	const sessionId = existingSession?.id || generateId('tf_neg');

	const priorBuyerMessages = existingSession
		? existingSession.turns
				.filter((t) => t.role === 'buyer_agent')
				.map((t) => t.content)
				.join('\n')
		: '';

	const combinedDescription = [input.description, input.message, priorBuyerMessages]
		.filter((s): s is string => Boolean(s && s.trim()))
		.join('\n')
		.trim()
		.slice(0, 8000);

	const evaluation = evaluateProjectSpec({
		projectTitle: input.projectTitle,
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

	const buyerText = (input.message || input.description || '').trim() || 'Requesting project negotiation.';
	const clientEmail = (input.clientEmail || existingSession?.clientEmail || '').trim() || undefined;
	const clientAgentId = (input.clientAgentId || existingSession?.clientAgentId || 'autonomous-buyer').slice(0, 120);

	const turns: NegotiationTurn[] = [
		...(existingSession?.turns || []),
		{
			role: 'buyer_agent',
			content: buyerText,
			timestamp: now,
		},
	];

	const contextSummary = [
		`- Client Email on file: ${clientEmail || 'NOT PROVIDED YET'}`,
		`- Explicit acceptOffer flag: ${Boolean(input.acceptOffer)}`,
		`- Project Title: ${input.projectTitle || 'Custom Software Project'}`,
	].join('\n');

	const llmResult = await callGeminiSalesAgent(turns, evaluation, contextSummary);

	// Decide whether to close the deal (only if guardrails pass + explicit buyer intent + valid email)
	let dealClosed = false;
	let createdOrder: ReturnType<typeof publicOrderView> | undefined;
	let accessToken: string | undefined;
	let statusUrl: string | undefined;
	let reply = llmResult.text;

	const wantsClose =
		Boolean(input.acceptOffer) ||
		(llmResult.functionCall?.name === 'generateContractAndPayment' &&
			/\b(accept|confirm|approve|proceed|close|deal|lock|agreed)\b/i.test(buyerText));

	if (wantsClose && evaluation.decision === 'approved') {
		const fnArgs = llmResult.functionCall?.args || {};
		const targetEmail = String(clientEmail || fnArgs.clientEmail || '').trim();
		const targetTitle = String(input.projectTitle || fnArgs.projectTitle || 'TechFiyr Autonomous Build').trim();
		const targetScope = String(input.description || fnArgs.scopeSummary || combinedDescription).trim();
		const targetPrice =
			typeof input.budgetUSD === 'number' && Number.isFinite(input.budgetUSD)
				? input.budgetUSD
				: typeof fnArgs.agreedPriceUSD === 'number'
					? Number(fnArgs.agreedPriceUSD)
					: evaluation.proposedPriceUSD;
		const targetDays =
			typeof input.requestedDays === 'number' && Number.isFinite(input.requestedDays)
				? input.requestedDays
				: evaluation.requiredDeliveryDays;

		const check = enforceOrderGuardrails({
			agreedPriceUSD: targetPrice,
			deliveryDays: targetDays,
			description: targetScope,
			techStack: evaluation.normalizedStack,
			crudEntities: evaluation.scopeMetrics.crudEntities,
			mobileScreens: evaluation.scopeMetrics.mobileScreens,
			integrationsCount: evaluation.scopeMetrics.integrationsCount,
			requiresCustomAiTraining: input.requiresCustomAiTraining,
		});

		if (check.ok && targetEmail) {
			const orderRes = await createAgentOrder({
				clientAgentId,
				clientDid: input.clientDid,
				clientEmail: targetEmail,
				projectTitle: targetTitle,
				scopeSummary: targetScope,
				techStack: evaluation.normalizedStack,
				agreedPriceUSD: targetPrice,
				deliveryDays: targetDays,
				crudEntities: evaluation.scopeMetrics.crudEntities,
				mobileScreens: evaluation.scopeMetrics.mobileScreens,
				integrationsCount: evaluation.scopeMetrics.integrationsCount,
				requiresCustomAiTraining: input.requiresCustomAiTraining,
				paymentPreference: input.paymentPreference,
			});

			if (orderRes.ok) {
				dealClosed = true;
				createdOrder = orderRes.order;
				accessToken = orderRes.accessToken;
				statusUrl = orderRes.statusUrl;
				reply = `Deal confirmed and contract issued (Order ${orderRes.order.id}, SOW ${orderRes.order.sow.sowId}). Agreed terms: $${orderRes.order.agreedPriceUSD} USD, ${orderRes.order.deliveryDays}-day SLA (${orderRes.order.techStack.join(', ')}). ${orderRes.order.payment.instructions}`;
			} else {
				reply = `Guardrail validation paused order creation: ${orderRes.error}`;
			}
		} else if (!targetEmail) {
			reply = `Terms fit our ${evaluation.requiredDeliveryDays}-day SLA at $${evaluation.proposedPriceUSD} USD, but a valid clientEmail is required before issuing the SOW and payment rail.`;
		} else if (!check.ok) {
			reply = `Programmatic guardrail blocked proposed terms: ${check.reason}`;
		}
	}

	if (!reply) {
		if (evaluation.decision === 'approved') {
			reply = `Scope approved under TechFiyr's ${evaluation.requiredDeliveryDays}-day delivery model (${evaluation.normalizedStack.join(', ')}). Quote: $${evaluation.proposedPriceUSD} USD (minimum acceptable: $${evaluation.minimumAcceptableUSD} USD). Send acceptOffer: true with clientEmail to generate the SOW and payment link.`;
		} else {
			reply = evaluation.reason;
		}
	}

	const finalStatus: NegotiationSessionRecord['status'] = dealClosed
		? 'deal_closed'
		: evaluation.decision === 'rejected'
			? 'rejected'
			: 'open';

	turns.push({
		role: 'sales_agent',
		content: reply,
		timestamp: new Date().toISOString(),
		decision: evaluation.decision,
	});

	const persisted = await saveSession({
		id: sessionId,
		createdAt: existingSession?.createdAt || now,
		updatedAt: new Date().toISOString(),
		clientAgentId,
		clientEmail,
		turns,
		latestEvaluation: evaluation,
		status: finalStatus,
		orderId: createdOrder?.id,
	});

	return {
		sessionId,
		status: finalStatus,
		reply,
		decision: evaluation.decision,
		evaluation,
		dealClosed,
		order: createdOrder,
		accessToken,
		statusUrl,
		usedLlm: llmResult.usedLlm,
		persisted,
	};
}

