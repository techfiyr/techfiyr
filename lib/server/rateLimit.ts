/*
 * In-memory sliding-window rate limiter for Next.js Serverless / Edge execution.
 * Protects public APIs (MCP, A2A, chat, quotes, orders) against bot flooding,
 * DDoS attempts, and Firebase / Netlify free tier quota exhaustion.
 */
import { NextResponse } from 'next/server';

type RateLimitRecord = {
	count: number;
	resetAt: number;
};

// In-memory bucket store per namespace: Map<key, RateLimitRecord>
const rateLimitStores = new Map<string, Map<string, RateLimitRecord>>();

// Periodic cleanup of expired rate limit entries to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanupExpired() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
	lastCleanup = now;

	for (const [, store] of rateLimitStores) {
		for (const [key, record] of store) {
			if (now >= record.resetAt) {
				store.delete(key);
			}
		}
	}
}

export type RateLimitOptions = {
	limit?: number; // Max allowed requests in the time window
	windowMs?: number; // Time window in milliseconds (default 60,000 ms = 1 minute)
	keyPrefix?: string; // Namespace prefix, e.g. 'mcp', 'chat', 'agent'
};

export type RateLimitResult = {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: number;
	clientIp: string;
};

/**
 * Extracts client IP using verified proxy headers (Netlify's verified IP header first).
 */
export function getClientIp(req: Request): string {
	const nfIp = req.headers.get('x-nf-client-connection-ip');
	if (nfIp && nfIp.trim()) return nfIp.trim();

	const xff = req.headers.get('x-forwarded-for');
	if (xff) {
		const first = xff.split(',')[0]?.trim();
		if (first) return first;
	}

	const realIp = req.headers.get('x-real-ip');
	if (realIp && realIp.trim()) return realIp.trim();

	return '127.0.0.1';
}

/**
 * Evaluates whether a request is within its rate limit window.
 */
export function checkRateLimit(req: Request, options: RateLimitOptions = {}): RateLimitResult {
	cleanupExpired();

	const limit = options.limit ?? 60;
	const windowMs = options.windowMs ?? 60_000;
	const prefix = options.keyPrefix ?? 'global';
	const clientIp = getClientIp(req);

	// Optional client token or agent DID to namespace beyond shared IPs
	const agentToken =
		req.headers.get('x-agent-id') ||
		req.headers.get('x-agent-did') ||
		req.headers.get('mcp-session-id') ||
		'';
	const clientKey = agentToken ? `${clientIp}:${agentToken.slice(0, 32)}` : clientIp;

	let store = rateLimitStores.get(prefix);
	if (!store) {
		store = new Map<string, RateLimitRecord>();
		rateLimitStores.set(prefix, store);
	}

	const now = Date.now();
	const record = store.get(clientKey);

	if (!record || now >= record.resetAt) {
		store.set(clientKey, { count: 1, resetAt: now + windowMs });
		return {
			allowed: true,
			limit,
			remaining: Math.max(0, limit - 1),
			resetAt: now + windowMs,
			clientIp,
		};
	}

	if (record.count >= limit) {
		return {
			allowed: false,
			limit,
			remaining: 0,
			resetAt: record.resetAt,
			clientIp,
		};
	}

	record.count += 1;
	return {
		allowed: true,
		limit,
		remaining: Math.max(0, limit - record.count),
		resetAt: record.resetAt,
		clientIp,
	};
}

/**
 * Standard 429 Too Many Requests response with standard headers.
 */
export function rateLimitResponse(
	result: RateLimitResult,
	extraHeaders?: Record<string, string>,
): NextResponse {
	const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

	return NextResponse.json(
		{
			ok: false,
			code: 'RATE_LIMIT_EXCEEDED',
			error: 'Too many requests. Please slow down and try again later.',
			retryAfter: retryAfterSeconds,
		},
		{
			status: 429,
			headers: {
				'Retry-After': String(retryAfterSeconds),
				'X-RateLimit-Limit': String(result.limit),
				'X-RateLimit-Remaining': '0',
				'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
				...(extraHeaders || {}),
			},
		},
	);
}

/**
 * Standard JSON-RPC 2.0 error response for MCP when rate limit is exceeded.
 */
export function mcpRateLimitError(
	id: string | number | null | undefined,
	result: RateLimitResult,
) {
	const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
	return {
		jsonrpc: '2.0',
		id: id ?? null,
		error: {
			code: -32000,
			message: `Rate limit exceeded. Please slow down and retry in ${retryAfterSeconds}s.`,
			data: { retryAfter: retryAfterSeconds },
		},
	};
}

/**
 * Enforces maximum request payload size before parsing to prevent memory exhaustion / DDoS.
 */
export function isPayloadWithinLimit(req: Request, maxBytes = 262_144): boolean {
	const len = req.headers.get('content-length');
	if (len) {
		const bytes = parseInt(len, 10);
		if (Number.isFinite(bytes) && bytes > maxBytes) {
			return false;
		}
	}
	return true;
}

