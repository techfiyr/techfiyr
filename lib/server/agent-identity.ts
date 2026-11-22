/*
 * Server-only agent identity resolution, detection, and classification.
 * Extracts explicit client identifiers, classifies AI platforms from user-agents,
 * parses identity details from buyer conversation turns, and prevents generic
 * fallback collisions across disparate A2A and MCP clients.
 */
import { isGenericAgentIdentity } from '@/lib/agent/security';
import { generateId, hashSecret } from './agent-store';

export { isGenericAgentIdentity };

export function classifyAgentClient(userAgent: string, explicitAgent?: string): string {
	const cleanExplicit = (explicitAgent || '').trim();
	if (cleanExplicit && !isGenericAgentIdentity(cleanExplicit)) {
		return cleanExplicit.slice(0, 80);
	}
	const ua = userAgent || '';
	if (/chatgpt|oai-searchbot|gptbot|openai/i.test(ua)) return 'ChatGPT / OpenAI Agent';
	if (/claude|anthropic/i.test(ua)) return 'Claude / Anthropic Agent';
	if (/gemini|google-extended|googlebot/i.test(ua)) return 'Gemini / Google Agent';
	if (/perplexity/i.test(ua)) return 'Perplexity Agent';
	if (/smithery/i.test(ua)) return 'Smithery MCP Agent';
	if (/mistral/i.test(ua)) return 'Mistral Agent';
	if (/cursor/i.test(ua)) return 'Cursor IDE Agent';
	if (/windsurf/i.test(ua)) return 'Windsurf Agent';
	if (/langchain|langgraph|crewai|autogen/i.test(ua)) return 'Agent Framework Client';
	if (/curl|httpie|node|undici|python|axios|postman/i.test(ua)) {
		const m = ua.match(/([A-Za-z0-9_-]+\/[0-9.]+)/);
		return m ? `${m[1]} Client` : 'Developer API Client';
	}
	return '';
}

export function extractAgentIdentityFromText(text: string): {
	name?: string;
	company?: string;
	location?: string;
	email?: string;
} {
	if (!text) return {};
	const res: { name?: string; company?: string; location?: string; email?: string } = {};

	// Operator / Owner / Agent Name
	const nameMatch =
		text.match(/(?:agent\s*(?:operator|owner|ownership|name)|operator|owner|your\s*name)\s*[:=-]\s*([^\n\r*]+)/i) ||
		text.match(/(?:i\s*am|my\s*name\s*is|this\s*is)\s+([A-Za-z0-9_\-\s]{2,40})/i);
	if (nameMatch) {
		const val = nameMatch[1].trim().replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
		if (val && !/^(who|what|city|country|official|client|an\s*ai|autonomous)/i.test(val)) {
			res.name = val.slice(0, 60);
		}
	}

	// Company / Client / Principal
	const compMatch = text.match(/(?:company|client|principal|startup|business)\s*(?:name)?\s*[:=-]\s*([^\n\r*]+)/i);
	if (compMatch) {
		const val = compMatch[1].trim().replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
		if (val && !/^(who|what|city|country|official)/i.test(val)) {
			res.company = val.slice(0, 80);
		}
	}

	// Location
	const locMatch = text.match(/(?:location|city\s*&?\s*country|based\s*in)\s*[:=-]\s*([^\n\r*]+)/i);
	if (locMatch) {
		const val = locMatch[1].trim().replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
		if (val && !/^(city|country|official)/i.test(val)) {
			res.location = val.slice(0, 80);
		}
	}

	// Email
	const emailMatch = text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
	if (emailMatch && !emailMatch[1].endsWith('@a2a.client') && !emailMatch[1].includes('techfiyr.com')) {
		res.email = emailMatch[1].toLowerCase().trim();
	}

	return res;
}

export function hasInquiryIdentity(params: {
	clientName?: string;
	agentName?: string;
	clientEmail?: string;
	companyName?: string;
	clientAgentId?: string;
	agentId?: string;
}): boolean {
	if (params.clientName && !isGenericAgentIdentity(params.clientName)) return true;
	if (params.agentName && !isGenericAgentIdentity(params.agentName)) return true;
	if (params.companyName && !isGenericAgentIdentity(params.companyName)) return true;
	if (params.clientEmail && !isGenericAgentIdentity(params.clientEmail) && !params.clientEmail.endsWith('@a2a.client')) return true;
	if (params.clientAgentId && !isGenericAgentIdentity(params.clientAgentId)) return true;
	if (params.agentId && !isGenericAgentIdentity(params.agentId)) return true;
	return false;
}

export function resolveAgentIdentity(
	req: Request,
	data?: Record<string, unknown>,
	fallbackProtocol: 'a2a' | 'mcp' | 'rest' = 'a2a',
): {
	agentId: string;
	agentName: string;
	clientEmail?: string;
	clientName?: string;
	companyName?: string;
	clientLocation?: string;
	hasProvidedIdentity: boolean;
	threadId?: string;
	sessionId?: string;
} {
	const ua = req.headers.get('user-agent') || '';
	const rawMessageText =
		(typeof data?.message === 'string' ? data.message : '') ||
		(typeof data?.description === 'string' ? data.description : '');
	const textExtracted = extractAgentIdentityFromText(rawMessageText);

	const explicitId =
		(typeof data?.clientAgentId === 'string' && data.clientAgentId) ||
		(typeof data?.agentId === 'string' && data.agentId) ||
		(typeof data?.agent_id === 'string' && data.agent_id) ||
		(typeof data?.client_id === 'string' && data.client_id) ||
		req.headers.get('x-agent-id') ||
		req.headers.get('x-client-agent-id') ||
		req.headers.get('x-agent-did') ||
		undefined;

	const explicitName =
		(typeof data?.clientName === 'string' && data.clientName) ||
		(typeof data?.name === 'string' && data.name) ||
		(typeof data?.agentName === 'string' && data.agentName) ||
		(typeof data?.agent_name === 'string' && data.agent_name) ||
		(typeof data?.senderName === 'string' && data.senderName) ||
		(typeof data?.sender === 'string' && data.sender) ||
		textExtracted.name ||
		req.headers.get('x-agent-name') ||
		req.headers.get('x-client-name') ||
		req.headers.get('x-sender-name') ||
		undefined;

	const explicitEmail =
		(typeof data?.clientEmail === 'string' && data.clientEmail) ||
		(typeof data?.email === 'string' && data.email) ||
		textExtracted.email ||
		req.headers.get('x-client-email') ||
		undefined;

	const companyName =
		(typeof data?.companyName === 'string' && data.companyName) ||
		(typeof data?.company === 'string' && data.company) ||
		(typeof data?.organization === 'string' && data.organization) ||
		textExtracted.company ||
		req.headers.get('x-company-name') ||
		req.headers.get('x-client-company') ||
		undefined;

	const clientLocation =
		(typeof data?.clientLocation === 'string' && data.clientLocation) ||
		(typeof data?.location === 'string' && data.location) ||
		textExtracted.location ||
		undefined;

	const threadId =
		(typeof data?.threadId === 'string' && data.threadId) ||
		(typeof data?.thread_id === 'string' && data.thread_id) ||
		req.headers.get('x-thread-id') ||
		undefined;

	const sessionId =
		(typeof data?.sessionId === 'string' && data.sessionId) ||
		(typeof data?.session_id === 'string' && data.session_id) ||
		(typeof data?.contextId === 'string' && data.contextId) ||
		req.headers.get('x-session-id') ||
		threadId ||
		undefined;

	const classified = classifyAgentClient(ua, explicitName || explicitId);

	let finalName = '';
	let finalId = '';

	if (explicitName && !isGenericAgentIdentity(explicitName)) {
		finalName = explicitName.trim();
	} else if (companyName && !isGenericAgentIdentity(companyName)) {
		finalName = companyName.trim();
	} else if (explicitEmail && !isGenericAgentIdentity(explicitEmail)) {
		const emailUser = explicitEmail.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
		finalName = emailUser ? `${emailUser.charAt(0).toUpperCase()}${emailUser.slice(1)}` : explicitEmail;
	}

	if (explicitId && !isGenericAgentIdentity(explicitId)) {
		finalId = explicitId.trim();
	} else if (finalName) {
		finalId = finalName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	}

	const hasProvidedIdentity = Boolean(
		(explicitName && !isGenericAgentIdentity(explicitName)) ||
		(companyName && !isGenericAgentIdentity(companyName)) ||
		(explicitEmail && !isGenericAgentIdentity(explicitEmail) && !explicitEmail.endsWith('@a2a.client')) ||
		(explicitId && !isGenericAgentIdentity(explicitId))
	);

	// Connect directly from request thread, no default dummy values from us
	const cleanEmail =
		explicitEmail && !isGenericAgentIdentity(explicitEmail) && !explicitEmail.endsWith('@a2a.client')
			? explicitEmail.trim()
			: undefined;

	return {
		agentId: finalId,
		agentName: finalName,
		clientEmail: cleanEmail,
		clientName: finalName || undefined,
		companyName: companyName ? companyName.trim() : undefined,
		clientLocation: clientLocation ? clientLocation.trim() : undefined,
		hasProvidedIdentity,
		threadId,
		sessionId,
	};
}

