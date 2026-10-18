/*
 * Placeholder page (stand-alone design, moved from public/coming-soon.html). Kept out of search
 * results with noindex here and the X-Robots-Tag header in netlify.toml.
 */
import type { Metadata } from 'next';
import css from '@/styles/coming-soon';
import { NOINDEX } from '@/lib/seo';

export const metadata: Metadata = {
	title: { absolute: 'TechFiyr | Coming Soon' },
	robots: NOINDEX,
};

export default function ComingSoonPage() {
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: css }} />
			<main>
				<img className="logo" src="/assets/images/brand/logo-white.svg" alt="TechFiyr" />
				<div className="status">Something new is taking shape</div>
				<h1>Coming <span>Soon.</span></h1>
				<p>We’re creating a sharper digital experience for TechFiyr. Please check back soon.</p>
			</main>
			<footer>&copy; 2026 TechFiyr. All rights reserved.</footer>
		</>
	);
}
