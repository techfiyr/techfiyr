/*
 * Shared HTTP response, CORS, and JSON body helpers for TechFiyr A2A & MCP endpoints.
 */
import { NextResponse } from 'next/server';

export const AGENT_CORS_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
	'Access-Control-Allow-Headers':
		'Content-Type, Authorization, X-Order-Token, X-Agent-Key, X-Marketing-Key, X-Agent-Id, X-Agent-DID, Mcp-Session-Id',
	'X-Robots-Tag': 'noindex',
};

export function agentJson(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
	return NextResponse.json(data, {
		status,
		headers: {
			...AGENT_CORS_HEADERS,
			'Cache-Control': 'no-store',
			...(extraHeaders || {}),
		},
	});
}

export function agentOptions() {
	return new NextResponse(null, {
		status: 204,
		headers: AGENT_CORS_HEADERS,
	});
}

export async function readJsonBody<T = Record<string, unknown>>(req: Request): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
	try {
		const raw = await req.text();
		if (raw.length > 100_000) {
			return { ok: false, error: 'Request payload exceeds 100 KB limit.' };
		}
		if (!raw.trim()) {
			return { ok: true, data: {} as T };
		}
		const parsed = JSON.parse(raw) as T;
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			return { ok: false, error: 'Request body must be a JSON object.' };
		}
		return { ok: true, data: parsed };
	} catch {
		return { ok: false, error: 'Invalid JSON request body.' };
	}
}

