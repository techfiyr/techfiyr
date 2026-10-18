/*
 * /admin/login: the only public admin page. Email and password are checked by Firebase
 * Authentication, and only addresses in ADMIN_EMAILS get in (lib/server/auth.ts).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
	const { next } = await searchParams;
	return (
		<main className="admin-login" id="main">
			<section className="admin-login_brand" aria-hidden="true">
				<div>
					<img src="/assets/images/brand/logo.svg" alt="" width="166" height="54" />
					<p>Blog, products and the daily AI news for techfiyr.com, with visitors and search in one place.</p>
				</div>
				<div className="admin-login_word">Studio</div>
			</section>
			<section className="admin-login_panel">
				<div className="admin-login_box">
					<img className="admin-login_logo" src="/assets/images/brand/logo.svg" alt="TechFiyr" width="166" height="54" />
					<h1>Sign in to the admin panel</h1>
					<p className="admin-muted">For the TechFiyr site administrator only.</p>
					<LoginForm next={next || ''} />
					<p className="admin-login_back">
						<Link href="/">
							<i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Back to techfiyr.com
						</Link>
					</p>
				</div>
			</section>
		</main>
	);
}
