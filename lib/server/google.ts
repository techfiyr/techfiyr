/*
 * Google service-account access for the CMS (server only). The same service account as the visitor
 * counter (netlify/functions/visits.mjs) signs its own OAuth tokens with node:crypto, so no Google
 * SDK is needed. Credentials, first match wins (AGENTS.md sections 7.6 and 7.8):
 *   FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY   three separate variables
 *   FIREBASE_SERVICE_ACCOUNT        the whole downloaded JSON key in one variable (or base64 of it)
 *   FIREBASE_SERVICE_ACCOUNT_FILE   local development: the path to that JSON file
 */
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const env = (key: string) => (process.env[key] || '').trim();

type Credentials = { projectId: string; clientEmail: string; privateKey: string };
let fromJson: Credentials | null | undefined;

/** The service-account JSON from FIREBASE_SERVICE_ACCOUNT (plain or base64) or FIREBASE_SERVICE_ACCOUNT_FILE. */
function jsonKey(): Credentials | null {
	if (fromJson !== undefined) return fromJson;
	fromJson = null;
	let text = env('FIREBASE_SERVICE_ACCOUNT');
	let source = 'FIREBASE_SERVICE_ACCOUNT';
	if (text && !text.startsWith('{')) text = Buffer.from(text, 'base64').toString('utf8');
	if (!text && env('FIREBASE_SERVICE_ACCOUNT_FILE')) {
		source = 'FIREBASE_SERVICE_ACCOUNT_FILE';
		try {
			text = readFileSync(env('FIREBASE_SERVICE_ACCOUNT_FILE'), 'utf8');
		} catch {
			text = '';
		}
	}
	if (!text) return null;
	try {
		const j = JSON.parse(text) as { project_id?: string; client_email?: string; private_key?: string };
		fromJson = { projectId: j.project_id || '', clientEmail: j.client_email || '', privateKey: j.private_key || '' };
	} catch {
		console.error(`${source} is not a valid service-account JSON key`);
	}
	return fromJson;
}

function credentials(): Credentials {
	const fromFile = jsonKey();
	// Accepts the key as pasted from the service-account JSON: with or without quotes, real or "\n" line breaks
	let key = env('FIREBASE_PRIVATE_KEY');
	if (/^(".*"|'.*')$/s.test(key)) key = key.slice(1, -1);
	return {
		projectId: env('FIREBASE_PROJECT_ID') || fromFile?.projectId || '',
		clientEmail: env('FIREBASE_CLIENT_EMAIL') || fromFile?.clientEmail || '',
		privateKey: key ? key.replace(/\\n/g, '\n') : fromFile?.privateKey || '',
	};
}

export const projectId = () => credentials().projectId;
export const serviceAccountEmail = () => credentials().clientEmail;

export const hasServiceAccount = () => {
	const c = credentials();
	return Boolean(c.projectId && c.clientEmail && c.privateKey);
};

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
		iss: credentials().clientEmail,
		scope,
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600,
	})}`;
	let signature: string;
	try {
		signature = createSign('RSA-SHA256').update(unsigned).sign(credentials().privateKey, 'base64url');
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
