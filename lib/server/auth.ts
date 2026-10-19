/*
 * Admin sign-in (server only). Passwords are checked by Firebase Authentication (email/password
 * provider) through its REST API; only addresses in ADMIN_EMAILS may sign in. Nobody can register:
 * the admin account is created by hand in the Firebase console (AGENTS.md section 7.8).
 *
 * Local development without Firebase: set ADMIN_EMAILS and ADMIN_LOCAL_PASSWORD in .env.local.
 * That fallback is ignored in production.
 */
import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/site';
import { env } from './google';
import { SESSION_COOKIE, SESSION_HOURS, createSessionToken, isAdminEmail, verifySessionToken } from './session';

export type SignInResult = { ok: true; email: string } | { ok: false; error: string };

const GENERIC = 'That email and password combination is not valid for the admin panel.';

const sameText = (a: string, b: string) => {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
};

export async function checkPassword(email: string, password: string): Promise<SignInResult> {
	const address = email.trim().toLowerCase();
	if (!address || !password) return { ok: false, error: 'Enter your email address and password.' };
	if (!isAdminEmail(address)) return { ok: false, error: GENERIC };

	const apiKey = env('FIREBASE_API_KEY');
	if (apiKey) {
		const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
			method: 'POST',
			// the browser API key is restricted to the site's addresses, so name the site as the referrer
			headers: { 'Content-Type': 'application/json', Referer: `${SITE_URL}/` },
			body: JSON.stringify({ email: address, password, returnSecureToken: true }),
			cache: 'no-store',
		});
		if (res.ok) {
			const data = (await res.json()) as { email?: string };
			return data.email && isAdminEmail(data.email) ? { ok: true, email: data.email.toLowerCase() } : { ok: false, error: GENERIC };
		}
		const detail = await res.text();
		if (/TOO_MANY_ATTEMPTS/.test(detail)) return { ok: false, error: 'Too many failed attempts. Wait a few minutes, or reset the password in the Firebase console.' };
		if (/USER_DISABLED/.test(detail)) return { ok: false, error: 'This admin account is disabled in Firebase Authentication.' };
		if (/OPERATION_NOT_ALLOWED|CONFIGURATION_NOT_FOUND/.test(detail)) return { ok: false, error: 'Email/password sign-in is not enabled in Firebase Authentication.' };
		if (/API_KEY|referer|referrer|identitytoolkit/i.test(detail)) {
			console.error('[admin sign-in] Firebase rejected the API key:', detail);
			if (/API_KEY_SERVICE_BLOCKED|identitytoolkit/i.test(detail)) return { ok: false, error: 'The API key may not call the Identity Toolkit API. In Google Cloud Console → Credentials → this key → API restrictions, add "Identity Toolkit API" (or choose "Don\'t restrict key").' };
			if (/REFERRER_BLOCKED|referer|referrer/i.test(detail)) return { ok: false, error: `The API key's website restrictions block ${SITE_URL}/. Add techfiyr.com/* and https://techfiyr.com/* under Website restrictions.` };
			if (/API_KEY_INVALID|not valid/i.test(detail)) return { ok: false, error: 'FIREBASE_API_KEY is not a valid key. Check its value in Netlify (Functions scope, no quotes or spaces) and redeploy.' };
			return { ok: false, error: 'Firebase rejected the API key. See the function log for the reason.' };
		}
		return { ok: false, error: GENERIC };
	}

	const localPassword = process.env.NODE_ENV !== 'production' ? env('ADMIN_LOCAL_PASSWORD') : '';
	if (localPassword) return sameText(password, localPassword) ? { ok: true, email: address } : { ok: false, error: GENERIC };

	return { ok: false, error: 'Admin sign-in is not configured (FIREBASE_API_KEY is missing).' };
}

export async function startSession(email: string) {
	(await cookies()).set(SESSION_COOKIE, createSessionToken(email), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/',
		maxAge: SESSION_HOURS * 3600,
	});
}

export async function endSession() {
	(await cookies()).delete(SESSION_COOKIE);
}

export async function currentAdmin(): Promise<string | null> {
	return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For admin pages and every server action: the signed-in admin, or a redirect to the login page. */
export async function requireAdmin(): Promise<string> {
	const email = await currentAdmin();
	if (!email) redirect('/admin/login');
	return email;
}
