/*
 * Content Policy & Terms of Use (/content-policy).
 * Markup is the original template's (converted from content-policy.html).
 */
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
	title: "Content Policy & Terms of Use | TechFiyr",
	description: "How you may use TechFiyr website content, who owns it, how we present projects and client reviews, acceptable use of the site, and the terms that apply.",
	path: '/content-policy',
});

// Structured data: keep these facts identical to the home page and llms.txt
const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebPage",
				"@id": "https://techfiyr.com/content-policy#webpage",
				"url": "https://techfiyr.com/content-policy",
				"name": "Content Policy & Terms of Use | TechFiyr",
				"description": "How you may use TechFiyr website content, who owns it, how we present projects and client reviews, acceptable use of the site, and the terms that apply.",
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
						"name": "Content Policy",
						"item": "https://techfiyr.com/content-policy"
					}
				]
			}
		]
	};

export default function ContentPolicyPage() {
	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Content" title="Content Policy & Terms of Use" crumbs={[{ label: 'Home', href: '/' }, { label: "Content Policy" }]} />

			{/* Content Policy */}
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
								<li>You're welcome to read, share and link to our content. Quote it with a credit and a link back to techfiyr.com.</li>
								{' '}
								<li>Our text, designs, logo and code belong to TechFiyr. Client names, projects and third-party brands belong to their owners.</li>
								{' '}
								<li>Information on this site is general. Prices, timelines and deliverables are agreed in a written proposal or contract.</li>
							</ul>
						</div>
						{' '}
						<nav aria-label="On this page">
							<ol className="privacy-toc">
								<li>
									<a href="#agreement">About these terms</a>
								</li>
								{' '}
								<li>
									<a href="#ownership">Who owns the content</a>
								</li>
								{' '}
								<li>
									<a href="#using-content">How you may use our content</a>
								</li>
								{' '}
								<li>
									<a href="#projects-reviews">Projects, client names and reviews</a>
								</li>
								{' '}
								<li>
									<a href="#accuracy">Accuracy of information</a>
								</li>
								{' '}
								<li>
									<a href="#acceptable-use">Acceptable use</a>
								</li>
								{' '}
								<li>
									<a href="#third-party">Links and third-party content</a>
								</li>
								{' '}
								<li>
									<a href="#liability">Liability</a>
								</li>
								{' '}
								<li>
									<a href="#law">Governing law</a>
								</li>
								{' '}
								<li>
									<a href="#changes">Changes to these terms</a>
								</li>
								{' '}
								<li>
									<a href="#contact">Contact us</a>
								</li>
							</ol>
						</nav>
						{' '}
						<div className="privacy-content" id="agreement">
							<h2>About these terms</h2>
							{' '}
							<p>These terms apply to your use of techfiyr.com, run by TechFiyr, Dhaka, Bangladesh. By using the site you agree to them. If you hire us, our proposal or contract (or the marketplace's terms, if you hire us on Fiverr or Upwork) governs that work, and it takes priority over these terms if they conflict.</p>
						</div>
						{' '}
						<div className="privacy-content" id="ownership">
							<h2>Who owns the content</h2>
							{' '}
							<p>Unless stated otherwise, the text, graphics, illustrations, hero banners, logos, page designs and code of this website are owned by TechFiyr or licensed to us, and are protected by copyright and trademark law. "TechFiyr" and the TechFiyr logo are our brand. Please don't use them in a way that suggests we endorse you or your product.</p>
							{' '}
							<p>Names and logos of technologies and platforms we mention, such as Flutter, React, React Native, Next.js, Node.js, Firebase, AWS, Figma, Codemagic, Google Play, the App Store, Fiverr and Upwork, belong to their respective owners. We use them only to describe our skills and services.</p>
						</div>
						{' '}
						<div className="privacy-content" id="using-content">
							<h2>How you may use our content</h2>
							{' '}
							<p>You may:</p>
							{' '}
							<ul className="privacy-list">
								<li>read, print and save pages for your own use;</li>
								{' '}
								<li>share links to any page;</li>
								{' '}
								<li>quote short extracts with a credit to "TechFiyr" and a link to the page you quote.</li>
							</ul>
							{' '}
							<p>
								Search engines and AI assistants may crawl, index and summarise this site to answer questions, as long as they attribute and link to TechFiyr where they show our content. Our{' '}
								<a href="/robots.txt">robots.txt</a>
								{' '}and{' '}
								<a href="/llms.txt">llms.txt</a>
								{' '}files explain what crawlers can access.
							</p>
							{' '}
							<p>You may not, without our written permission, copy or republish whole pages or substantial parts of the site, reuse our designs or code, present our work or reviews as your own, or use our content to mislead anyone about who we are.</p>
						</div>
						{' '}
						<div className="privacy-content" id="projects-reviews">
							<h2>Projects, client names and reviews</h2>
							{' '}
							<ul className="privacy-list">
								<li>
									<b>Projects</b>
									{' '}in our portfolio are shown as examples of our work. Client names, app names, screenshots, prices and trademarks shown in them belong to the clients. If you are a client and would like anything changed or removed, email us and we will act promptly.
								</li>
								{' '}
								<li>
									<b>Reviews</b>
									{' '}on this site are real reviews from verified clients on Fiverr, shown with the reviewer's public username and country, and are not edited. We don't pay for reviews and we don't publish invented ones.
								</li>
								{' '}
								<li>
									<b>Numbers</b>
									{' '}such as client counts, ratings and years of experience reflect our records on the date shown on each page and are updated from time to time.
								</li>
							</ul>
						</div>
						{' '}
						<div className="privacy-content" id="accuracy">
							<h2>Accuracy of information</h2>
							{' '}
							<p>We work to keep the site accurate and up to date, but it is general information about our services, not professional advice or a binding offer. Scope, prices, timelines and deliverables are only fixed in a written proposal, contract or marketplace order. If you spot an error, please tell us.</p>
						</div>
						{' '}
						<div className="privacy-content" id="acceptable-use">
							<h2>Acceptable use</h2>
							{' '}
							<p>When using this site, please don't:</p>
							{' '}
							<ul className="privacy-list">
								<li>try to break, overload or gain unauthorised access to the site or its hosting;</li>
								{' '}
								<li>send spam, malware or false bookings through our forms;</li>
								{' '}
								<li>scrape the site in a way that harms its performance, or collect personal data of our team or clients from it;</li>
								{' '}
								<li>use the site for anything unlawful.</li>
							</ul>
							{' '}
							<p>
								Found a security issue? Please report it responsibly to{' '}
								<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
								, as described in our{' '}
								<a href="/.well-known/security.txt">security.txt</a>
								.
							</p>
						</div>
						{' '}
						<div className="privacy-content" id="third-party">
							<h2>Links and third-party content</h2>
							{' '}
							<p>We link to other websites (for example Fiverr, Upwork, GitHub, LinkedIn, Google Play and client websites) and embed Google Maps. We don't control them and aren't responsible for their content, availability or policies.</p>
						</div>
						{' '}
						<div className="privacy-content" id="liability">
							<h2>Liability</h2>
							{' '}
							<p>We provide this website "as is". As far as the law allows, TechFiyr is not liable for any loss arising from your use of, or reliance on, the website or its content. Nothing in these terms limits liability that cannot be limited by law, or your rights as a consumer.</p>
						</div>
						{' '}
						<div className="privacy-content" id="law">
							<h2>Governing law</h2>
							{' '}
							<p>These terms are governed by the laws of Bangladesh, and the courts of Dhaka have jurisdiction, unless the law of your country gives you the right to bring a claim in your local courts.</p>
						</div>
						{' '}
						<div className="privacy-content" id="changes">
							<h2>Changes to these terms</h2>
							{' '}
							<p>We may update these terms from time to time. The "Last updated" date shows the current version, which applies from the moment it is published.</p>
						</div>
						{' '}
						<div className="privacy-content" id="contact">
							<h2>Contact us</h2>
							{' '}
							<p>Questions, permission requests or removal requests:</p>
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
			{/* End Content Policy */}
		</>
	);
}
