/*
 * Privacy Policy (/privacy-policy). When it changes, update "Last updated", dateModified below and app/sitemap.ts.
 * Markup is the original template's (converted from privacy-policy.html).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
	title: "Privacy Policy | TechFiyr",
	description: "How TechFiyr collects, uses and protects your personal data when you visit our website or book a call, and the rights you have under GDPR and CCPA.",
	path: '/privacy-policy',
});

// Structured data: keep these facts identical to the home page and llms.txt
const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebPage",
				"@id": "https://techfiyr.com/privacy-policy#webpage",
				"url": "https://techfiyr.com/privacy-policy",
				"name": "Privacy Policy | TechFiyr",
				"description": "How TechFiyr collects, uses and protects your personal data when you visit our website or book a call, and the rights you have under GDPR and CCPA.",
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
						"name": "Privacy Policy",
						"item": "https://techfiyr.com/privacy-policy"
					}
				]
			}
		]
	};

export default function PrivacyPolicyPage() {
	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Privacy" title="Privacy Policy" crumbs={[{ label: 'Home', href: '/' }, { label: "Privacy Policy" }]} />

			{/* Privacy Policy */}
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
							<ul className="privacy-list">
								<li>We collect only what you give us (for example when you book a call) and basic technical data our hosting provider needs to run the site.</li>
								{' '}
								<li>We use it to reply to you, arrange calls and deliver projects. We never sell it and never use advertising cookies. Google Analytics runs only if you allow it.</li>
								{' '}
								<li>
									You can ask us to see, correct or delete your data at any time by emailing{' '}
									<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
									.
								</li>
							</ul>
						</div>
						{' '}
						<nav aria-label="On this page">
							<ol className="privacy-toc">
								<li>
									<a href="#who-we-are">Who we are</a>
								</li>
								{' '}
								<li>
									<a href="#data-we-collect">What data we collect</a>
								</li>
								{' '}
								<li>
									<a href="#how-we-use">How we use your data and our legal basis</a>
								</li>
								{' '}
								<li>
									<a href="#sharing">Who we share data with</a>
								</li>
								{' '}
								<li>
									<a href="#transfers">International transfers</a>
								</li>
								{' '}
								<li>
									<a href="#retention">How long we keep data</a>
								</li>
								{' '}
								<li>
									<a href="#your-rights">Your rights</a>
								</li>
								{' '}
								<li>
									<a href="#security">How we protect your data</a>
								</li>
								{' '}
								<li>
									<a href="#children">Children</a>
								</li>
								{' '}
								<li>
									<a href="#links">Links to other websites</a>
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
						<div className="privacy-content" id="who-we-are">
							<h2>Who we are</h2>
							{' '}
							<p>This website, techfiyr.com, is run by TechFiyr, a mobile app and web software agency. For the purposes of data protection law (including the EU and UK General Data Protection Regulation, "GDPR"), TechFiyr is the controller of the personal data described in this policy. You can reach us at:</p>
							{' '}
							<address className="text">
								<b>TechFiyr</b>
								<br />
								{' '}325, Mirpur DOHS, Dhaka 1216, Bangladesh
								<br />
								{' '}Email:{' '}
								<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
								<br />
								{' '}WhatsApp:{' '}
								<a href="https://wa.me/8801540659530" target="_blank" rel="noopener">
									+880 1540659530
									<span className="sr-only">{' '}(opens in a new tab)</span>
								</a>
							</address>
						</div>
						{' '}
						<div className="privacy-content" id="data-we-collect">
							<h2>What data we collect</h2>
							{' '}
							<h3>Information you give us</h3>
							{' '}
							<ul className="privacy-list">
								<li>
									<b>Discovery call bookings</b>
									{' '}on our{' '}
									<Link href="/contact">contact page</Link>
									: your name, email address, the service you are interested in, any message you add, the time slot you choose and your time zone.
								</li>
								{' '}
								<li>
									<b>Emails, calls and messages</b>
									{' '}you send us, including anything you share about your project.
								</li>
								{' '}
								<li>
									<b>Client project information</b>
									{' '}when we work together, such as business contact details, requirements and files you provide. This is also covered by our contract with you.
								</li>
							</ul>
							{' '}
							<h3>Information collected automatically</h3>
							{' '}
							<ul className="privacy-list">
								<li>
									<b>Server logs</b>
									: when you visit, our hosting provider records technical data such as your IP address, browser type, the pages requested and the time of the request. This is needed to deliver the site and keep it secure.
								</li>
								{' '}
								<li>
									<b>Font requests</b>
									: our pages load fonts from Google Fonts, so your browser sends your IP address to Google when it downloads them. Google Fonts does not set cookies.
								</li>
								{' '}
								<li>
									<b>Your cookie choice</b>
									, stored in your own browser. See our{' '}
									<Link href="/cookie-policy">Cookie Policy</Link>
									.
								</li>
								{' '}
								<li>
									<b>Google Maps</b>
									{' '}on our contact page loads only if you allow embedded content. Google may then set cookies and receive your IP address.
								</li>
								{' '}
								<li>
									<b>Google Analytics</b>
									{' '}(through Google Firebase) runs only if you allow analytics. It records the pages you view, how you arrived, your device and browser type and your approximate location (city or country), using the cookies listed in our{' '}
									<Link href="/cookie-policy">Cookie Policy</Link>
									. Google Analytics 4 does not log or store IP addresses.
								</li>
								{' '}
								<li>
									<b>Visitor counter</b>
									: the counter in our footer counts unique visitors per country. Your country is worked out by our host from your IP address. To count you only once a day, we turn your IP address and browser type into a one-way code using a key that changes every day; the code cannot be turned back into your IP address, cannot recognise you on another day, and is deleted after two days. We don't store your IP address or set cookies. Only the totals per country are kept.
								</li>
							</ul>
							{' '}
							<p>We do not use advertising or social media tracking tools, and we do not build advertising profiles of visitors.</p>
						</div>
						{' '}
						<div className="privacy-content" id="how-we-use">
							<h2>How we use your data and our legal basis</h2>
							{' '}
							<div className="privacy-table_wrap">
								<table className="privacy-table">
									<thead>
										<tr>
											<th scope="col">Purpose</th>
											<th scope="col">Data</th>
											<th scope="col">Legal basis (GDPR)</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Arrange and hold the discovery call you booked, and reply to your enquiries</td>
											<td>Booking details, messages</td>
											<td>Steps you asked for before a contract (Art. 6(1)(b)) and our legitimate interest in answering enquiries (Art. 6(1)(f))</td>
										</tr>
										<tr>
											<td>Deliver projects, invoice and support you</td>
											<td>Client project and contact information</td>
											<td>Performance of a contract (Art. 6(1)(b))</td>
										</tr>
										<tr>
											<td>Run, secure and fix the website</td>
											<td>Server logs</td>
											<td>Legitimate interest in a working, secure website (Art. 6(1)(f))</td>
										</tr>
										<tr>
											<td>Show the map on our contact page</td>
											<td>IP address, Google cookies</td>
											<td>Your consent (Art. 6(1)(a)), which you can withdraw at any time</td>
										</tr>
										<tr>
											<td>Understand how the site is used and improve it (Google Analytics)</td>
											<td>Pages viewed, device and browser, approximate location, Google Analytics cookies</td>
											<td>Your consent (Art. 6(1)(a)), which you can withdraw at any time</td>
										</tr>
										<tr>
											<td>Show how many people visit and from which countries</td>
											<td>Country and a daily one-way code made from your IP address and browser type (the IP address itself is not stored)</td>
											<td>Legitimate interest in simple, anonymous visit statistics (Art. 6(1)(f))</td>
										</tr>
										<tr>
											<td>Keep business and tax records</td>
											<td>Invoices and related contact details</td>
											<td>Legal obligation (Art. 6(1)(c))</td>
										</tr>
									</tbody>
								</table>
							</div>
							{' '}
							<p>We don't use your data for automated decision-making or profiling, and we only send you marketing emails if you have asked for them.</p>
						</div>
						{' '}
						<div className="privacy-content" id="sharing">
							<h2>Who we share data with</h2>
							{' '}
							<p>We never sell or rent your personal data. We share it only with service providers that help us run the business, and only as far as they need it:</p>
							{' '}
							<ul className="privacy-list">
								<li>
									<b>Netlify, Inc.</b>
									{' '}(USA): hosts this website, receives booking form submissions and keeps server logs.
								</li>
								{' '}
								<li>
									<b>Google LLC</b>
									{' '}(USA): Google Fonts, Google Maps and Google Analytics (each only with your consent where needed), Google Firebase/Cloud Firestore (stores the anonymous visitor totals), and Google Workspace tools such as Gmail, Google Calendar and Google Meet that we use to email you and hold calls.
								</li>
								{' '}
								<li>
									<b>Freelance marketplaces</b>
									{' '}such as Fiverr and Upwork, only if you choose to hire us there. Their own privacy policies apply.
								</li>
								{' '}
								<li>
									<b>Professional advisers and authorities</b>
									{' '}(for example accountants or a court) when the law requires it.
								</li>
							</ul>
						</div>
						{' '}
						<div className="privacy-content" id="transfers">
							<h2>International transfers</h2>
							{' '}
							<p>We are based in Bangladesh and our providers operate in the USA and other countries, so your data may be processed outside your own country, including outside the EU, UK or USA. Where the GDPR applies, we rely on our providers' Standard Contractual Clauses, the EU-US Data Privacy Framework where a provider is certified, or other lawful safeguards.</p>
						</div>
						{' '}
						<div className="privacy-content" id="retention">
							<h2>How long we keep data</h2>
							{' '}
							<ul className="privacy-list">
								<li>
									<b>Booking requests and enquiries</b>
									{' '}that don't become a project: up to 24 months after our last contact, then deleted.
								</li>
								{' '}
								<li>
									<b>Client and project records</b>
									: for the length of our work together, then as long as tax and accounting law requires (usually up to 6 years).
								</li>
								{' '}
								<li>
									<b>Server logs</b>
									: for the limited period set by our hosting provider.
								</li>
								{' '}
								<li>
									<b>Google Analytics data</b>
									: 14 months, then deleted automatically by Google.
								</li>
								{' '}
								<li>
									<b>Visitor counter codes</b>
									: deleted after two days.{' '}
									<b>Visitor totals per country</b>
									: kept indefinitely; they contain no personal data.
								</li>
								{' '}
								<li>
									<b>Your cookie choice</b>
									: 12 months in your browser, then we ask again.
								</li>
							</ul>
						</div>
						{' '}
						<div className="privacy-content" id="your-rights">
							<h2>Your rights</h2>
							{' '}
							<p>Depending on where you live, you have the right to:</p>
							{' '}
							<ul className="privacy-list">
								<li>access the personal data we hold about you and get a copy of it;</li>
								{' '}
								<li>correct data that is wrong or incomplete;</li>
								{' '}
								<li>ask us to delete your data;</li>
								{' '}
								<li>restrict or object to how we use it, including for direct marketing;</li>
								{' '}
								<li>receive your data in a portable format;</li>
								{' '}
								<li>
									withdraw consent at any time, for example in{' '}
									<button type="button" className="consent-link" data-consent-open="">Cookie settings</button>
									, without affecting earlier processing;
								</li>
								{' '}
								<li>complain to your data protection authority, such as your local EU supervisory authority or the UK Information Commissioner's Office (ICO).</li>
							</ul>
							{' '}
							<p>
								<b>California residents</b>
								: we do not sell or share personal information for cross-context behavioural advertising, and we don't use sensitive personal information. You can ask to know, correct or delete your information, and we won't treat you differently for doing so.
							</p>
							{' '}
							<p>
								To use any of these rights, email{' '}
								<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
								. We will reply within one month (or sooner where the law requires) and may ask you to confirm your identity first.
							</p>
						</div>
						{' '}
						<div className="privacy-content" id="security">
							<h2>How we protect your data</h2>
							{' '}
							<p>The site is served only over encrypted HTTPS. We limit access to personal data to the team members who need it, use reputable providers with strong security, and protect our accounts with strong passwords and two-factor authentication. No method of transmission or storage is completely secure, but we work to protect your data and will notify you and the authorities of a breach where the law requires.</p>
						</div>
						{' '}
						<div className="privacy-content" id="children">
							<h2>Children</h2>
							{' '}
							<p>Our website and services are meant for businesses and adults. We don't knowingly collect data from children under 16. If you believe a child has sent us personal data, contact us and we will delete it.</p>
						</div>
						{' '}
						<div className="privacy-content" id="links">
							<h2>Links to other websites</h2>
							{' '}
							<p>Our site links to other websites, such as Fiverr, Upwork, GitHub, LinkedIn, Google Play and our clients' websites. We are not responsible for their content or privacy practices, so please read their own policies.</p>
						</div>
						{' '}
						<div className="privacy-content" id="changes">
							<h2>Changes to this policy</h2>
							{' '}
							<p>We may update this policy when our services or the law change. The "Last updated" date at the top shows the latest version. If a change is significant, we will make it clear on this page.</p>
						</div>
						{' '}
						<div className="privacy-content" id="contact">
							<h2>Contact us</h2>
							{' '}
							<p>Questions about this policy or your data? Contact us:</p>
							{' '}
							<address className="text">
								<b>TechFiyr</b>
								<br />
								{' '}325, Mirpur DOHS, Dhaka 1216, Bangladesh
								<br />
								{' '}Email:{' '}
								<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
								<br />
								{' '}WhatsApp:{' '}
								<a href="https://wa.me/8801540659530" target="_blank" rel="noopener">
									+880 1540659530
									<span className="sr-only">{' '}(opens in a new tab)</span>
								</a>
							</address>
						</div>
					</div>
				</section>
			</>
			{/* End Privacy Policy */}
		</>
	);
}
