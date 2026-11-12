/*
 * Google A2A (Agent-to-Agent) Protocol JSON-RPC 2.0 endpoint at /api/agent/a2a.
 * Supports message/send, tasks/send, tasks/get, tasks/cancel, and agent/getAuthenticatedExtendedCard,
 * routing structured DataParts or text prompts into TechFiyr's quote, negotiation, and order engines.
 */
import { buildAgentCatalog } from '@/lib/agent/catalog';
import type { PaymentRail } from '@/lib/agent/pricing';
import { inspectAgentInteraction } from '@/lib/agent/security';
import { recordAgentHit } from '@/lib/server/agent-audit';
import { agentJson, agentOptions } from '@/lib/server/agent-http';
import { negotiateWithAgent } from '@/lib/server/agent-negotiator';
import { createAgentOrder, createAgentQuote } from '@/lib/server/agent-orders';
import {
	generateId,
	getA2ATask,
	getOrder,
	isOrderAuthorized,
	publicOrderView,
	saveA2ATask,
	type A2ATaskRecord,
} from '@/lib/server/agent-store';
import { buildAgentMarketingBrief, type MarketingChannel } from '@/lib/server/marketingAgent';
import { SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';

type A2APart = {
	kind?: string;
	type?: string;
	text?: string;
	data?: Record<string, unknown>;
};

type A2ARpc = {
	jsonrpc?: string;
	id?: string | number | null;
	method?: string;
	params?: Record<string, unknown>;
};

const rpcOk = (id: string | number | null | undefined, result: unknown) => ({
	jsonrpc: '2.0',
	id: id ?? null,
	result,
});

const rpcErr = (id: string | number | null | undefined, code: number, message: string) => ({
	jsonrpc: '2.0',
	id: id ?? null,
	error: { code, message },
});

export async function OPTIONS() {
	return agentOptions();
}

export async function GET(req: Request) {
	const startedAtMs = Date.now();
	await recordAgentHit(req, {
		protocol: 'a2a',
		action: 'discovery_get',
		statusCode: 200,
		startedAtMs,
		summary: 'Probed GET /api/agent/a2a capabilities',
	});
	return agentJson({
		ok: true,
		protocol: 'a2a-jsonrpc-2.0',
		agentCard: `${SITE_URL}/.well-known/agent.json`,
		endpoint: `${SITE_URL}/api/agent/a2a`,
		supportedMethods: [
			'message/send',
			'tasks/send',
			'tasks/get',
			'tasks/cancel',
			'agent/getAuthenticatedExtendedCard',
		],
	});
}

async function handleA2AMessage(params: Record<string, unknown>, req: Request, startedAtMs: number): Promise<A2ATaskRecord> {
	const msg = (params.message || {}) as {
		parts?: A2APart[];
		contextId?: string;
		taskId?: string;
	};
	const parts = Array.isArray(msg.parts) ? msg.parts : [];
	const dataPart = parts.find((p) => (p.kind === 'data' || p.type === 'data') && p.data)?.data;
	const textParts = parts
		.filter((p) => (p.kind === 'text' || p.type === 'text' || !p.kind) && typeof p.text === 'string')
		.map((p) => p.text as string)
		.join('\n')
		.trim();

	const taskId = typeof params.id === 'string' ? params.id : msg.taskId || generateId('a2a_task');
	const contextId = msg.contextId || generateId('a2a_ctx');
	const now = new Date().toISOString();

	const action = typeof dataPart?.action === 'string' ? dataPart.action : '';
	const clientAgentId = typeof dataPart?.clientAgentId === 'string' ? dataPart.clientAgentId : undefined;
	let summaryText = '';
	let resultData: Record<string, unknown> = {};
	let state: A2ATaskRecord['status']['state'] = 'completed';
	let hitInquiryId: string | undefined;
	let hitOrderId: string | undefined;

	if (action === 'catalog') {
		resultData = buildAgentCatalog();
		summaryText = 'TechFiyr A2A service catalog, pricing guardrails, and supported tech stacks.';
	} else if (action === 'marketing') {
		const channel =
			typeof dataPart?.channel === 'string' ? (dataPart.channel.toLowerCase() as MarketingChannel) : 'a2a';
		const brief = await buildAgentMarketingBrief({
			targetQuery: typeof dataPart?.targetQuery === 'string' ? dataPart.targetQuery : textParts || undefined,
			channel,
			partnerAgentName: clientAgentId,
		});
		resultData = brief;
		summaryText = brief.canonicalPitch;
	} else if (action === 'quote' && dataPart) {
		const quoteDesc = typeof dataPart.description === 'string' ? dataPart.description : textParts;
		const sec = inspectAgentInteraction(`${typeof dataPart.projectTitle === 'string' ? dataPart.projectTitle : ''}\n${quoteDesc}`);
		if (!sec.safe) {
			state = 'failed';
			summaryText = sec.refusalMessage || 'Quote blocked by security guardrails.';
			resultData = { ok: false, code: 'SECURITY_BLOCKED', error: summaryText };
		} else {
			const { quote, persisted } = await createAgentQuote({
				projectTitle: typeof dataPart.projectTitle === 'string' ? dataPart.projectTitle : undefined,
				description: quoteDesc,
				platform:
					dataPart.platform === 'web' ||
					dataPart.platform === 'mobile' ||
					dataPart.platform === 'fullstack' ||
					dataPart.platform === 'ai' ||
					dataPart.platform === 'design' ||
					dataPart.platform === 'enterprise'
						? dataPart.platform
						: undefined,
				techStack: Array.isArray(dataPart.techStack)
					? dataPart.techStack.filter((x): x is string => typeof x === 'string')
					: undefined,
				crudEntities: typeof dataPart.crudEntities === 'number' ? dataPart.crudEntities : undefined,
				mobileScreens: typeof dataPart.mobileScreens === 'number' ? dataPart.mobileScreens : undefined,
				integrationsCount: typeof dataPart.integrationsCount === 'number' ? dataPart.integrationsCount : undefined,
				budgetUSD: typeof dataPart.budgetUSD === 'number' ? dataPart.budgetUSD : undefined,
				requestedDays: typeof dataPart.requestedDays === 'number' ? dataPart.requestedDays : undefined,
				clientAgentId: typeof dataPart.clientAgentId === 'string' ? dataPart.clientAgentId : 'a2a-client',
				clientEmail: typeof dataPart.clientEmail === 'string' ? dataPart.clientEmail : undefined,
			});
			resultData = { quoteId: quote.id, expiresAt: quote.expiresAt, persisted, evaluation: quote.evaluation };
			summaryText = quote.evaluation.reason;
			if (quote.evaluation.decision === 'rejected') state = 'failed';
			else if (quote.evaluation.decision === 'counter_offer') state = 'input-required';
		}
	} else if (action === 'order' && dataPart) {
		const orderRes = await createAgentOrder({
			quoteId: typeof dataPart.quoteId === 'string' ? dataPart.quoteId : undefined,
			clientEmail: typeof dataPart.clientEmail === 'string' ? dataPart.clientEmail : '',
			clientAgentId: typeof dataPart.clientAgentId === 'string' ? dataPart.clientAgentId : 'a2a-client',
			projectTitle: typeof dataPart.projectTitle === 'string' ? dataPart.projectTitle : '',
			scopeSummary:
				typeof dataPart.scopeSummary === 'string'
					? dataPart.scopeSummary
					: typeof dataPart.description === 'string'
						? dataPart.description
						: textParts,
			techStack: Array.isArray(dataPart.techStack)
				? dataPart.techStack.filter((x): x is string => typeof x === 'string')
				: undefined,
			agreedPriceUSD: typeof dataPart.agreedPriceUSD === 'number' ? dataPart.agreedPriceUSD : undefined,
			deliveryDays: typeof dataPart.deliveryDays === 'number' ? dataPart.deliveryDays : undefined,
			paymentPreference:
				typeof dataPart.paymentPreference === 'string' ? (dataPart.paymentPreference as PaymentRail) : undefined,
		});
		resultData = orderRes as Record<string, unknown>;
		summaryText = orderRes.ok
			? `Order ${orderRes.order.id} created for $${orderRes.order.agreedPriceUSD} USD (${orderRes.order.deliveryDays}-day SLA).`
			: orderRes.error;
		if (orderRes.ok) hitOrderId = orderRes.order.id;
		if (!orderRes.ok) state = 'failed';
	} else if (action === 'status' && typeof dataPart?.orderId === 'string') {
		const order = await getOrder(dataPart.orderId);
		if (!order) {
			state = 'failed';
			summaryText = `Order ${dataPart.orderId} not found.`;
			resultData = { ok: false, code: 'ORDER_NOT_FOUND' };
		} else if (!isOrderAuthorized(req, order, typeof dataPart.accessToken === 'string' ? dataPart.accessToken : undefined)) {
			state = 'failed';
			summaryText = 'Unauthorized: valid order accessToken required.';
			resultData = { ok: false, code: 'UNAUTHORIZED' };
		} else {
			resultData = { ok: true, order: publicOrderView(order) };
			summaryText = `Order ${order.id} is in phase ${order.currentPhase}.`;
			hitOrderId = order.id;
		}
	} else {
		const neg = await negotiateWithAgent({
			channel: 'a2a',
			sessionId: contextId,
			clientAgentId,
			message: textParts || JSON.stringify(dataPart || {}),
			description: typeof dataPart?.description === 'string' ? dataPart.description : textParts,
			projectTitle: typeof dataPart?.projectTitle === 'string' ? dataPart.projectTitle : undefined,
			techStack: Array.isArray(dataPart?.techStack)
				? dataPart.techStack.filter((x): x is string => typeof x === 'string')
				: undefined,
			budgetUSD: typeof dataPart?.budgetUSD === 'number' ? dataPart.budgetUSD : undefined,
			requestedDays: typeof dataPart?.requestedDays === 'number' ? dataPart.requestedDays : undefined,
			clientEmail: typeof dataPart?.clientEmail === 'string' ? dataPart.clientEmail : undefined,
			acceptOffer: typeof dataPart?.acceptOffer === 'boolean' ? dataPart.acceptOffer : undefined,
		});
		resultData = neg as unknown as Record<string, unknown>;
		summaryText = neg.reply;
		hitInquiryId = neg.inquiryId;
		hitOrderId = neg.order?.id;
		if (neg.status === 'rejected') state = 'failed';
		else if (neg.dealClosed || neg.workflow.stage === 'meeting_handover') state = 'completed';
		else state = 'input-required';
	}

	const task: A2ATaskRecord = {
		id: taskId,
		contextId,
		status: {
			state,
			timestamp: now,
			message: {
				role: 'agent',
				parts: [
					{ kind: 'text', text: summaryText },
					{ kind: 'data', data: resultData },
				],
			},
		},
		history: [{ role: 'user', parts }, { role: 'agent', parts: [{ kind: 'text', text: summaryText }] }],
		artifacts: [
			{
				artifactId: generateId('art'),
				name: 'techfiyr-a2a-response',
				parts: [{ kind: 'data', data: resultData }],
			},
		],
		createdAt: now,
		updatedAt: now,
	};

	await saveA2ATask(task);
	await recordAgentHit(req, {
		protocol: 'a2a',
		action: action ? `message:${action}` : 'message:negotiate',
		agentName: clientAgentId,
		statusCode: 200,
		startedAtMs,
		summary: `A2A ${action || 'negotiate'} -> ${state}`,
		inquiryId: hitInquiryId,
		orderId: hitOrderId,
	});
	return task;
}

export async function POST(req: Request) {
	const startedAtMs = Date.now();
	let body: A2ARpc;
	try {
		body = (await req.json()) as A2ARpc;
	} catch {
		return agentJson(rpcErr(null, -32700, 'Parse error: invalid JSON.'), 400);
	}

	if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
		return agentJson(rpcErr(body.id, -32600, 'Invalid JSON-RPC 2.0 request.'), 400);
	}

	const params = body.params || {};

	switch (body.method) {
		case 'message/send':
		case 'tasks/send': {
			const task = await handleA2AMessage(params, req, startedAtMs);
			return agentJson(rpcOk(body.id, task));
		}

		case 'tasks/get': {
			const id = typeof params.id === 'string' ? params.id : '';
			const task = await getA2ATask(id);
			await recordAgentHit(req, {
				protocol: 'a2a',
				action: 'tasks/get',
				statusCode: 200,
				startedAtMs,
				summary: `A2A tasks/get ${id} (${task ? task.status.state : 'not_found'})`,
			});
			if (!task) return agentJson(rpcErr(body.id, -32001, `Task ${id} not found.`));
			return agentJson(rpcOk(body.id, task));
		}

		case 'tasks/cancel': {
			const id = typeof params.id === 'string' ? params.id : '';
			const task = await getA2ATask(id);
			if (!task) return agentJson(rpcErr(body.id, -32001, `Task ${id} not found.`));
			const canceled: A2ATaskRecord = {
				...task,
				status: { ...task.status, state: 'canceled', timestamp: new Date().toISOString() },
				updatedAt: new Date().toISOString(),
			};
			await saveA2ATask(canceled);
			await recordAgentHit(req, {
				protocol: 'a2a',
				action: 'tasks/cancel',
				statusCode: 200,
				startedAtMs,
				summary: `A2A canceled task ${id}`,
			});
			return agentJson(rpcOk(body.id, canceled));
		}

		case 'agent/getAuthenticatedExtendedCard':
			await recordAgentHit(req, {
				protocol: 'a2a',
				action: 'agent/getAuthenticatedExtendedCard',
				statusCode: 200,
				startedAtMs,
				summary: 'Served authenticated extended A2A card',
			});
			return agentJson(rpcOk(body.id, buildAgentCatalog()));

		default:
			return agentJson(rpcErr(body.id, -32601, `Method not found: ${body.method}`));
	}
}

