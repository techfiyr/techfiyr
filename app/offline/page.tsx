/*
 * Offline fallback for the PWA: public/sw.js shows this page when a visitor opens a page that
 * isn't saved on the device and there is no connection. Same stand-alone design as the 404 page,
 * with inline styles so it renders without the network. Not indexed and not in the sitemap.
 */
import type { Metadata } from 'next';
import css from '@/styles/not-found';
import { NOINDEX } from '@/lib/seo';

export const metadata: Metadata = {
	title: { absolute: 'TechFiyr | You Are Offline' },
	robots: NOINDEX,
};

export default function OfflinePage() {
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: css }} />
			<main>
				<a href="/"><img className="logo" src="/assets/images/brand/logo-white.svg" alt="TechFiyr" /></a>
				<div className="status">No connection</div>
				<h1>You’re <span>offline.</span></h1>
				<p>This page isn’t saved on your device yet. Pages you have already visited still open; reconnect to see the rest.</p>
				<div className="actions">
					<a className="btn btn-primary" href="/">Back to Home</a>
					{' '}
					<a className="btn btn-ghost" href={`mailto:info@techfiyr.com`}>Email info@techfiyr.com</a>
				</div>
			</main>
			<footer>&copy; 2026 TechFiyr. All rights reserved.</footer>
		</>
	);
}
