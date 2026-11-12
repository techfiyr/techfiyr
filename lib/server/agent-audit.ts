/*
 * Agent Hit Audit Trail & Reach Counter (server only).
 * Records every MCP, A2A, REST, and Marketing Agent invocation with protocol, tool/action,
 * detected AI client/platform, privacy-safe client hash, latency, and summary, plus computes
 * live inquiry counts across Zoho Mail, MCP, and A2A channels.
 */
import {
	canPersistAgentStore,
	generateId,
	getAgentMetrics,
	hashSecret,
	listAuditHits,
	listInquiries,
	saveAgentMetrics,
	saveAuditHit,
	type AgentAuditHit,
	type AgentProtocol,
	type AgentReachMetrics,
} from './agent-store';

export function classifyAgentClient(userAgent: string, explicitAgent?: string): string {
	const cleanExplicit = (explicitAgent || '').trim();
	if (cleanExplicit && cleanExplicit !== 'anonymous-agent') {
		return cleanExplicit.slice(0, 80);
	}
	const ua = userAgent || '';
	if (/chatgpt|oai-searchbot|gptbot|openai/i.test(ua)) return 'ChatGPT / OpenAI';
	if (/claude|anthropic/i.test(ua)) return 'Claude / Anthropic';
	if (/gemini|google-extended|googlebot/i.test(ua)) return 'Gemini / Google';
	if (/perplexity/i.test(ua)) return 'Perplexity';
	if (/smithery/i.test(ua)) return 'Smithery MCP';
	if (/mistral/i.test(ua)) return 'Mistral';
	if (/langchain|langgraph|crewai|autogen/i.test(ua)) return 'Agent Framework';
	if (/curl|httpie|node|undici|python|axios|postman/i.test(ua)) {
		const m = ua.match(/([A-Za-z0-9_-]+\/[0-9.]+)/);
		return m ? m[1] : 'API / Script Client';
	}
	return ua ? ua.slice(0, 60) : 'Unknown Agent';
}

export async function recordAgentHit(
	req: Request,
	params: {
		protocol: AgentProtocol;
		action: string;
		endpoint?: string;
		agentName?: string;
		toolName?: string;
		statusCode: number;
		startedAtMs: number;
		summary: string;
		inquiryId?: string;
		orderId?: string;
	},
): Promise<void> {
	if (!canPersistAgentStore()) return;

	try {
		const now = new Date().toISOString();
		const ua = (req.headers.get('user-agent') || '').slice(0, 180);
		const ip =
			req.headers.get('x-nf-client-connection-ip') ||
			req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			'local';
		const explicitAgent =
			params.agentName || req.headers.get('x-agent-id') || req.headers.get('x-agent-did') || undefined;
		const agentName = classifyAgentClient(ua, explicitAgent);
		const endpoint = params.endpoint || new URL(req.url).pathname;

		const hit: AgentAuditHit = {
			id: `hit_${Date.now().toString(36)}_${generateId('h').slice(2, 8)}`,
			timestamp: now,
			protocol: params.protocol,
			method: req.method,
			endpoint,
			action: params.action.slice(0, 100),
			agent_name: agentName,
			user_agent: ua,
			client_hash: hashSecret(`${ip}|${ua}`).slice(0, 12),
			status_code: params.statusCode,
			duration_ms: Math.max(0, Date.now() - params.startedAtMs),
			summary: params.summary.slice(0, 240),
			inquiry_id: params.inquiryId,
			order_id: params.orderId,
		};

		const current = await getAgentMetrics();
		const uniqueSet = new Set(current.uniqueAgents);
		uniqueSet.add(agentName);
		const toolCalls = { ...current.toolCalls };
		const toolKey = params.toolName || (params.protocol === 'mcp' ? params.action : '');
		if (toolKey) {
			toolCalls[toolKey] = (toolCalls[toolKey] || 0) + 1;
		}

		const nextMetrics: AgentReachMetrics = {
			totalHits: current.totalHits + 1,
			mcpHits: current.mcpHits + (params.protocol === 'mcp' ? 1 : 0),
			a2aHits: current.a2aHits + (params.protocol === 'a2a' ? 1 : 0),
			restHits: current.restHits + (params.protocol === 'rest' ? 1 : 0),
			marketingHits: current.marketingHits + (params.protocol === 'marketing' ? 1 : 0),
			toolCalls,
			uniqueAgents: Array.from(uniqueSet).slice(-100),
			lastHitAt: now,
		};

		await Promise.all([saveAuditHit(hit), saveAgentMetrics(nextMetrics)]);
	} catch (err) {
		console.warn('[agent-audit] failed to record hit:', err instanceof Error ? err.message : err);
	}
}

export type AgentReachSummary = {
	metrics: AgentReachMetrics;
	recentHits: AgentAuditHit[];
	inquiries: {
		total: number;
		openOrNegotiating: number;
		closedDeals: number;
		rejected: number;
		byChannel: {
			email: number;
			mcp: number;
			a2a: number;
		};
		totalMessagesExchanged: number;
	};
};

export function defaultAgentReachSummary(): AgentReachSummary {
	return {
		metrics: {
			totalHits: 0,
			mcpHits: 0,
			a2aHits: 0,
			restHits: 0,
			marketingHits: 0,
			toolCalls: {},
			uniqueAgents: [],
			lastHitAt: '',
		},
		recentHits: [],
		inquiries: {
			total: 0,
			openOrNegotiating: 0,
			closedDeals: 0,
			rejected: 0,
			byChannel: {
				email: 0,
				mcp: 0,
				a2a: 0,
			},
			totalMessagesExchanged: 0,
		},
	};
}

export async function getAgentReachSummary(hitLimit = 100): Promise<AgentReachSummary> {
	try {
		const [metrics, recentHits, inquiries] = await Promise.all([
			getAgentMetrics().catch(() => ({
				totalHits: 0,
				mcpHits: 0,
				a2aHits: 0,
				restHits: 0,
				marketingHits: 0,
				toolCalls: {},
				uniqueAgents: [],
				lastHitAt: '',
			})),
			listAuditHits(hitLimit).catch(() => []),
			listInquiries().catch(() => []),
		]);

		const safeInquiries = Array.isArray(inquiries) ? inquiries : [];

		return {
			metrics: metrics || defaultAgentReachSummary().metrics,
			recentHits: Array.isArray(recentHits) ? recentHits : [],
			inquiries: {
				total: safeInquiries.length,
				openOrNegotiating: safeInquiries.filter((i) => i.status === 'PENDING' || i.status === 'NEGOTIATING').length,
				closedDeals: safeInquiries.filter((i) => i.status === 'CLOSED').length,
				rejected: safeInquiries.filter((i) => i.status === 'REJECTED').length,
				byChannel: {
					email: safeInquiries.filter((i) => i.channel === 'gmail' || i.channel === 'zoho_email' || i.channel === 'email').length,
					mcp: safeInquiries.filter((i) => i.channel === 'mcp').length,
					a2a: safeInquiries.filter((i) => i.channel === 'a2a').length,
				},
				totalMessagesExchanged: safeInquiries.reduce((sum, i) => sum + (Array.isArray(i.messages) ? i.messages.length : 0), 0),
			},
		};
	} catch (err) {
		console.warn('[agent-audit] getAgentReachSummary fallback:', err instanceof Error ? err.message : err);
		return defaultAgentReachSummary();
	}
}

