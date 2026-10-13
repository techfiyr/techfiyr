/*
 * Visitor counter API for the footer (assets/js/visitors.js).
 *
 *   POST /api/visits   counts one visit for the caller's country, returns the totals
 *   GET  /api/visits   returns the totals: { total: 123, countries: { BD: 40, US: 30, ... } }
 *
 * The country comes from Netlify's geolocation; the visitor's IP address is never stored.
 * Totals live in one Firestore document (stats/visits) and are updated with atomic increments.
 *
 * No npm dependencies: a Google service account signs its own OAuth token with node:crypto.
 * Credentials come from Netlify environment variables (never commit them):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
import { createSign } from 'node:crypto';

const DOC = 'stats/visits';
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|curl|wget|python|java\/|httpclient|axios|go-http/i;
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?techfiyr\.com|([a-z0-9-]+--)?techfiyr\.netlify\.app)$/;

const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || '';

// ---------- Google OAuth token (cached while the function stays warm) ----------
let cachedToken = null;
let cachedUntil = 0;

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

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
	const key = env('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
	const jwt = unsigned + '.' + createSign('RSA-SHA256').update(unsigned).sign(key, 'base64url');

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
	});
	if (!res.ok) throw new Error('token ' + res.status);
	const data = await res.json();
	cachedToken = data.access_token;
	cachedUntil = Date.now() + (data.expires_in - 120) * 1000;
	return cachedToken;
}

// ---------- Firestore REST ----------
const docName = () => `projects/${env('FIREBASE_PROJECT_ID')}/databases/(default)/documents/${DOC}`;
const api = 'https://firestore.googleapis.com/v1/';

async function readStats(token) {
	const res = await fetch(api + docName(), { headers: { Authorization: 'Bearer ' + token } });
	if (res.status === 404) return { total: 0, countries: {} };
	if (!res.ok) throw new Error('read ' + res.status);
	const f = (await res.json()).fields || {};
	const countries = {};
	const map = (f.countries && f.countries.mapValue && f.countries.mapValue.fields) || {};
	for (const code in map) countries[code] = Number(map[code].integerValue || 0);
	return { total: Number((f.total && f.total.integerValue) || 0), countries };
}

async function countVisit(token, country) {
	// update + empty mask + transforms = "set with merge" that creates the document if needed
	const res = await fetch(api + `projects/${env('FIREBASE_PROJECT_ID')}/databases/(default)/documents:commit`, {
		method: 'POST',
		headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			writes: [{
				update: { name: docName(), fields: {} },
				updateMask: { fieldPaths: [] },
				updateTransforms: [
					{ fieldPath: 'total', increment: { integerValue: '1' } },
					{ fieldPath: 'countries.' + country, increment: { integerValue: '1' } },
					{ fieldPath: 'updated', setToServerValue: 'REQUEST_TIME' }
				]
			}]
		})
	});
	if (!res.ok) throw new Error('commit ' + res.status);
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
	if (!env('FIREBASE_PROJECT_ID') || !env('FIREBASE_CLIENT_EMAIL') || !env('FIREBASE_PRIVATE_KEY')) {
		return json({ error: 'not configured' }, 503);
	}

	try {
		const token = await accessToken();

		if (req.method === 'GET') {
			return json(await readStats(token), 200, 'public, max-age=60, stale-while-revalidate=300');
		}

		if (req.method === 'POST') {
			const origin = req.headers.get('origin') || '';
			const ua = req.headers.get('user-agent') || '';
			// only count real browsers on our own site
			if (ALLOWED_ORIGIN.test(origin) && !BOT.test(ua)) {
				const code = ((context.geo && context.geo.country && context.geo.country.code) || '').toUpperCase();
				await countVisit(token, /^[A-Z]{2}$/.test(code) ? code : 'XX');
			}
			return json(await readStats(token), 200);
		}

		return json({ error: 'method not allowed' }, 405);
	} catch (err) {
		console.error('visits:', err.message);
		return json({ error: 'unavailable' }, 502);
	}
};

export const config = { path: '/api/visits' };
