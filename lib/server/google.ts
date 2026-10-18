/*
 * Google service-account access for the CMS (server only). The same service account as the visitor
 * counter (netlify/functions/visits.mjs) signs its own OAuth tokens with node:crypto, so no Google
 * SDK is needed. Credentials come from environment variables (AGENTS.md section 7.6):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
import { createSign } from 'node:crypto';

export const env = (key: string) => (process.env[key] || '').trim();

export const hasServiceAccount = () => Boolean(env('FIREBASE_PROJECT_ID') && env('FIREBASE_CLIENT_EMAIL') && env('FIREBASE_PRIVATE_KEY'));

// Accepts the key as pasted from the service-account JSON: with or without quotes, real or "\n" line breaks
function privateKey() {
	let k = env('FIREBASE_PRIVATE_KEY');
	if (/^(".*"|'.*')$/s.test(k)) k = k.slice(1, -1);
	return k.replace(/\\n/g, '\n');
}

const b64url = (v: string | object) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

export class GoogleError extends Error {
	constructor(public step: string, public status: number, public detail: string) {
		super(`${step} ${status}: ${detail}`);
	}
}

export async function googleError(res: Response): Promise<string> {
	const text = await res.text();
	try {
		const j = JSON.parse(text);
		return (j.error && (j.error.message || j.error_description || j.error)) || text;
	} catch {
		return text;
	}
}

export const SCOPES = {
	datastore: 'https://www.googleapis.com/auth/datastore',
	storage: 'https://www.googleapis.com/auth/devstorage.read_write',
	searchConsole: 'https://www.googleapis.com/auth/webmasters.readonly',
	analytics: 'https://www.googleapis.com/auth/analytics.readonly',
};

const tokens = new Map<string, { token: string; until: number }>();

/** OAuth access token for one scope, cached until a couple of minutes before it expires. */
export async function accessToken(scope: string): Promise<string> {
	const hit = tokens.get(scope);
	if (hit && Date.now() < hit.until) return hit.token;

	const now = Math.floor(Date.now() / 1000);
	const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
		iss: env('FIREBASE_CLIENT_EMAIL'),
		scope,
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600,
	})}`;
	let signature: string;
	try {
		signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey(), 'base64url');
	} catch {
		throw new GoogleError('sign', 0, 'FIREBASE_PRIVATE_KEY is not a valid private key');
	}

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
		cache: 'no-store',
	});
	if (!res.ok) throw new GoogleError('token', res.status, await googleError(res));
	const data = (await res.json()) as { access_token: string; expires_in: number };
	tokens.set(scope, { token: data.access_token, until: Date.now() + (data.expires_in - 120) * 1000 });
	return data.access_token;
}
