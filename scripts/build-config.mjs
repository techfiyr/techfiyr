/*
 * Netlify build step (see netlify.toml): writes public/firebase-config.js from environment variables,
 * so the Firebase web config is not stored in the Git repository.
 * The generated file is git-ignored. Without the variables (e.g. local preview) it sets
 * window.TECHFIYR_FIREBASE = null and Google Analytics stays off.
 *
 * Note: a Firebase *web* config is public by design (every browser receives it). Protect the
 * project by restricting the API key to the site's domains in Google Cloud Console.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/firebase-config.js', import.meta.url));

const env = process.env;
const config = {
	apiKey: env.FIREBASE_API_KEY,
	authDomain: env.FIREBASE_AUTH_DOMAIN,
	projectId: env.FIREBASE_PROJECT_ID,
	storageBucket: env.FIREBASE_STORAGE_BUCKET,
	messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
	appId: env.FIREBASE_APP_ID,
	measurementId: env.FIREBASE_MEASUREMENT_ID
};
const ok = Boolean(config.apiKey && config.projectId && config.appId && config.measurementId);

writeFileSync(OUT,
	'/* Generated at build time by scripts/build-config.mjs from Netlify environment variables. Do not edit or commit. */\n' +
	'window.TECHFIYR_FIREBASE = ' + (ok ? JSON.stringify(config) : 'null') + ';\n');

console.log(ok ? 'firebase-config.js written' : 'Firebase env vars missing: firebase-config.js disables analytics');
