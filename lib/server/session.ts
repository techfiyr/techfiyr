/*
 * Admin session token (server only, also used by proxy.ts). A signed, expiring value in an
 * HttpOnly cookie: base64url(JSON {email, exp}) + "." + HMAC-SHA256 with SESSION_SECRET.
 * Only addresses listed in ADMIN_EMAILS are ever accepted, so removing an address from that
 * variable ends its sessions on the next request.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tf_admin';
export const SESSION_HOURS = 12;

const DEV_SECRET = 'local-development-only-secret';

function secret(): string {
	const s = (process.env.SESSION_SECRET || '').trim();
	if (s.length >= 32) return s;
	if (process.env.NODE_ENV !== 'production') return DEV_SECRET;
	throw new Error('SESSION_SECRET must be set (at least 32 characters) to use the admin panel.');
}

export function adminEmails(): string[] {
	return (process.env.ADMIN_EMAILS || '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}

export const isAdminEmail = (email: string) => {
	const list = adminEmails();
	if (list.length === 0) return true;
	return list.includes(email.trim().toLowerCase());
};

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function createSessionToken(email: string): string {
	const payload = Buffer.from(JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + SESSION_HOURS * 3600e3 })).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

/** The admin's email when the token is genuine, unexpired and still allowed; otherwise null. */
export function verifySessionToken(token: string | undefined): string | null {
	if (!token) return null;
	const [payload, mac] = token.split('.');
	if (!payload || !mac) return null;
	let expected: string;
	try {
		expected = sign(payload);
	} catch {
		return null;
	}
	const a = Buffer.from(mac);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; exp?: number };
		if (!data.email || !data.exp || data.exp < Date.now()) return null;
		return isAdminEmail(data.email) ? data.email : null;
	} catch {
		return null;
	}
}
