/*
 * Contact (/contact): discovery-call booking widget (public/assets/js/booking.js), contact details and map.
 * Markup is the original template's (converted from contact.html).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
	title: "Contact TechFiyr | Get a Free Quote for Your App or Web Project",
	description: "Tell TechFiyr about your mobile app, web software, UI/UX, or CI/CD project. Email info@techfiyr.com, WhatsApp +880 1540659530, or visit us at Mirpur DOHS, Dhaka.",
	path: '/contact',
});

// Structured data: keep these facts identical to the home page and llms.txt
const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "ContactPage",
				"@id": "https://techfiyr.com/contact#webpage",
				"url": "https://techfiyr.com/contact",
				"name": "Contact TechFiyr",
				"description": "Book a free 30-minute discovery call, or reach TechFiyr by email, phone or at the Mirpur DOHS office in Dhaka.",
				"isPartOf": {
					"@id": "https://techfiyr.com/#website"
				},
				"about": {
					"@id": "https://techfiyr.com/#organization"
				},
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
				},
				"contactPoint": {
					"@type": "ContactPoint",
					"contactType": "sales",
					"email": "info@techfiyr.com",
					"telephone": "+8801540659530",
					"availableLanguage": [
						"English",
						"Bengali"
					],
					"url": "https://techfiyr.com/contact"
				},
				"sameAs": [
					"https://github.com/techfiyr",
					"https://www.fiverr.com/wahidsaurav",
					"https://www.upwork.com/freelancers/sauravwahid"
				]
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
						"name": "Contact",
						"item": "https://techfiyr.com/contact"
					}
				]
			}
		]
	};

export default function ContactPage() {
	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Contact" title="Contact" crumbs={[{ label: 'Home', href: '/' }, { label: "Contact" }]} />

			{/* Contact Two */}
			<section className="contact-two" id="contact">
				<div className="contact-two_shadow" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-1.png)' }}></div>
				{' '}
				<div className="auto-container">
					<div className="inner-container">
						{/* Sec Title */}
						<div className="sec-title centered">
							<div className="sec-title_title">
								<div className="sec-title_dots">
									<span></span>
									{' '}
									<span></span>
									{' '}
									<span></span>
								</div>
								{' '}Book a Free Call{' '}
								<div className="sec-title_dots">
									<span></span>
									{' '}
									<span></span>
									{' '}
									<span></span>
								</div>
							</div>
							{' '}
							<h2 className="sec-title_heading">
								Pick a time that{' '}
								<br />
								{' '}works for you
							</h2>
						</div>
						{/* Booking widget: availability and logic live in assets/js/booking.js */}
						{' '}
						<div className="booking" id="booking">
							<aside className="booking-info">
								<img width="166" height="54" className="booking-info_logo" src="/assets/images/brand/logo.svg" alt="TechFiyr" />
								{' '}
								<span className="booking-info_host">Saurav Wahid · TechFiyr</span>
								{' '}
								<ul className="booking-info_meta">
									<li>
										<i className="fa-regular fa-clock fa-fw" aria-hidden="true"></i>
										{' '}30 min
									</li>
									{' '}
									<li>
										<i className="fa-solid fa-video fa-fw" aria-hidden="true"></i>
										{' '}Google Meet link sent after confirmation
									</li>
									{' '}
									<li>
										<i className="fa-solid fa-earth-asia fa-fw" aria-hidden="true"></i>
										{' '}
										<span data-booking-tz="">Your time zone</span>
									</li>
								</ul>
								{' '}
								<p className="booking-info_text">Tell us about your app or web idea. We'll talk scope, tech stack, and timeline, and you'll leave with clear next steps. No commitment.</p>
								{' '}
								<div className="booking-info_picked" data-booking-picked="" hidden>
									<i className="fa-regular fa-calendar-check fa-fw" aria-hidden="true"></i>
									{' '}
									<span></span>
								</div>
							</aside>
							{' '}
							<div className="booking-main">
								{/* Step 1: date and time */}
								<div className="booking-step booking-step_pick" data-step="pick">
									<div className="booking-cal">
										<h4 className="booking-heading">Select a Date &amp; Time</h4>
										{' '}
										<div className="booking-cal_nav">
											<button type="button" className="booking-cal_arrow" data-cal-prev="" aria-label="Previous month">
												<i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
											</button>
											{' '}
											<span className="booking-cal_month" data-cal-month="" aria-live="polite"></span>
											{' '}
											<button type="button" className="booking-cal_arrow" data-cal-next="" aria-label="Next month">
												<i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
											</button>
										</div>
										{' '}
										<div className="booking-cal_week">
											<span>Mon</span>
											<span>Tue</span>
											<span>Wed</span>
											<span>Thu</span>
											<span>Fri</span>
											<span>Sat</span>
											<span>Sun</span>
										</div>
										{' '}
										<div className="booking-cal_days" data-cal-days=""></div>
										{' '}
										<p className="booking-cal_note">
											Available daily, 7:30 – 11:30 PM Dhaka time (
											<span data-booking-local-range=""></span>
											).
										</p>
									</div>
									{' '}
									<div className="booking-times">
										<h4 className="booking-times_date" data-times-date="">Choose a day</h4>
										{' '}
										<div className="booking-times_list" data-times-list="">
											<p className="booking-times_empty">Pick a highlighted date to see open times.</p>
										</div>
									</div>
								</div>
								{/* Step 2: details (Netlify Forms collects submissions) */}
								{' '}
								<div className="booking-step booking-step_details contact-form" data-step="details" hidden>
									<button type="button" className="booking-back" data-booking-back="">
										<i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
										{' '}Back
									</button>
									{' '}
									<h4 className="booking-heading">Enter Details</h4>
									{' '}
									<form name="booking" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-booking-form="">
										<input type="hidden" name="form-name" value="booking" />
										{' '}
										<input type="hidden" name="slot_dhaka_time" />
										{' '}
										<input type="hidden" name="slot_visitor_time" />
										{' '}
										<input type="hidden" name="visitor_timezone" />
										{' '}
										<input type="hidden" name="slot_utc" />
										{' '}
										<p hidden>
											<label>
												Leave this empty:{' '}
												<input name="bot-field" />
											</label>
										</p>
										{' '}
										<div className="row clearfix">
											<div className="form-group col-lg-6 col-md-6 col-sm-12">
												<input type="text" name="name" placeholder="Your Name" autoComplete="name" required />
											</div>
											{' '}
											<div className="form-group col-lg-6 col-md-6 col-sm-12">
												<input type="email" name="email" placeholder="Email Address" autoComplete="email" required />
											</div>
											{' '}
											<div className="form-group col-lg-12 col-md-12 col-sm-12">
												<select name="service" required defaultValue="">
													<option value="" disabled>What do you need?</option>
													<option>Mobile App Design &amp; Development</option>
													<option>Custom Web Software &amp; SaaS</option>
													<option>UI/UX &amp; Product Prototyping</option>
													<option>Backend, Cloud &amp; CI/CD Pipelines</option>
													<option>Something else</option>
												</select>
											</div>
											{' '}
											<div className="form-group col-lg-12 col-md-12 col-sm-12">
												<textarea name="message" placeholder="Anything we should know before the call? (optional)" />
											</div>
											{' '}
											<div className="form-group col-lg-12 col-md-12 col-sm-12">
												<button type="submit" className="theme-btn btn-style-one" data-booking-submit="">
													<span className="btn-wrap">
														<span className="text-one">Schedule Call</span>
														{' '}
														<span className="text-two">Schedule Call</span>
													</span>
												</button>
											</div>
											{' '}
											<div className="form-group col-lg-12 col-md-12 col-sm-12">
												<p className="booking-privacy">
													We use your details only to arrange and hold this call. See our{' '}
													<Link href="/privacy-policy">Privacy Policy</Link>
													.
												</p>
											</div>
										</div>
									</form>
								</div>
								{/* Step 3: done */}
								{' '}
								<div className="booking-step booking-step_done" data-step="done" hidden>
									<div className="booking-done_icon">
										<i className="fa-solid fa-check" aria-hidden="true"></i>
									</div>
									{' '}
									<h4 className="booking-heading">Request sent!</h4>
									{' '}
									<p className="booking-done_text" data-done-text=""></p>
									{' '}
									<div className="booking-done_slot" data-done-slot=""></div>
									{' '}
									<a className="booking-done_gcal" data-done-gcal="" href="#" target="_blank" rel="noopener">
										<i className="fa-brands fa-google" aria-hidden="true"></i>
										{' '}Add to Google Calendar
									<span className="sr-only">{' '}(opens in a new tab)</span>
								</a>
									{' '}
									<button type="button" className="booking-back" data-booking-restart="">Book another time</button>
								</div>
							</div>
						</div>
						{' '}
						<div className="contact-info_box">
							<div className="row clearfix">
								{/* Column */}
								<div className="column col-lg-4 col-md-12 col-sm-12">
									<h3>
										Contact{' '}
										<br />
										{' '}Information
									</h3>
									{' '}
									<div className="contact-info_text">
										We reply within 24 hours. Prefer a marketplace? Hire us on{' '}
										<a href="https://www.fiverr.com/wahidsaurav" target="_blank" rel="noopener">Fiverr<span className="sr-only">{' '}(opens in a new tab)</span></a>
										{' '}or{' '}
										<a href="https://www.upwork.com/freelancers/sauravwahid" target="_blank" rel="noopener">Upwork<span className="sr-only">{' '}(opens in a new tab)</span></a>
										.
									</div>
								</div>
								{/* Column */}
								{' '}
								<div className="column col-lg-8 col-md-12 col-sm-12">
									<div className="row clearfix">
										{/* Info Block */}
										<div className="contact-info_block col-lg-6 col-md-6 col-sm-12">
											<div className="contact-info_block-inner">
												<div className="contact-info_block-icon">
													<i className="fa-classic fa-solid fa-location-dot fa-fw" aria-hidden="true"></i>
												</div>
												{' '}
												<h4>Visit Us</h4>
												{' '}
												<p>
													325, Mirpur DOHS, Dhaka,{' '}
													<br />
													{' '}Bangladesh
												</p>
											</div>
										</div>
										{/* Info Block */}
										{' '}
										<div className="contact-info_block col-lg-6 col-md-6 col-sm-12">
											<div className="contact-info_block-inner">
												<div className="contact-info_block-icon">
													<i className="fa-brands fa-whatsapp fa-fw" aria-hidden="true"></i>
												</div>
												{' '}
												<h4>WhatsApp or Email</h4>
												{' '}
												<p>
													<a href="https://wa.me/8801540659530" target="_blank" rel="noopener">
														+880 1540659530
														<span className="sr-only">{' '}(WhatsApp, opens in a new tab)</span>
													</a>
													{' '}
													<br />
													{' '}
													<a href="mailto:info@techfiyr.com">info@techfiyr.com</a>
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Contact Two */}
			{/* CTA One */}
			{' '}
			<section className="cta-one style-two">
				<div className="auto-container">
					<div className="inner-container d-flex justify-content-between align-items-center flex-wrap">
						<div className="cta-one_content">
							<div className="cta-one_title">Prefer a marketplace?</div>
							{' '}
							<h3 className="cta-one_heading">Hire us on Fiverr or Upwork with full buyer protection</h3>
						</div>
						{' '}
						<div className="cta-one_btn d-flex flex-wrap gap-3">
							<a href="https://www.fiverr.com/wahidsaurav" target="_blank" rel="noopener" className="theme-btn btn-style-one">
								<span className="btn-wrap">
									<span className="text-one">Fiverr</span>
									{' '}
									<span className="text-two">Fiverr</span>
								</span>
							<span className="sr-only">{' '}(opens in a new tab)</span>
						</a>
							{' '}
							<a href="https://www.upwork.com/freelancers/sauravwahid" target="_blank" rel="noopener" className="theme-btn btn-style-one">
								<span className="btn-wrap">
									<span className="text-one">Upwork</span>
									{' '}
									<span className="text-two">Upwork</span>
								</span>
							<span className="sr-only">{' '}(opens in a new tab)</span>
						</a>
						</div>
					</div>
				</div>
			</section>
			{/* End CTA One */}
			{/* Map One */}
			{' '}
			<section className="map-one">
				<div className="auto-container">
					{/* Google Maps sets cookies, so it loads only after consent (assets/js/consent.js) */}
					<div className="consent-embed" data-consent-placeholder="embedded">
						<div className="consent-embed_icon">
							<i className="fa-solid fa-location-dot" aria-hidden="true"></i>
						</div>
						{' '}
						<h2>Find us in Mirpur DOHS, Dhaka</h2>
						{' '}
						<p>
							325, Mirpur DOHS, Dhaka 1216, Bangladesh. The map is provided by Google Maps, which sets cookies. Load it only if you're happy with that. See our{' '}
							<Link href="/cookie-policy">Cookie Policy</Link>
							.
						</p>
						{' '}
						<div className="consent-embed_actions">
							<button type="button" className="consent-btn consent-btn_accept" data-consent-allow="embedded">Load map</button>
							{' '}
							<a className="consent-link" href="https://www.google.com/maps/search/?api=1&amp;query=341%2F342%2C+Mirpur+DOHS%2C+Dhaka+1216%2C+Bangladesh" target="_blank" rel="noopener">Open in Google Maps<span className="sr-only">{' '}(opens in a new tab)</span></a>
						</div>
					</div>
					{' '}
					<iframe title="TechFiyr office location: Mirpur DOHS, Dhaka" data-consent="embedded" data-src="https://www.google.com/maps?q=341%2F342%2C+Mirpur+DOHS%2C+Dhaka+1216%2C+Bangladesh&amp;z=16&amp;output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen hidden></iframe>
				</div>
			</section>
			{/* End Map One */}
		</>
	);
}
