/*
 * Cookie Policy (/cookie-policy). Keep the cookie table in sync with public/assets/js/consent.js.
 * Markup is the original template's (converted from cookie-policy.html).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
	title: "Cookie Policy | TechFiyr",
	description: "TechFiyr uses no advertising cookies. See the cookies Google Analytics and Google Maps set only with your consent, and how to change your choice.",
	path: '/cookie-policy',
});

// Structured data: keep these facts identical to the home page and llms.txt
const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebPage",
				"@id": "https://techfiyr.com/cookie-policy#webpage",
				"url": "https://techfiyr.com/cookie-policy",
				"name": "Cookie Policy | TechFiyr",
				"description": "TechFiyr uses no advertising cookies. See the cookies Google Analytics and Google Maps set only with your consent, and how to change your choice.",
				"isPartOf": {
					"@id": "https://techfiyr.com/#website"
				},
				"about": {
					"@id": "https://techfiyr.com/#organization"
				},
				"dateModified": "2026-10-14",
				"inLanguage": "en"
			},
			{
				"@type": "ProfessionalService",
				"@id": "https://techfiyr.com/#organization",
				"name": "TechFiyr",
				"url": "https://techfiyr.com/",
				"logo": "https://techfiyr.com/assets/images/brand/logo.svg",
				"email": "info@techfiyr.com",
				"telephone": "+8801540659530",
				"address": {
					"@type": "PostalAddress",
					"streetAddress": "325, Mirpur DOHS",
					"addressLocality": "Dhaka",
					"postalCode": "1216",
					"addressCountry": "BD"
				}
			},
			{
				"@type": "BreadcrumbList",
				"itemListElement": [
					{
						"@type": "ListItem",
						"position": 1,
						"name": "Home",
						"item": "https://techfiyr.com/"
					},
					{
						"@type": "ListItem",
						"position": 2,
						"name": "Cookie Policy",
						"item": "https://techfiyr.com/cookie-policy"
					}
				]
			}
		]
	};

export default function CookiePolicyPage() {
	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Cookies" title="Cookie Policy" crumbs={[{ label: 'Home', href: '/' }, { label: "Cookie Policy" }]} />

			{/* Cookie Policy */}
			<>
				<section className="privacy-section">
					<div className="auto-container">
						<p className="date">
							Last updated:{' '}
							<time dateTime="2026-10-14">14 October 2026</time>
						</p>
						{' '}
						<div className="privacy-summary">
							<h2>In short</h2>
							{' '}
							<p>We never use advertising cookies. Without your permission, the only thing we store is your cookie choice. Google Analytics and the Google Map on our contact page set Google cookies, so they load only if you allow them. You can change your choice at any time:</p>
							{' '}
							<p>
								<button type="button" className="consent-btn consent-btn_accept" data-consent-open="">Open cookie settings</button>
							</p>
						</div>
						{' '}
						<nav aria-label="On this page">
							<ol className="privacy-toc">
								<li>
									<a href="#what-are-cookies">What cookies are</a>
								</li>
								{' '}
								<li>
									<a href="#cookies-we-use">Cookies and storage we use</a>
								</li>
								{' '}
								<li>
									<a href="#categories">Cookie categories</a>
								</li>
								{' '}
								<li>
									<a href="#manage">How to manage cookies</a>
								</li>
								{' '}
								<li>
									<a href="#changes">Changes to this policy</a>
								</li>
								{' '}
								<li>
									<a href="#contact">Contact us</a>
								</li>
							</ol>
						</nav>
						{' '}
						<div className="privacy-content" id="what-are-cookies">
							<h2>What cookies are</h2>
							{' '}
							<p>Cookies are small text files a website saves in your browser. Similar technologies, such as your browser's local storage, work in a similar way. In this policy, "cookies" covers both. First-party cookies are set by our site; third-party cookies are set by other services that a page loads.</p>
						</div>
						{' '}
						<div className="privacy-content" id="cookies-we-use">
							<h2>Cookies and storage we use</h2>
							{' '}
							<div className="privacy-table_wrap">
								<table className="privacy-table">
									<thead>
										<tr>
											<th scope="col">Name</th>
											<th scope="col">Provider</th>
											<th scope="col">Category</th>
											<th scope="col">Purpose</th>
											<th scope="col">Duration</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<code>techfiyr-consent</code>
												{' '}(local storage)
											</td>
											<td>TechFiyr (first party)</td>
											<td>Strictly necessary</td>
											<td>Remembers your cookie choice so we don't ask on every page</td>
											<td>12 months</td>
										</tr>
										<tr>
											<td>
												<code>_ga</code>
											</td>
											<td>Google Analytics (third party)</td>
											<td>Analytics</td>
											<td>Distinguishes visitors so Google Analytics can count them</td>
											<td>2 years</td>
										</tr>
										<tr>
											<td>
												<code>_ga_&lt;ID&gt;</code>
											</td>
											<td>Google Analytics (third party)</td>
											<td>Analytics</td>
											<td>Keeps track of the current visit (session)</td>
											<td>2 years</td>
										</tr>
										<tr>
											<td>
												Google cookies such as{' '}
												<code>NID</code>
											</td>
											<td>Google (third party)</td>
											<td>Embedded content</td>
											<td>Set by Google Maps on our contact page if you allow embedded content; used by Google as described in its policy</td>
											<td>Set by Google, up to about 6 months</td>
										</tr>
									</tbody>
								</table>
							</div>
							{' '}
							<p>
								Google Fonts, which we use for the site's typefaces, does not set cookies, but your browser sends your IP address to Google when it downloads the fonts. Our host, Netlify, keeps standard server logs, as explained in our{' '}
								<Link href="/privacy-policy">Privacy Policy</Link>
								. The visitor counter in our footer uses no cookies or local storage.
							</p>
						</div>
						{' '}
						<div className="privacy-content" id="categories">
							<h2>Cookie categories</h2>
							{' '}
							<h3>Strictly necessary</h3>
							{' '}
							<p>Needed for the site to work and to respect your choices. They are always on and don't need consent.</p>
							{' '}
							<h3>Analytics</h3>
							{' '}
							<p>
								Google Analytics, loaded through Google Firebase, helps us see which pages are useful and how people find us. It sets the{' '}
								<code>_ga</code>
								{' '}cookies above. Off until you allow it, and switched off again (with its cookies removed) if you withdraw consent.
							</p>
							{' '}
							<h3>Embedded content</h3>
							{' '}
							<p>Content from other services shown inside our pages, currently only Google Maps. Off until you allow it, either in the cookie banner, in cookie settings, or by clicking "Load map" on the contact page.</p>
							{' '}
							<p>We do not use advertising cookies. If we add any new type of cookie, we will update this policy and ask for your consent first.</p>
						</div>
						{' '}
						<div className="privacy-content" id="manage">
							<h2>How to manage cookies</h2>
							{' '}
							<ul className="privacy-list">
								<li>
									<b>On this site</b>
									: use{' '}
									<button type="button" className="consent-link" data-consent-open="">Cookie settings</button>
									, also linked at the bottom of every page. Your choice applies straight away.
								</li>
								{' '}
								<li>
									<b>Global Privacy Control</b>
									: if your browser sends this signal, we treat it as "reject non-essential".
								</li>
								{' '}
								<li>
									<b>In your browser</b>
									: you can block or delete cookies in your browser settings. Blocking strictly necessary storage means we'll ask for your choice on every visit.
								</li>
								{' '}
								<li>
									<b>Google</b>
									: see{' '}
									<a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener">how Google uses cookies</a>
									,{' '}
									<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google's Privacy Policy</a>
									, and the{' '}
									<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics opt-out browser add-on</a>
									.
								</li>
							</ul>
						</div>
						{' '}
						<div className="privacy-content" id="changes">
							<h2>Changes to this policy</h2>
							{' '}
							<p>If we add a new type of cookie, we will update this page and ask for your consent again where it's needed. The "Last updated" date shows the current version.</p>
						</div>
						{' '}
						<div className="privacy-content" id="contact">
							<h2>Contact us</h2>
							{' '}
							<p>
								Questions about cookies? Email{' '}
								<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
								{' '}or read our{' '}
								<Link href="/privacy-policy">Privacy Policy</Link>
								.
							</p>
						</div>
					</div>
				</section>
			</>
			{/* End Cookie Policy */}
		</>
	);
}
