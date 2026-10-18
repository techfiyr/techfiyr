/*
 * Main footer, shared by every page through app/(site)/layout.tsx.
 * The typed word (.variable-text) and "let's discuss!" animation run from public/assets/js/script.js;
 * the visitor counter and map from public/assets/js/visitors.js (data: /api/visits).
 */
import Link from 'next/link';
import { CONTACT } from '@/lib/site';

export default function Footer() {
	return (
		<footer className="main-footer">
			<div className="main-footer_bg-color"></div>
			{' '}
			<div className="main-footer_vector" style={{ backgroundImage: 'url(/assets/images/icons/vector-3.png)' }}></div>
			{' '}
			<div className="auto-container">
				<div className="inner-container">
					<div className="footer-logo">
						<Link href="/">
							<img width="133" height="120" loading="lazy" decoding="async" src="/assets/images/brand/logo-footer.svg" alt="TechFiyr Logo" title="TechFiyr" />
						</Link>
					</div>
					{' '}
					<div className="d-flex justify-content-between align-items-center flex-wrap">
						<div className="footer-text">
							Empowering Startups &amp; Growing Businesses{' '}
							<br />
							{' '}With High-Performance Mobile &amp; Web Engineering
						</div>
						{/* Social Box */}
						{' '}
						<div className="footer-social_box">
							<a href={CONTACT.github} target="_blank" rel="noopener" aria-label="GitHub (opens in a new tab)">
								<i className="fa-brands fa-github" aria-hidden="true"></i>
							</a>
						</div>
					</div>
					{' '}
					<div className="footer-discuss">
						<span className="up-down_animation">let’s discuss!</span>
					</div>
					{' '}
					<ul className="footer-contact_list d-flex justify-content-end flex-wrap">
						<li>
							<a href={`mailto:${CONTACT.email}`}>
								<i className="fa-solid fa-envelope me-2" aria-hidden="true"></i>
								{CONTACT.email}
							</a>
						</li>
						{' '}
						<li>
							<a href={CONTACT.whatsapp} target="_blank" rel="noopener">
								<i className="fa-brands fa-whatsapp me-2" aria-hidden="true"></i>
								{CONTACT.phoneDisplay}
								<span className="sr-only">{' '}(WhatsApp, opens in a new tab)</span>
							</a>
						</li>
						{' '}
						<li>
							<span className="text-white opacity-75">
								<i className="fa-solid fa-location-dot me-2" aria-hidden="true"></i>
								Mirpur DOHS, Dhaka, Bangladesh
							</span>
						</li>
					</ul>
					{' '}
					<div className="footer-type_title variable-text"></div>
				</div>
			</div>
			{/* Visitor stats (assets/js/visitors.js, data from /api/visits); hidden until data loads */}
			{' '}
			<div className="auto-container">
				<div className="footer-visitors" data-visitors="" hidden>
					<div className="footer-visitors_stats">
						<span className="footer-visitors_label">Unique visitors</span>
						{' '}
						<span className="footer-visitors_total" data-visitors-total="">0</span>
						{' '}
						<span className="footer-visitors_sub">
							from{' '}
							<b data-visitors-countries="">0</b>
							{' '}countries
						</span>
						{' '}
						<h2 className="footer-visitors_heading">Top countries</h2>
						{' '}
						<ol className="footer-visitors_top" data-visitors-top=""></ol>
					</div>
					{' '}
					<div className="footer-visitors_map" data-visitors-map="" role="img" aria-label="World map shaded by number of visitors from each country"></div>
				</div>
			</div>
			{' '}
			<div className="footer-bottom">
				<div className="auto-container">
					{/* Copyright */}
					<div className="main-footer_copyright">TechFiyr © 2026. All Rights Reserved. Mobile App &amp; Web Software Agency.</div>
					{' '}
					<ul className="footer-legal">
						<li>
							<Link href="/privacy-policy">Privacy Policy</Link>
						</li>
						{' '}
						<li>
							<Link href="/cookie-policy">Cookie Policy</Link>
						</li>
						{' '}
						<li>
							<Link href="/content-policy">Content Policy</Link>
						</li>
						{' '}
						<li>
							<button type="button" data-consent-open="">Cookie settings</button>
						</li>
					</ul>
				</div>
			</div>
		</footer>
	);
}
