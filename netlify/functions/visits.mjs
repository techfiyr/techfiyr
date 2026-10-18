/*
 * Unique-visitor counter API for the footer (public/assets/js/visitors.js).
 *
 *   POST /api/visits   counts the caller once per day, returns the totals
 *   GET  /api/visits   returns the totals: { total: 123, countries: { BD: 40, US: 30, ... } }
 *
 * Uniqueness without cookies: the visitor's IP address and browser are turned into a one-way
 * HMAC with a key that changes every day and is never stored. Only that hash is saved (in
 * Firestore "uniques", with an expireAt date for a TTL policy), so the same person is counted
 * once per day and cannot be recognised on another day. Country comes from Netlify geolocation.
 * Totals live in one Firestore document (stats/visits) and are updated with atomic increments;
 * stats/daily-YYYY-MM keeps the count per day for the admin dashboard (no personal data).
 *
 * No npm dependencies: a Google service account signs its own OAuth token with node:crypto.
 * Credentials come from Netlify environment variables (never commit them):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * or the whole downloaded JSON key in one variable: FIREBASE_SERVICE_ACCOUNT (plain JSON or base64).
 */
import { createSign, createHash, createHmac } from 'node:crypto';

const STATS_DOC = 'stats/visits';
const UNIQUES = 'uniques';
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|java\/|httpclient|axios|go-http/i;
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?techfiyr\.com|([a-z0-9-]+--)?techfiyr\.netlify\.app)$/;

const rawEnv = (k) => ((globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || '').trim();

// FIREBASE_SERVICE_ACCOUNT: the service-account JSON in one variable; separate variables win when both exist
let serviceAccount;
function fromServiceAccount(k) {
	if (serviceAccount === undefined) {
		serviceAccount = {};
		let text = rawEnv('FIREBASE_SERVICE_ACCOUNT');
		if (text && !text.startsWith('{')) text = Buffer.from(text, 'base64').toString('utf8');
		try {
			if (text) serviceAccount = JSON.parse(text);
		} catch (e) {
			console.error('visits: FIREBASE_SERVICE_ACCOUNT is not valid JSON');
		}
	}
	const field = { FIREBASE_PROJECT_ID: 'project_id', FIREBASE_CLIENT_EMAIL: 'client_email', FIREBASE_PRIVATE_KEY: 'private_key' }[k];
	return field ? String(serviceAccount[field] || '').trim() : '';
}

const env = (k) => rawEnv(k) || fromServiceAccount(k);

class StepError extends Error {
	constructor(step, status, detail) {
		super(step + ' ' + status);
		this.step = step;
		this.status = status;
		this.detail = detail;
	}
}

// Accepts the key as pasted from the service-account JSON: with or without surrounding quotes,
// with real line breaks or with "\n" escapes.
function privateKey() {
	let k = env('FIREBASE_PRIVATE_KEY');
	if (/^(".*"|'.*')$/s.test(k)) k = k.slice(1, -1);
	return k.replace(/\\n/g, '\n');
}

// ---------- Google OAuth token (cached while the function stays warm) ----------
let cachedToken = null;
let cachedUntil = 0;

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

async function googleError(res) {
	const text = await res.text();
	try {
		const j = JSON.parse(text);
		return (j.error && (j.error.message || j.error_description || j.error)) || j.error_description || text;
	} catch (e) {
		return text;
	}
}

async function accessToken() {
	if (cachedToken && Date.now() < cachedUntil) return cachedToken;
	const now = Math.floor(Date.now() / 1000);
	const unsigned = b64url({ alg: 'RS256', typ: 'JWT' }) + '.' + b64url({
		iss: env('FIREBASE_CLIENT_EMAIL'),
		scope: 'https://www.googleapis.com/auth/datastore',
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600
	});
	let signature;
	try {
		signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey(), 'base64url');
	} catch (e) {
		throw new StepError('sign', 0, 'FIREBASE_PRIVATE_KEY is not a valid private key. Paste the whole private_key value from the service-account JSON, including the BEGIN and END lines.');
	}

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + signature })
	});
	if (!res.ok) throw new StepError('token', res.status, await googleError(res));
	const data = await res.json();
	cachedToken = data.access_token;
	cachedUntil = Date.now() + (data.expires_in - 120) * 1000;
	return cachedToken;
}

// ---------- Firestore REST ----------
const API = 'https://firestore.googleapis.com/v1/';
const root = () => `projects/${env('FIREBASE_PROJECT_ID')}/databases/(default)/documents`;

async function readStats(token) {
	const res = await fetch(API + root() + '/' + STATS_DOC, { headers: { Authorization: 'Bearer ' + token } });
	if (res.status === 404) {
		const detail = await googleError(res);
		// 404 for a missing document is normal before the first visit; a missing database is not
		if (/database/i.test(detail) && !/document/i.test(detail)) throw new StepError('read', 404, detail);
		return { total: 0, countries: {} };
	}
	if (!res.ok) throw new StepError('read', res.status, await googleError(res));
	const f = (await res.json()).fields || {};
	const countries = {};
	const map = (f.countries && f.countries.mapValue && f.countries.mapValue.fields) || {};
	for (const code in map) countries[code] = Number(map[code].integerValue || 0);
	return { total: Number((f.total && f.total.integerValue) || 0), countries };
}

// Creates the visitor's hash for today and increments the totals in one atomic commit.
// If the hash already exists, the commit fails as a whole and nothing is counted.
async function countUniqueVisit(token, visitorId, country) {
	const day = new Date().toISOString().slice(0, 10);
	const expireAt = new Date(Date.now() + 2 * 864e5).toISOString();
	const res = await fetch(API + root() + ':commit', {
		method: 'POST',
		headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			writes: [
				{
					update: { name: root() + '/' + UNIQUES + '/' + visitorId, fields: { expireAt: { timestampValue: expireAt } } },
					currentDocument: { exists: false }
				},
				{
					// update + empty mask + transforms = "set with merge" that creates the document if needed
					update: { name: root() + '/' + STATS_DOC, fields: {} },
					updateMask: { fieldPaths: [] },
					updateTransforms: [
						{ fieldPath: 'total', increment: { integerValue: '1' } },
						{ fieldPath: 'countries.' + country, increment: { integerValue: '1' } },
						{ fieldPath: 'updated', setToServerValue: 'REQUEST_TIME' }
					]
				},
				{
					// visitors per day for the admin dashboard: stats/daily-YYYY-MM, one field per day (d01..d31)
					update: { name: root() + '/stats/daily-' + day.slice(0, 7), fields: {} },
					updateMask: { fieldPaths: [] },
					updateTransforms: [{ fieldPath: 'd' + day.slice(8), increment: { integerValue: '1' } }]
				}
			]
		})
	});
	if (res.ok) return true;
	const detail = await googleError(res);
	if (res.status === 409 || /ALREADY_EXISTS|FAILED_PRECONDITION|already exists/i.test(detail)) return false;
	throw new StepError('commit', res.status, detail);
}

function visitorHash(req, context) {
	const day = new Date().toISOString().slice(0, 10);
	const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '';
	const ua = req.headers.get('user-agent') || '';
	// daily key derived from the secret key: changes every day, never stored
	const dailyKey = createHash('sha256').update(env('FIREBASE_PRIVATE_KEY') + '|' + day).digest();
	return day + '-' + createHmac('sha256', dailyKey).update(ip + '|' + ua).digest('base64url').slice(0, 32);
}

// ---------- Handler ----------
const json = (body, status, cache) => new Response(JSON.stringify(body), {
	status,
	headers: {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
		// GET results are cached at Netlify's edge for a minute to keep Firestore reads low
		'Netlify-CDN-Cache-Control': cache || 'no-store'
	}
});

export default async (req, context) => {
	const missing = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'].filter((k) => !env(k));
	if (missing.length) {
		if (!rawEnv('FIREBASE_SERVICE_ACCOUNT')) missing.push('(or FIREBASE_SERVICE_ACCOUNT)');
		return json({ error: 'not configured', detail: 'Missing environment variables (Functions scope): ' + missing.join(', ') }, 503);
	}

	try {
		const token = await accessToken();

		if (req.method === 'GET') {
			return json(await readStats(token), 200, 'public, max-age=60, stale-while-revalidate=300');
		}

		if (req.method === 'POST') {
			const origin = req.headers.get('origin') || '';
			const ua = req.headers.get('user-agent') || '';
			let counted = false;
			// only count real browsers on our own site
			if (ALLOWED_ORIGIN.test(origin) && !BOT.test(ua)) {
				const code = ((context.geo && context.geo.country && context.geo.country.code) || '').toUpperCase();
				counted = await countUniqueVisit(token, visitorHash(req, context), /^[A-Z]{2}$/.test(code) ? code : 'XX');
			}
			return json(Object.assign(await readStats(token), { counted }), 200);
		}

		return json({ error: 'method not allowed' }, 405);
	} catch (err) {
		// The step and Google's message (no secrets) make a failed deploy easy to diagnose in the browser
		console.error('visits:', err.step || 'error', err.status || '', err.detail || err.message);
		return json({ error: 'unavailable', step: err.step || 'unknown', status: err.status || 0, detail: String(err.detail || err.message).slice(0, 300) }, 502);
	}
};

export const config = { path: '/api/visits' };
