/*
 * Runs before /admin requests: visitors without a valid admin session are sent to the login page,
 * and every admin response is marked private and noindex. This is only the first gate; each admin
 * page and server action checks the session again (lib/server/auth.ts).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/server/session';

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const signedIn = Boolean(verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value));
	const isLogin = pathname === '/admin/login';

	let response: NextResponse;
	if (!signedIn && !isLogin) {
		const url = new URL('/admin/login', request.url);
		if (pathname !== '/admin') url.searchParams.set('next', pathname);
		response = NextResponse.redirect(url);
	} else if (signedIn && isLogin) {
		response = NextResponse.redirect(new URL('/admin', request.url));
	} else {
		response = NextResponse.next();
	}

	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	response.headers.set('Cache-Control', 'private, no-store');
	return response;
}

export const config = {
	matcher: ['/admin', '/admin/:path*'],
};
