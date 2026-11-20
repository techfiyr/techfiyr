/*
 * Server-only agent identity resolution, detection, and classification.
 * Extracts explicit client identifiers, classifies AI platforms from user-agents,
 * parses identity details from buyer conversation turns, and prevents generic
 * fallback collisions across disparate A2A and MCP clients.
 */
import { hashSecret } from './agent-store';

export function isGenericAgentIdentity(nameOrId?: string): boolean {
	if (!nameOrId) return true;
	const clean = nameOrId.trim().toLowerCase();
	return (
		!clean ||
		clean === 'autonomous-buyer' ||
		clean === 'mcp-client' ||
		clean === 'a2a-client' ||
		clean === 'client' ||
		clean === 'anonymous-agent' ||
		clean === 'unknown agent' ||
		clean === 'agent' ||
		clean === 'client@techfiyr.com' ||
		clean === 'client@a2a.client' ||
		clean === 'autonomous-buyer@a2a.client' ||
		clean === 'mcp-client@a2a.client' ||
		clean === 'api / script client'
	);
}

export function classifyAgentClient(userAgent: string, explicitAgent?: string): string {
	const cleanExplicit = (explicitAgent || '').trim();
	if (cleanExplicit && !isGenericAgentIdentity(cleanExplicit)) {
		return cleanExplicit.slice(0, 80);
	}
	const ua = userAgent || '';
	if (/chatgpt|oai-searchbot|gptbot|openai/i.test(ua)) return 'ChatGPT / OpenAI';
	if (/claude|anthropic/i.test(ua)) return 'Claude / Anthropic';
	if (/gemini|google-extended|googlebot/i.test(ua)) return 'Gemini / Google';
	if (/perplexity/i.test(ua)) return 'Perplexity';
	if (/smithery/i.test(ua)) return 'Smithery MCP';
	if (/mistral/i.test(ua)) return 'Mistral';
	if (/cursor/i.test(ua)) return 'Cursor IDE';
	if (/windsurf/i.test(ua)) return 'Windsurf';
	if (/langchain|langgraph|crewai|autogen/i.test(ua)) return 'Agent Framework';
	if (/curl|httpie|node|undici|python|axios|postman/i.test(ua)) {
		const m = ua.match(/([A-Za-z0-9_-]+\/[0-9.]+)/);
		return m ? m[1] : 'API / Script Client';
	}
	return ua ? ua.slice(0, 60) : 'Autonomous Agent';
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
		if (val && !/^(who|what|city|country|official|client|an\s*ai)/i.test(val)) {
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
} {
	const ua = req.headers.get('user-agent') || '';
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
		(typeof data?.agentName === 'string' && data.agentName) ||
		(typeof data?.agent_name === 'string' && data.agent_name) ||
		(typeof data?.senderName === 'string' && data.senderName) ||
		(typeof data?.sender === 'string' && data.sender) ||
		req.headers.get('x-agent-name') ||
		req.headers.get('x-client-name') ||
		req.headers.get('x-sender-name') ||
		undefined;

	const explicitEmail =
		(typeof data?.clientEmail === 'string' && data.clientEmail) ||
		(typeof data?.email === 'string' && data.email) ||
		req.headers.get('x-client-email') ||
		undefined;

	const companyName =
		(typeof data?.companyName === 'string' && data.companyName) ||
		(typeof data?.company === 'string' && data.company) ||
		undefined;

	const clientLocation =
		(typeof data?.clientLocation === 'string' && data.clientLocation) ||
		(typeof data?.location === 'string' && data.location) ||
		undefined;

	const classified = classifyAgentClient(ua, explicitName || explicitId);

	let finalName = '';
	if (explicitName && !isGenericAgentIdentity(explicitName)) {
		finalName = explicitName.trim();
	} else if (explicitId && !isGenericAgentIdentity(explicitId)) {
		finalName = explicitId.trim();
	} else if (classified && !isGenericAgentIdentity(classified)) {
		finalName = classified;
	} else {
		const ip =
			req.headers.get('x-nf-client-connection-ip') ||
			req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			'loc';
		const clientHash = hashSecret(`${ip}|${ua}`).slice(0, 6);
		finalName = `${fallbackProtocol.toUpperCase()}-Agent-${clientHash}`;
	}

	let finalId = '';
	if (explicitId && !isGenericAgentIdentity(explicitId)) {
		finalId = explicitId.trim();
	} else {
		finalId =
			finalName
				.toLowerCase()
				.replace(/[^a-z0-9_-]+/g, '-')
				.replace(/^-+|-+$/g, '') || `${fallbackProtocol}-agent`;
	}

	return {
		agentId: finalId,
		agentName: finalName,
		clientEmail: explicitEmail ? explicitEmail.trim() : undefined,
		clientName: finalName,
		companyName: companyName ? companyName.trim() : undefined,
		clientLocation: clientLocation ? clientLocation.trim() : undefined,
	};
}

