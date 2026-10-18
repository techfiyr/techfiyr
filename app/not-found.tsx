/*
 * 404 page (stand-alone design, moved from public/404.html). Served for any unknown URL.
 * Plain <a> links on purpose: they load the main site fresh, with its own stylesheets.
 */
import type { Metadata } from 'next';
import css from '@/styles/not-found';
import { NOINDEX } from '@/lib/seo';

export const metadata: Metadata = {
	title: { absolute: 'TechFiyr | Page Not Found' },
	robots: NOINDEX,
};

export default function NotFound() {
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: css }} />
			<main>
				<a href="/"><img className="logo" src="/assets/images/brand/logo-white.svg" alt="TechFiyr" fetchPriority="low" /></a>
				<div className="status">Error 404</div>
				<h1>Page <span>not found.</span></h1>
				<p>The page you’re looking for has moved or never existed. Let’s get you back on track.</p>
				<div className="actions">
					<a className="btn btn-primary" href="/">Back to Home</a>
					{' '}
					<a className="btn btn-ghost" href="/contact">Get a Free Quote</a>
				</div>
				<ul className="links">
					<li><a href="/#services">Services</a></li>
					{' '}
					<li><a href="/#about">About us</a></li>
					{' '}
					<li><a href="/projects">Projects</a></li>
					{' '}
					<li><a href="/#testimonial">Reviews</a></li>
					{' '}
					<li><a href="/#team">Team</a></li>
				</ul>
			</main>
			<footer>&copy; 2026 TechFiyr. All rights reserved.</footer>
		</>
	);
}
