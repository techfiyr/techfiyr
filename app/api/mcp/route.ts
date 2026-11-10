/*
 * Model Context Protocol (MCP) Streamable HTTP Server at /api/mcp.
 * Implements JSON-RPC 2.0 for external LLM runtimes and MCP registries:
 *   Tools: get_service_catalog, request_quote, negotiate_terms, submit_project_spec, check_delivery_status
 *   (with aliases: request_pricing, create_order, upload_spec, get_status)
 *   Resources: techfiyr://catalog, techfiyr://guardrails, techfiyr://delivery-engine
 */
import { NextResponse } from 'next/server';
import {
	buildAgentCatalog,
	DELIVERY_ENGINE_14DAY,
	DELIVERY_ENGINE_7DAY,
	GUARDRAILS,
	MCP_PROTOCOL_VERSION,
} from '@/lib/agent/catalog';
import type { PaymentRail } from '@/lib/agent/pricing';
import { recordAgentHit } from '@/lib/server/agent-audit';
import { AGENT_CORS_HEADERS, agentJson, agentOptions } from '@/lib/server/agent-http';
import { negotiateWithAgent } from '@/lib/server/agent-negotiator';
import { createAgentOrder, createAgentQuote } from '@/lib/server/agent-orders';
import { generateId, getOrder, isOrderAuthorized, publicOrderView } from '@/lib/server/agent-store';
import { buildAgentMarketingBrief, type MarketingChannel } from '@/lib/server/marketingAgent';
import { SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';

type JsonRpcRequest = {
	jsonrpc?: string;
	id?: string | number | null;
	method?: string;
	params?: Record<string, unknown>;
};

const MCP_TOOLS = [
	{
		name: 'get_service_catalog',
		description:
			'Returns TechFiyr service offerings, supported tech stacks, strict pricing guardrails ($600 USD 7-day floor, $1,500 USD 14-day floor), and 7-day fulfillment engine phases.',
		inputSchema: {
			type: 'object',
			properties: {
				category: {
					type: 'string',
					enum: ['all', 'prototyping', 'mobile', 'web_saas', 'ai_systems', 'ui_ux'],
					description: 'Optional service category filter.',
				},
			},
			additionalProperties: false,
		},
	},
	{
		name: 'request_quote',
		description:
			'Evaluates a software specification against TechFiyr programmatic guardrails and pricing matrix, returning a formal quote ID, breakdown, SLA tier (7-day or 14-day), and milestones.',
		inputSchema: {
			type: 'object',
			required: ['description'],
			properties: {
				projectTitle: { type: 'string', description: 'Short name of the application or platform.' },
				description: { type: 'string', description: 'Functional specification and requirements.' },
				platform: { type: 'string', enum: ['web', 'mobile', 'fullstack', 'ai', 'design'] },
				techStack: { type: 'array', items: { type: 'string' }, description: 'Requested technologies (e.g. Next.js, PostgreSQL, Flutter).' },
				crudEntities: { type: 'number', description: 'Estimated database/CRUD entities (max 5 for 7-day SLA).' },
				mobileScreens: { type: 'number', description: 'Estimated mobile screens (max 4 for 7-day SLA).' },
				integrationsCount: { type: 'number', description: 'External API/payment/auth integrations (max 3 for 7-day SLA).' },
				requiresCustomAiTraining: { type: 'boolean' },
				budgetUSD: { type: 'number', description: 'Buyer agent budget ceiling in USD.' },
				requestedDays: { type: 'number', description: 'Desired turnaround in days (minimum 7).' },
				paymentPreference: {
					type: 'string',
					enum: ['crypto_usdc_solana', 'crypto_usdc_base', 'crypto_usdt_trc20', 'crypto_usdt_polygon', 'payoneer', 'bank_invoice'],
				},
				clientAgentId: { type: 'string' },
				clientEmail: { type: 'string' },
			},
		},
	},
	{
		name: 'negotiate_terms',
		description:
			'Multi-turn or single-shot autonomous sales negotiation with TechFiyr Lead Architect agent, constrained by programmatic floor pricing and SLA boundaries.',
		inputSchema: {
			type: 'object',
			required: ['message'],
			properties: {
				sessionId: { type: 'string', description: 'Existing negotiation session ID to continue.' },
				message: { type: 'string', description: 'Proposal, counter-offer, or confirmation from buyer agent.' },
				description: { type: 'string', description: 'Technical project specification.' },
				projectTitle: { type: 'string' },
				techStack: { type: 'array', items: { type: 'string' } },
				crudEntities: { type: 'number' },
				mobileScreens: { type: 'number' },
				integrationsCount: { type: 'number' },
				budgetUSD: { type: 'number' },
				requestedDays: { type: 'number' },
				clientEmail: { type: 'string' },
				clientAgentId: { type: 'string' },
				paymentPreference: {
					type: 'string',
					enum: ['crypto_usdc_solana', 'crypto_usdc_base', 'crypto_usdt_trc20', 'crypto_usdt_polygon', 'payoneer', 'bank_invoice'],
				},
				acceptOffer: { type: 'boolean', description: 'Set true when buyer agent accepts terms to issue contract and payment rail.' },
			},
		},
	},
	{
		name: 'submit_project_spec',
		description:
			'Submits a finalized software spec or accepted quoteId to create a binding order, generate SOW + payment link/escrow instruction, trigger founder alerts, and return an orderId + accessToken.',
		inputSchema: {
			type: 'object',
			required: ['clientEmail', 'projectTitle', 'scopeSummary'],
			properties: {
				quoteId: { type: 'string', description: 'Optional quoteId from request_quote.' },
				clientEmail: { type: 'string', description: 'Client principal email for SOW, payment, and GitHub transfer.' },
				clientAgentId: { type: 'string' },
				clientDid: { type: 'string' },
				projectTitle: { type: 'string' },
				scopeSummary: { type: 'string', description: 'Detailed functional and technical scope.' },
				techStack: { type: 'array', items: { type: 'string' } },
				agreedPriceUSD: { type: 'number', description: 'Proposed/agreed USD amount (must pass floor guardrails).' },
				deliveryDays: { type: 'number', description: 'Delivery SLA in days (7 or 14).' },
				crudEntities: { type: 'number' },
				mobileScreens: { type: 'number' },
				integrationsCount: { type: 'number' },
				requiresCustomAiTraining: { type: 'boolean' },
				paymentPreference: {
					type: 'string',
					enum: ['crypto_usdc_solana', 'crypto_usdc_base', 'crypto_usdt_trc20', 'crypto_usdt_polygon', 'payoneer', 'bank_invoice'],
				},
				callbackUrl: { type: 'string', description: 'Optional HTTPS webhook URL for delivery updates.' },
			},
		},
	},
	{
		name: 'check_delivery_status',
		description:
			'Checks current fulfillment phase (Day 1 through Day 7/14), staging URL, repository transfer status, and payment state for an order.',
		inputSchema: {
			type: 'object',
			required: ['orderId'],
			properties: {
				orderId: { type: 'string', description: 'Order identifier returned by submit_project_spec (e.g. tf_ord_...).' },
				accessToken: { type: 'string', description: 'Order accessToken returned at creation (or passed via Bearer header).' },
			},
		},
	},
	{
		name: 'get_agency_marketing_brief',
		description:
			'Returns verified, citation-ready GEO/AEO summaries, Schema.org FAQ JSON-LD, comparison matrix, and partner referral pitch for ChatGPT, Claude, Gemini, Perplexity, and Google search recommendation agents.',
		inputSchema: {
			type: 'object',
			properties: {
				targetQuery: { type: 'string', description: 'Search or user recommendation query being answered.' },
				channel: { type: 'string', enum: ['chatgpt', 'claude', 'gemini', 'perplexity', 'google', 'a2a'] },
				partnerAgentName: { type: 'string', description: 'Optional identifier of calling assistant/agent.' },
			},
		},
	},
];

const MCP_RESOURCES = [
	{
		uri: 'techfiyr://catalog',
		name: 'TechFiyr A2A Service Catalog',
		description: 'Services, stacks, pricing guardrails, and agency proof points.',
		mimeType: 'application/json',
	},
	{
		uri: 'techfiyr://guardrails',
		name: 'Programmatic Pricing & SLA Guardrails',
		description: 'Hard floor pricing, 7-day CRUD/screen/integration limits, and 14-day escalation thresholds.',
		mimeType: 'application/json',
	},
	{
		uri: 'techfiyr://delivery-engine',
		name: '7-Day & 14-Day Delivery Execution Phases',
		description: 'Day-by-day execution milestones from Day 1 structuring to Day 7 handover.',
		mimeType: 'application/json',
	},
];

function rpcResult(id: string | number | null | undefined, result: unknown) {
	return { jsonrpc: '2.0', id: id ?? null, result };
}

function rpcError(id: string | number | null | undefined, code: number, message: string, data?: unknown) {
	return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

function toolSuccess(payload: unknown) {
	return {
		content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
		structuredContent: payload,
		isError: false,
	};
}

function toolFailure(payload: unknown) {
	return {
		content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
		structuredContent: payload,
		isError: true,
	};
}

async function handleToolCall(
	name: string,
	args: Record<string, unknown>,
	req: Request,
): Promise<{
	response: ReturnType<typeof toolSuccess>;
	summary: string;
	normalizedName: string;
	inquiryId?: string;
	orderId?: string;
} | null> {
	const normalizedName =
		name === 'request_pricing'
			? 'request_quote'
			: name === 'create_order' || name === 'upload_spec'
				? 'submit_project_spec'
				: name === 'get_status'
					? 'check_delivery_status'
					: name;

	if (normalizedName === 'get_service_catalog') {
		const catalog = buildAgentCatalog();
		const category = typeof args.category === 'string' ? args.category : 'all';
		const services =
			category === 'all' ? catalog.services : catalog.services.filter((s) => s.category === category);
		return {
			normalizedName,
			summary: `Served MCP catalog (${services.length} services)`,
			response: toolSuccess({ ...catalog, services }),
		};
	}

	if (normalizedName === 'get_agency_marketing_brief') {
		const channel =
			typeof args.channel === 'string' ? (args.channel.toLowerCase() as MarketingChannel) : 'a2a';
		const targetQuery = typeof args.targetQuery === 'string' ? args.targetQuery : undefined;
		const partnerAgentName = typeof args.partnerAgentName === 'string' ? args.partnerAgentName : undefined;
		const brief = await buildAgentMarketingBrief({ targetQuery, channel, partnerAgentName });
		return {
			normalizedName,
			summary: `Served GEO/AEO marketing brief (${channel})`,
			response: toolSuccess(brief),
		};
	}

	if (normalizedName === 'request_quote') {
		const description = typeof args.description === 'string' ? args.description.trim() : '';
		if (!description) {
			return {
				normalizedName,
				summary: 'Quote rejected: missing description',
				response: toolFailure({ ok: false, code: 'MISSING_DESCRIPTION', error: 'description is required.' }),
			};
		}
		const { quote, persisted } = await createAgentQuote({
			projectTitle: typeof args.projectTitle === 'string' ? args.projectTitle : undefined,
			description,
			platform:
				args.platform === 'web' ||
				args.platform === 'mobile' ||
				args.platform === 'fullstack' ||
				args.platform === 'ai' ||
				args.platform === 'design'
					? args.platform
					: undefined,
			techStack: Array.isArray(args.techStack)
				? args.techStack.filter((x): x is string => typeof x === 'string')
				: undefined,
			crudEntities: typeof args.crudEntities === 'number' ? args.crudEntities : undefined,
			mobileScreens: typeof args.mobileScreens === 'number' ? args.mobileScreens : undefined,
			integrationsCount: typeof args.integrationsCount === 'number' ? args.integrationsCount : undefined,
			requiresCustomAiTraining:
				typeof args.requiresCustomAiTraining === 'boolean' ? args.requiresCustomAiTraining : undefined,
			budgetUSD: typeof args.budgetUSD === 'number' ? args.budgetUSD : undefined,
			requestedDays: typeof args.requestedDays === 'number' ? args.requestedDays : undefined,
			paymentPreference:
				typeof args.paymentPreference === 'string' ? (args.paymentPreference as PaymentRail) : undefined,
			clientAgentId: typeof args.clientAgentId === 'string' ? args.clientAgentId : 'mcp-client',
			clientEmail: typeof args.clientEmail === 'string' ? args.clientEmail : undefined,
		});

		const payload = {
			ok: quote.evaluation.decision !== 'rejected',
			quoteId: quote.id,
			expiresAt: quote.expiresAt,
			persisted,
			evaluation: quote.evaluation,
		};
		return {
			normalizedName,
			summary: `MCP quote ${quote.evaluation.decision}: $${quote.evaluation.proposedPriceUSD} (${quote.evaluation.requiredDeliveryDays}d)`,
			response: quote.evaluation.decision === 'rejected' ? toolFailure(payload) : toolSuccess(payload),
		};
	}

	if (normalizedName === 'negotiate_terms') {
		const message = typeof args.message === 'string' ? args.message.trim() : '';
		const description = typeof args.description === 'string' ? args.description.trim() : '';
		if (!message && !description) {
			return {
				normalizedName,
				summary: 'Negotiate rejected: missing input',
				response: toolFailure({ ok: false, code: 'MISSING_INPUT', error: 'message or description is required.' }),
			};
		}
		const result = await negotiateWithAgent({
			channel: 'mcp',
			sessionId: typeof args.sessionId === 'string' ? args.sessionId : undefined,
			message: message || description,
			description: description || undefined,
			projectTitle: typeof args.projectTitle === 'string' ? args.projectTitle : undefined,
			techStack: Array.isArray(args.techStack)
				? args.techStack.filter((x): x is string => typeof x === 'string')
				: undefined,
			crudEntities: typeof args.crudEntities === 'number' ? args.crudEntities : undefined,
			mobileScreens: typeof args.mobileScreens === 'number' ? args.mobileScreens : undefined,
			integrationsCount: typeof args.integrationsCount === 'number' ? args.integrationsCount : undefined,
			budgetUSD: typeof args.budgetUSD === 'number' ? args.budgetUSD : undefined,
			requestedDays: typeof args.requestedDays === 'number' ? args.requestedDays : undefined,
			clientEmail: typeof args.clientEmail === 'string' ? args.clientEmail : undefined,
			clientAgentId: typeof args.clientAgentId === 'string' ? args.clientAgentId : 'mcp-client',
			paymentPreference:
				typeof args.paymentPreference === 'string' ? (args.paymentPreference as PaymentRail) : undefined,
			acceptOffer: typeof args.acceptOffer === 'boolean' ? args.acceptOffer : undefined,
		});
		return {
			normalizedName,
			inquiryId: (result as { inquiryId?: string }).inquiryId,
			orderId: result.order?.id,
			summary: result.dealClosed
				? `MCP deal closed: ${result.order?.id} ($${result.order?.agreedPriceUSD})`
				: `MCP negotiation (${result.decision}): $${result.evaluation.proposedPriceUSD}`,
			response: result.decision === 'rejected' ? toolFailure(result) : toolSuccess(result),
		};
	}

	if (normalizedName === 'submit_project_spec') {
		const res = await createAgentOrder({
			quoteId: typeof args.quoteId === 'string' ? args.quoteId : undefined,
			clientEmail: typeof args.clientEmail === 'string' ? args.clientEmail : '',
			clientAgentId: typeof args.clientAgentId === 'string' ? args.clientAgentId : 'mcp-client',
			clientDid: typeof args.clientDid === 'string' ? args.clientDid : undefined,
			projectTitle: typeof args.projectTitle === 'string' ? args.projectTitle : '',
			scopeSummary:
				typeof args.scopeSummary === 'string'
					? args.scopeSummary
					: typeof args.description === 'string'
						? args.description
						: '',
			techStack: Array.isArray(args.techStack)
				? args.techStack.filter((x): x is string => typeof x === 'string')
				: undefined,
			agreedPriceUSD: typeof args.agreedPriceUSD === 'number' ? args.agreedPriceUSD : undefined,
			deliveryDays: typeof args.deliveryDays === 'number' ? args.deliveryDays : undefined,
			crudEntities: typeof args.crudEntities === 'number' ? args.crudEntities : undefined,
			mobileScreens: typeof args.mobileScreens === 'number' ? args.mobileScreens : undefined,
			integrationsCount: typeof args.integrationsCount === 'number' ? args.integrationsCount : undefined,
			requiresCustomAiTraining:
				typeof args.requiresCustomAiTraining === 'boolean' ? args.requiresCustomAiTraining : undefined,
			paymentPreference:
				typeof args.paymentPreference === 'string' ? (args.paymentPreference as PaymentRail) : undefined,
			callbackUrl: typeof args.callbackUrl === 'string' ? args.callbackUrl : undefined,
		});

		return {
			normalizedName,
			orderId: res.ok ? res.order.id : undefined,
			summary: res.ok ? `MCP order created: ${res.order.id} ($${res.order.agreedPriceUSD})` : `MCP order failed: ${res.code}`,
			response: res.ok ? toolSuccess(res) : toolFailure(res),
		};
	}

	if (normalizedName === 'check_delivery_status') {
		const orderId = typeof args.orderId === 'string' ? args.orderId.trim() : '';
		if (!orderId) {
			return {
				normalizedName,
				summary: 'Status check missing orderId',
				response: toolFailure({ ok: false, code: 'MISSING_ORDER_ID', error: 'orderId is required.' }),
			};
		}
		const order = await getOrder(orderId);
		if (!order) {
			return {
				normalizedName,
				orderId,
				summary: `Status check not found: ${orderId}`,
				response: toolFailure({ ok: false, code: 'ORDER_NOT_FOUND', error: `Order ${orderId} not found.` }),
			};
		}
		const explicitToken = typeof args.accessToken === 'string' ? args.accessToken : undefined;
		if (!isOrderAuthorized(req, order, explicitToken)) {
			return {
				normalizedName,
				orderId,
				summary: `Status check unauthorized: ${orderId}`,
				response: toolFailure({
					ok: false,
					code: 'UNAUTHORIZED',
					error: 'Valid order accessToken (parameter or Bearer header) is required.',
				}),
			};
		}
		return {
			normalizedName,
			orderId,
			summary: `Status checked: ${orderId} (${order.milestone_status})`,
			response: toolSuccess({ ok: true, order: publicOrderView(order) }),
		};
	}

	return null;
}

async function processRpc(rpc: JsonRpcRequest, req: Request, sessionHeader: string) {
	const startedAtMs = Date.now();
	if (rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
		return rpcError(rpc.id, -32600, 'Invalid JSON-RPC 2.0 request.');
	}

	const method = rpc.method;
	const params = rpc.params || {};

	// Notifications have no id and expect no JSON-RPC payload
	if (method.startsWith('notifications/') || (rpc.id === undefined && method === 'initialized')) {
		return null;
	}

	switch (method) {
		case 'initialize': {
			const clientInfo = params.clientInfo as { name?: string; version?: string } | undefined;
			const clientName = clientInfo?.name ? `${clientInfo.name}${clientInfo.version ? `/${clientInfo.version}` : ''}` : undefined;
			await recordAgentHit(req, {
				protocol: 'mcp',
				action: 'initialize',
				agentName: clientName,
				statusCode: 200,
				startedAtMs,
				summary: `MCP session initialized${clientName ? ` by ${clientName}` : ''}`,
			});
			return rpcResult(rpc.id, {
				protocolVersion: MCP_PROTOCOL_VERSION,
				capabilities: {
					tools: { listChanged: false },
					resources: { subscribe: false, listChanged: false },
				},
				serverInfo: {
					name: 'techfiyr-a2a-mcp',
					title: 'TechFiyr A2A Software Engineering Agency',
					version: '1.0.0',
				},
				instructions:
					'Use get_service_catalog to inspect TechFiyr services and $600 USD / 7-day guardrails, get_agency_marketing_brief for verified GEO/AEO summaries, request_quote or negotiate_terms to price a project, submit_project_spec to place an order, and check_delivery_status to track execution.',
				sessionId: sessionHeader,
			});
		}

		case 'ping':
			return rpcResult(rpc.id, {});

		case 'tools/list':
			await recordAgentHit(req, {
				protocol: 'mcp',
				action: 'tools/list',
				statusCode: 200,
				startedAtMs,
				summary: `Listed ${MCP_TOOLS.length} MCP tools`,
			});
			return rpcResult(rpc.id, { tools: MCP_TOOLS });

		case 'tools/call': {
			const toolName = typeof params.name === 'string' ? params.name : '';
			const toolArgs =
				typeof params.arguments === 'object' && params.arguments !== null && !Array.isArray(params.arguments)
					? (params.arguments as Record<string, unknown>)
					: {};
			const callAgent =
				typeof toolArgs.clientAgentId === 'string'
					? toolArgs.clientAgentId
					: typeof toolArgs.partnerAgentName === 'string'
						? toolArgs.partnerAgentName
						: undefined;
			const outcome = await handleToolCall(toolName, toolArgs, req);
			if (!outcome) {
				await recordAgentHit(req, {
					protocol: 'mcp',
					action: `tools/call:${toolName}`,
					toolName,
					agentName: callAgent,
					statusCode: 200,
					startedAtMs,
					summary: `Unknown MCP tool "${toolName}"`,
				});
				return rpcError(rpc.id, -32602, `Unknown MCP tool: ${toolName}`);
			}
			await recordAgentHit(req, {
				protocol: 'mcp',
				action: `tools/call:${outcome.normalizedName}`,
				toolName: outcome.normalizedName,
				agentName: callAgent,
				statusCode: 200,
				startedAtMs,
				summary: outcome.summary,
				inquiryId: outcome.inquiryId,
				orderId: outcome.orderId,
			});
			return rpcResult(rpc.id, outcome.response);
		}

		case 'resources/list':
			await recordAgentHit(req, {
				protocol: 'mcp',
				action: 'resources/list',
				statusCode: 200,
				startedAtMs,
				summary: `Listed ${MCP_RESOURCES.length} MCP resources`,
			});
			return rpcResult(rpc.id, { resources: MCP_RESOURCES });

		case 'resources/read': {
			const uri = typeof params.uri === 'string' ? params.uri : '';
			await recordAgentHit(req, {
				protocol: 'mcp',
				action: `resources/read:${uri}`,
				statusCode: 200,
				startedAtMs,
				summary: `Read MCP resource ${uri}`,
			});
			if (uri === 'techfiyr://catalog') {
				return rpcResult(rpc.id, {
					contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(buildAgentCatalog(), null, 2) }],
				});
			}
			if (uri === 'techfiyr://guardrails') {
				return rpcResult(rpc.id, {
					contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(GUARDRAILS, null, 2) }],
				});
			}
			if (uri === 'techfiyr://delivery-engine') {
				return rpcResult(rpc.id, {
					contents: [
						{
							uri,
							mimeType: 'application/json',
							text: JSON.stringify({ rapid_7day: DELIVERY_ENGINE_7DAY, extended_14day: DELIVERY_ENGINE_14DAY }, null, 2),
						},
					],
				});
			}
			return rpcError(rpc.id, -32002, `Resource not found: ${uri}`);
		}

		default:
			return rpcError(rpc.id, -32601, `Method not found: ${method}`);
	}
}

export async function OPTIONS() {
	return agentOptions();
}

export async function GET(req: Request) {
	const startedAtMs = Date.now();
	await recordAgentHit(req, {
		protocol: 'mcp',
		action: 'discovery_get',
		statusCode: 200,
		startedAtMs,
		summary: 'Probed GET /api/mcp server metadata',
	});
	return agentJson(
		{
			ok: true,
			protocol: 'mcp',
			protocolVersion: MCP_PROTOCOL_VERSION,
			transport: 'streamable-http',
			endpoint: `${SITE_URL}/api/mcp`,
			manifest: `${SITE_URL}/.well-known/mcp.json`,
			serverInfo: {
				name: 'techfiyr-a2a-mcp',
				version: '1.0.0',
			},
			tools: MCP_TOOLS.map((t) => t.name),
			resources: MCP_RESOURCES.map((r) => r.uri),
		},
		200,
	);
}

export async function POST(req: Request) {
	let rawBody: unknown;
	try {
		rawBody = await req.json();
	} catch {
		return agentJson(rpcError(null, -32700, 'Parse error: invalid JSON.'), 400);
	}

	const sessionId = req.headers.get('mcp-session-id') || generateId('mcp_sess');
	const extraHeaders = { 'Mcp-Session-Id': sessionId };

	if (Array.isArray(rawBody)) {
		const responses = [];
		for (const item of rawBody) {
			if (typeof item === 'object' && item !== null) {
				const out = await processRpc(item as JsonRpcRequest, req, sessionId);
				if (out) responses.push(out);
			} else {
				responses.push(rpcError(null, -32600, 'Invalid JSON-RPC batch item.'));
			}
		}
		if (responses.length === 0) {
			return new NextResponse(null, { status: 202, headers: { ...AGENT_CORS_HEADERS, ...extraHeaders } });
		}
		return agentJson(responses, 200, extraHeaders);
	}

	if (typeof rawBody !== 'object' || rawBody === null) {
		return agentJson(rpcError(null, -32600, 'Invalid Request'), 400, extraHeaders);
	}

	const out = await processRpc(rawBody as JsonRpcRequest, req, sessionId);
	if (out === null) {
		return new NextResponse(null, { status: 202, headers: { ...AGENT_CORS_HEADERS, ...extraHeaders } });
	}
	return agentJson(out, 200, extraHeaders);
}

