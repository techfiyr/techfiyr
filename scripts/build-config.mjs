/*
 * Netlify build step (see netlify.toml): writes public/firebase-config.js from environment variables,
 * so the Firebase web config is not stored in the Git repository.
 * The generated file is git-ignored. Without the variables (e.g. local preview) it sets
 * window.TECHFIYR_FIREBASE = null and Google Analytics stays off.
 *
 * Note: a Firebase *web* config is public by design (every browser receives it). Protect the
 * project by restricting the API key to the site's domains in Google Cloud Console.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/firebase-config.js', import.meta.url));
const ENV_LOCAL = fileURLToPath(new URL('../.env.local', import.meta.url));

try {
	const content = readFileSync(ENV_LOCAL, 'utf8');
	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq > 0) {
			const k = trimmed.slice(0, eq).trim();
			let v = trimmed.slice(eq + 1).trim();
			if (/^(".*"|'.*')$/s.test(v)) v = v.slice(1, -1);
			if (process.env[k] === undefined) process.env[k] = v;
		}
	}
} catch {}

const env = process.env;
let projectId = env.FIREBASE_PROJECT_ID;
if (!projectId && env.FIREBASE_SERVICE_ACCOUNT) {
	try {
		let raw = env.FIREBASE_SERVICE_ACCOUNT.trim();
		if (raw && !raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
		const parsed = JSON.parse(raw);
		projectId = parsed.project_id || '';
	} catch {}
}

const config = {
	apiKey: env.FIREBASE_API_KEY,
	authDomain: env.FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : undefined),
	projectId: projectId,
	storageBucket: env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : undefined),
	messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
	appId: env.FIREBASE_APP_ID,
	measurementId: env.FIREBASE_MEASUREMENT_ID
};
const ok = Boolean(config.apiKey && config.projectId && config.appId && config.measurementId);

writeFileSync(OUT,
	'/* Generated at build time by scripts/build-config.mjs from Netlify environment variables. Do not edit or commit. */\n' +
	'window.TECHFIYR_FIREBASE = ' + (ok ? JSON.stringify(config) : 'null') + ';\n');

console.log(ok ? 'firebase-config.js written' : 'Firebase env vars missing: firebase-config.js disables analytics');
