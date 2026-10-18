/*
 * Home page: services, about, track record, reviews, process and team.
 * Markup is the original template's (converted from index.html); sliders, counters and reveals
 * start from public/assets/js/script.js. Keep the JSON-LD facts identical to the copy and llms.txt.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { preload } from 'react-dom';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
	...pageMetadata({
		title: 'TechFiyr - Mobile App & Web Software Development Agency',
		description: 'TechFiyr is a premier software development agency specializing in Mobile App Design & Development (Flutter, React Native, iOS, Android), Custom Web Software, SaaS platforms, and UI/UX Design, plus CI/CD and App Store deployment automation. Rated 5.0 on Fiverr by clients across the US, Europe, and Asia.',
		path: '/',
		ogDescription: 'Flutter, React Native, iOS and Android apps, custom web software, SaaS, UI/UX and CI/CD automation. Rated 5.0 on Fiverr by clients across the US, Europe and Asia.',
		twitterDescription: 'Flutter, React Native, iOS and Android apps, custom web software, SaaS, UI/UX and CI/CD automation. Rated 5.0 on Fiverr.',
		keywords: ['TechFiyr', 'mobile app development', 'app design', 'flutter app developer', 'react native development', 'web software development', 'saas platform', 'ui ux design', 'codemagic ci/cd', 'mobile devops', 'custom web applications', 'dhaka software agency'],
	}),
	authors: [{ name: 'TechFiyr' }],
};

// Structured data: keep these facts identical to the page copy, the contact page and llms.txt
const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "ProfessionalService",
				"@id": "https://techfiyr.com/#organization",
				"name": "TechFiyr",
				"url": "https://techfiyr.com/",
				"logo": "https://techfiyr.com/assets/images/brand/logo.svg",
				"image": "https://techfiyr.com/assets/images/og/techfiyr-og.jpg",
				"description": "TechFiyr is a mobile app and web software development agency in Dhaka, Bangladesh. The team designs and builds Flutter, React Native, iOS and Android apps, custom web software and SaaS platforms, UI/UX and product prototypes, and backend, cloud and CI/CD pipelines for startups and growing businesses in the US, Europe and Asia.",
				"slogan": "Empowering Startups & Growing Businesses With High-Performance Mobile & Web Engineering",
				"email": "info@techfiyr.com",
				"telephone": "+8801540659530",
				"priceRange": "$$",
				"address": {
					"@type": "PostalAddress",
					"streetAddress": "325, Mirpur DOHS",
					"addressLocality": "Dhaka",
					"postalCode": "1216",
					"addressCountry": "BD"
				},
				"areaServed": [
					"United States",
					"Europe",
					"Asia"
				],
				"numberOfEmployees": {
					"@type": "QuantitativeValue",
					"value": 5
				},
				"founder": {
					"@id": "https://techfiyr.com/#saurav-wahid"
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
				"knowsAbout": [
					"Mobile app development",
					"Flutter",
					"React Native",
					"iOS development",
					"Android development",
					"Next.js",
					"React",
					"Node.js",
					"SaaS development",
					"UI/UX design",
					"Figma",
					"Design systems",
					"REST APIs",
					"GraphQL",
					"Firebase",
					"AWS",
					"CI/CD",
					"Codemagic",
					"App Store deployment",
					"Google Play deployment"
				],
				"hasOfferCatalog": {
					"@type": "OfferCatalog",
					"name": "TechFiyr services",
					"itemListElement": [
						{
							"@type": "Offer",
							"itemOffered": {
								"@type": "Service",
								"name": "Mobile App Design & Development",
								"description": "Flutter, React Native, iOS and Android apps, including App Store and Google Play deployment."
							}
						},
						{
							"@type": "Offer",
							"itemOffered": {
								"@type": "Service",
								"name": "Custom Web Software & SaaS",
								"description": "Next.js, React and Node.js web applications, admin dashboards and cloud SaaS platforms."
							}
						},
						{
							"@type": "Offer",
							"itemOffered": {
								"@type": "Service",
								"name": "UI/UX & Product Prototyping",
								"description": "Figma design, mobile UI/UX, design systems and wireframes."
							}
						},
						{
							"@type": "Offer",
							"itemOffered": {
								"@type": "Service",
								"name": "Backend, Cloud & CI/CD Pipelines",
								"description": "REST and GraphQL APIs, Firebase, AWS cloud and Codemagic CI/CD pipelines."
							}
						}
					]
				},
				"sameAs": [
					"https://github.com/techfiyr",
					"https://www.fiverr.com/wahidsaurav",
					"https://www.upwork.com/freelancers/sauravwahid"
				]
			},
			{
				"@type": "Person",
				"@id": "https://techfiyr.com/#saurav-wahid",
				"name": "Saurav Wahid",
				"jobTitle": "Founder & Mobile DevOps Lead",
				"description": "Oracle Certified Professional with 11+ years of software engineering experience.",
				"image": "https://techfiyr.com/assets/images/team/saurav-wahid-portrait.jpg",
				"worksFor": {
					"@id": "https://techfiyr.com/#organization"
				},
				"sameAs": [
					"https://www.linkedin.com/in/sauravwahid/",
					"https://github.com/swahid",
					"https://www.fiverr.com/wahidsaurav",
					"https://www.upwork.com/freelancers/sauravwahid"
				]
			},
			{
				"@type": "WebSite",
				"@id": "https://techfiyr.com/#website",
				"url": "https://techfiyr.com/",
				"name": "TechFiyr",
				"inLanguage": "en",
				"publisher": {
					"@id": "https://techfiyr.com/#organization"
				}
			},
			{
				"@type": "WebPage",
				"@id": "https://techfiyr.com/#webpage",
				"url": "https://techfiyr.com/",
				"name": "TechFiyr - Mobile App & Web Software Development Agency",
				"isPartOf": {
					"@id": "https://techfiyr.com/#website"
				},
				"about": {
					"@id": "https://techfiyr.com/#organization"
				},
				"primaryImageOfPage": "https://techfiyr.com/assets/images/og/techfiyr-og.jpg",
				"inLanguage": "en"
			}
		]
	};

export default function HomePage() {
	// First hero slide is the LCP image
	preload('/assets/images/hero/hero-mobile-apps.jpg', { as: 'image', fetchPriority: 'high' });

	return (
		<>
			<JsonLd data={structuredData} />

			{/* End Of Main Header */}
			{/* Main Slider Section */}
			<section className="slider-one" id="home">
				<div className="main-slider swiper-container">
					<div className="swiper-wrapper">
						{/* Slide 1 */}
						<div className="swiper-slide">
							<div className="slider-one_image-layer" style={{ backgroundImage: 'url(/assets/images/hero/hero-mobile-apps.jpg)' }}></div>
							{' '}
							<div className="slider-one_pattern" style={{ backgroundImage: 'url(/assets/images/hero/hero-pattern.png)' }}></div>
							{' '}
							<div className="auto-container">
								<div className="slider-one_content">
									<div className="slider-one_content-inner">
										<div className="slider-one_title">✦ 5.0 RATED ON FIVERR</div>
										{' '}
										<h1 className="slider-one_heading">
											We build{' '}
											<span>high-performance mobile apps</span>
											{' '}and custom web software
										</h1>
										{' '}
										<div className="slider-one_features">
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Flutter &amp; React Native
											</span>
											{' '}
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Full-Stack Web &amp; SaaS
											</span>
											{' '}
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}CI/CD &amp; App Store Deploy
											</span>
										</div>
										{' '}
										<div className="slider-one_button d-flex align-items-center flex-wrap">
											<Link href="/contact" className="theme-btn btn-style-two">
												<span className="btn-wrap">
													<span className="text-one">Get a Free Quote</span>
													{' '}
													<span className="text-two">Get a Free Quote</span>
												</span>
											</Link>
											{' '}
											<a href="https://www.fiverr.com/users/wahidsaurav/portfolio" target="_blank" rel="noopener" className="theme-btn btn-style-three ms-3">
												<span className="btn-wrap">
													<span className="text-one">View Portfolio</span>
													{' '}
													<span className="text-two">View Portfolio</span>
												</span>
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* Slide 2 */}
						{' '}
						<div className="swiper-slide">
							<div className="slider-one_image-layer" style={{ backgroundImage: 'url(/assets/images/hero/hero-saas-platforms.jpg)' }}></div>
							{' '}
							<div className="slider-one_pattern" style={{ backgroundImage: 'url(/assets/images/hero/hero-pattern.png)' }}></div>
							{' '}
							<div className="auto-container">
								<div className="slider-one_content">
									<div className="slider-one_content-inner">
										<div className="slider-one_title">✦ CLEAN CODE &amp; INTUITIVE UI/UX</div>
										{' '}
										<div className="slider-one_heading">
											Engineering{' '}
											<span>scalable SaaS platforms</span>
											{' '}&amp; modern digital apps
										</div>
										{' '}
										<div className="slider-one_features">
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Next.js &amp; React
											</span>
											{' '}
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Node.js &amp; Cloud APIs
											</span>
											{' '}
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Pixel-Perfect UI
											</span>
										</div>
										{' '}
										<div className="slider-one_button d-flex align-items-center flex-wrap">
											<a href="#services" className="theme-btn btn-style-two">
												<span className="btn-wrap">
													<span className="text-one">View Our Services</span>
													{' '}
													<span className="text-two">View Our Services</span>
												</span>
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* Slide 3 */}
						{' '}
						<div className="swiper-slide">
							<div className="slider-one_image-layer" style={{ backgroundImage: 'url(/assets/images/hero/hero-cicd-delivery.jpg)' }}></div>
							{' '}
							<div className="slider-one_pattern" style={{ backgroundImage: 'url(/assets/images/hero/hero-pattern.png)' }}></div>
							{' '}
							<div className="auto-container">
								<div className="slider-one_content">
									<div className="slider-one_content-inner">
										<div className="slider-one_title">✦ FREELANCE SPEED • AGENCY QUALITY</div>
										{' '}
										<div className="slider-one_heading">
											From{' '}
											<span>5.0-rated Fiverr delivery</span>
											{' '}to full product launches
										</div>
										{' '}
										<div className="slider-one_features">
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Rapid Turnaround
											</span>
											{' '}
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Agile Sprints
											</span>
											{' '}
											<span className="slider-one_feature-item">
												<i className="fa-solid fa-circle-check"></i>
												{' '}Dedicated Tech Support
											</span>
										</div>
										{' '}
										<div className="slider-one_button d-flex align-items-center flex-wrap">
											<Link href="/contact" className="theme-btn btn-style-two">
												<span className="btn-wrap">
													<span className="text-one">Get a Free Quote</span>
													{' '}
													<span className="text-two">Get a Free Quote</span>
												</span>
											</Link>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					{/* Pagination */}
					{' '}
					<div className="slider-one_pagination"></div>
				</div>
				{/* Slider One Options */}
				{' '}
				<div className="slider-one_options">
					<div className="button">
						<a className="service-btn" href="#testimonial">
							Client Reviews{' '}
							<i className="fa-arrow-right"></i>
						</a>
					</div>
					{' '}
					<div className="slider-one_authors">
						<ul>
							<li className="slider-one_author-initial" title="theinnerpoint">T</li>
							{' '}
							<li className="slider-one_author-initial" title="sairamchaganti">S</li>
							{' '}
							<li className="slider-one_author-initial" title="bluebahia2018">B</li>
							{' '}
							<li className="slider-one_author-initial" title="jamiegale">J</li>
						</ul>
						{' '}
						<div className="slider-one_reviews">
							{' '}5.0 ★{' '}
							<br />
							{' '}
							<span>20 Happy Clients</span>
						</div>
					</div>
				</div>
				{/* End Slider One Options */}
			</section>
			{/* End Of Main Slider Section */}
			{/* Services / Offer Section */}
			{' '}
			<section className="offer-one" id="services">
				<div className="offer-one_color"></div>
				{' '}
				<div className="auto-container">
					<div className="row clearfix">
						{/* Image Column */}
						<div className="offer-one_image-column col-lg-6 col-md-12 col-sm-12">
							<div className="offer-one_image-outer">
								<div className="offer-one_images_outer">
									{/* Image 1 */}
									<div className="offer-one_image active">
										<img loading="lazy" decoding="async" src="/assets/images/services/mobile-app-development.jpg" alt="Mobile App Development" />
									</div>
									{/* Image 2 */}
									{' '}
									<div className="offer-one_image two">
										<img loading="lazy" decoding="async" src="/assets/images/services/web-software-saas.jpg" alt="Web Software &amp; SaaS" />
									</div>
									{/* Image 3 */}
									{' '}
									<div className="offer-one_image three">
										<img loading="lazy" decoding="async" src="/assets/images/services/ui-ux-design.jpg" alt="UI/UX Product Design" />
									</div>
									{/* Image 4 */}
									{' '}
									<div className="offer-one_image four">
										<img loading="lazy" decoding="async" src="/assets/images/services/backend-cloud-cicd.jpg" alt="Backend, Cloud &amp; CI/CD Pipelines" />
									</div>
								</div>
								{/* Award Box */}
								{' '}
								<div className="step-award_box">
									<div className="step-award_count">5.0</div>
									{' '}
									<span className="step-award_subtitle">Fiverr Rating</span>
								</div>
							</div>
						</div>
						{/* Content Column */}
						{' '}
						<div className="offer-one_content-column col-lg-6 col-md-12 col-sm-12">
							<div className="offer-one_content-outer">
								{/* Sec Title */}
								<div className="sec-title title-anim">
									<div className="sec-title_title">
										{' '}What We Offer{' '}
										<div className="sec-title_dots">
											<span></span>
											{' '}
											<span></span>
											{' '}
											<span></span>
										</div>
									</div>
									{' '}
									<h2 className="sec-title_heading">High-Performance Mobile &amp; Web Solutions</h2>
								</div>
								{' '}
								<div className="offer-one_titles">
									{/* Service 1 */}
									<div className="offer-one_title active">
										<div className="offer-one_icon-outer">
											<span className="offer-one_number">1</span>
											{' '}
											<div className="offer-one_icon">
												<i className="fa-solid fa-mobile-screen-button"></i>
											</div>
										</div>
										{' '}
										<h3 className="offer-one_heading">
											<Link href="/contact">Mobile App Design &amp; Development</Link>
										</h3>
										{' '}
										<ul className="offer-one_tags">
											<li>
												<span>Flutter</span>
											</li>
											{' '}
											<li>
												<span>React Native</span>
											</li>
											{' '}
											<li>
												<span>iOS &amp; Android</span>
											</li>
											{' '}
											<li>
												<span>App Store Deploy</span>
											</li>
										</ul>
										{' '}
										<Link className="offer-one_arrow" href="/contact">
											<img loading="lazy" decoding="async" src="/assets/images/icons/offer-arrow.svg" alt="Arrow" />
										</Link>
									</div>
									{/* Service 2 */}
									{' '}
									<div className="offer-one_title">
										<div className="offer-one_icon-outer">
											<span className="offer-one_number">2</span>
											{' '}
											<div className="offer-one_icon">
												<i className="fa-solid fa-laptop-code"></i>
											</div>
										</div>
										{' '}
										<h3 className="offer-one_heading">
											<Link href="/contact">Custom Web Software &amp; SaaS</Link>
										</h3>
										{' '}
										<ul className="offer-one_tags">
											<li>
												<span>Next.js &amp; React</span>
											</li>
											{' '}
											<li>
												<span>Node.js</span>
											</li>
											{' '}
											<li>
												<span>Admin Dashboards</span>
											</li>
											{' '}
											<li>
												<span>Cloud SaaS</span>
											</li>
										</ul>
										{' '}
										<Link className="offer-one_arrow" href="/contact">
											<img loading="lazy" decoding="async" src="/assets/images/icons/offer-arrow.svg" alt="Arrow" />
										</Link>
									</div>
									{/* Service 3 */}
									{' '}
									<div className="offer-one_title">
										<div className="offer-one_icon-outer">
											<span className="offer-one_number">3</span>
											{' '}
											<div className="offer-one_icon">
												<i className="fa-solid fa-pen-nib"></i>
											</div>
										</div>
										{' '}
										<h3 className="offer-one_heading">
											<Link href="/contact">UI/UX &amp; Product Prototyping</Link>
										</h3>
										{' '}
										<ul className="offer-one_tags">
											<li>
												<span>Figma Design</span>
											</li>
											{' '}
											<li>
												<span>Mobile UI/UX</span>
											</li>
											{' '}
											<li>
												<span>Design Systems</span>
											</li>
											{' '}
											<li>
												<span>Wireframes</span>
											</li>
										</ul>
										{' '}
										<Link className="offer-one_arrow" href="/contact">
											<img loading="lazy" decoding="async" src="/assets/images/icons/offer-arrow.svg" alt="Arrow" />
										</Link>
									</div>
									{/* Service 4 */}
									{' '}
									<div className="offer-one_title">
										<div className="offer-one_icon-outer">
											<span className="offer-one_number">4</span>
											{' '}
											<div className="offer-one_icon">
												<i className="fa-solid fa-cloud"></i>
											</div>
										</div>
										{' '}
										<h3 className="offer-one_heading">
											<Link href="/contact">Backend, Cloud &amp; CI/CD Pipelines</Link>
										</h3>
										{' '}
										<ul className="offer-one_tags">
											<li>
												<span>REST &amp; GraphQL</span>
											</li>
											{' '}
											<li>
												<span>Codemagic CI/CD</span>
											</li>
											{' '}
											<li>
												<span>Firebase</span>
											</li>
											{' '}
											<li>
												<span>AWS Cloud</span>
											</li>
										</ul>
										{' '}
										<Link className="offer-one_arrow" href="/contact">
											<img loading="lazy" decoding="async" src="/assets/images/icons/offer-arrow.svg" alt="Arrow" />
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Of Services One */}
			{/* About Section */}
			{' '}
			<section className="about-one" id="about">
				<div className="about-one_vector" data-parallax="{&quot;y&quot; : 120}" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-3.png)' }}></div>
				{' '}
				<div className="about-one_pattern-layer" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-1.png)' }}></div>
				{' '}
				<div className="about-one_pattern-two" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-2.png)' }}></div>
				{' '}
				<div className="auto-container">
					<div className="inner-container">
						<div className="row clearfix">
							{/* Column */}
							<div className="column col-lg-6 col-md-12 col-sm-12">
								{/* Sec Title */}
								<div className="sec-title title-anim">
									<div className="sec-title_title">
										{' '}About TechFiyr{' '}
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
										Building{' '}
										<span>Fast, Scalable</span>
										{' '}Mobile Apps &amp; Web Platforms
									</h2>
								</div>
								{' '}
								<div className="about-one_years">
									<div className="about-one_years-badge">
										<span className="about-one_years-number">
											2
											<i>+</i>
										</span>
										{' '}
										<span className="about-one_years-label">
											Years of
											<br />
											Experience
										</span>
									</div>
								</div>
								{' '}
								<div className="about-one_text">
									<span>TechFiyr</span>
									{' '}is a fast-growing team of mobile and web engineers obsessed with clean code and great user experience. In 2+ years, we've helped 20 clients across the US, Europe, and Asia launch iOS, Android, and web products — and automate how they ship — with a 5.0 rating on{' '}
									<strong>Fiverr</strong>
									. We're led by founder Saurav Wahid, an{' '}
									<a href="https://www.credly.com/badges/8a5a2d48-5ff5-4f9a-b4d5-cbe49eb03732/public_url" target="_blank" rel="noopener">Oracle Certified Professional</a>
									{' '}with 11+ years of software engineering experience, and co-founder Viswajit Roy, a UI/UX designer with 10+ years of product design experience.
								</div>
							</div>
							{/* Column */}
							{' '}
							<div className="column col-lg-6 col-md-12 col-sm-12">
								<div className="about-one_image-outer">
									<div className="about-one_image">
										<img loading="lazy" decoding="async" src="/assets/images/about/about-team.jpg" alt="TechFiyr Team" />
									</div>
								</div>
								{' '}
								<div className="d-flex align-items-center flex-wrap">
									<div className="about-one_image-two">
										<img loading="lazy" decoding="async" src="/assets/images/about/about-workspace.png" alt="TechFiyr developer workspace" />
									</div>
									{' '}
									<div className="about-one_carousel">
										<div className="single-item_carousel swiper-container">
											<div className="swiper-wrapper">
												{/* Slide 1: theinnerpoint (USA) */}
												<div className="swiper-slide">
													<div className="review-block_one">
														<div className="review-block_one-quote">
															<img loading="lazy" decoding="async" src="/assets/images/icons/quote.svg" alt="Quote" />
														</div>
														{' '}
														<div className="review-block_one-text">{' '}“He came to my rescue right in time after fighting with Codemagic for months … He is the best Codemagic expert I've ever worked with!”{' '}</div>
														{' '}
														<div className="review-block_one-info">
															<i>5.0*</i>
															{' '}
															<strong>
																theinnerpoint{' '}
																<span>🇺🇸 United States (Fiverr Client)</span>
															</strong>
														</div>
													</div>
												</div>
												{/* Slide 2: sairamchaganti (India) */}
												{' '}
												<div className="swiper-slide">
													<div className="review-block_one">
														<div className="review-block_one-quote">
															<img loading="lazy" decoding="async" src="/assets/images/icons/quote.svg" alt="Quote" />
														</div>
														{' '}
														<div className="review-block_one-text">{' '}“What stood out the most was their ability to deliver the work ahead of schedule, which was a tremendous help for our team.”{' '}</div>
														{' '}
														<div className="review-block_one-info">
															<i>5.0*</i>
															{' '}
															<strong>
																sairamchaganti{' '}
																<span>🇮🇳 India (Fiverr Client)</span>
															</strong>
														</div>
													</div>
												</div>
												{/* Slide 3: bluebahia2018 (USA) */}
												{' '}
												<div className="swiper-slide">
													<div className="review-block_one">
														<div className="review-block_one-quote">
															<img loading="lazy" decoding="async" src="/assets/images/icons/quote.svg" alt="Quote" />
														</div>
														{' '}
														<div className="review-block_one-text">{' '}“He was exceptionally professional -- especially with communication and responsiveness -- and really went above and beyond with my project.”{' '}</div>
														{' '}
														<div className="review-block_one-info">
															<i>5.0*</i>
															{' '}
															<strong>
																bluebahia2018{' '}
																<span>🇺🇸 United States (Fiverr Client)</span>
															</strong>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Of About One */}
			{/* Marketing Marquee Section */}
			{' '}
			<section className="marketing-one">
				<div className="outer-container">
					<div className="animation_mode">
						<div className="marketing-one_word">MOBILE APPS.{' '}</div>
						{' '}
						<div className="marketing-one_word">WEB SOFTWARE.{' '}</div>
						{' '}
						<div className="marketing-one_word">UI/UX DESIGN.{' '}</div>
						{' '}
						<div className="marketing-one_word">SAAS PLATFORMS.{' '}</div>
						{' '}
						<div className="marketing-one_word">5.0 ON FIVERR.{' '}</div>
						{' '}
						<div className="marketing-one_word">FLUTTER &amp; REACT.{' '}</div>
						{' '}
						<div className="marketing-one_word">CI/CD PIPELINES.{' '}</div>
					</div>
				</div>
			</section>
			{/* End Of Marketing One */}
			{/* Achievements Section */}
			{' '}
			<section className="achieve-one">
				<div className="achieve-one_bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/stats-bg.png)' }}></div>
				{' '}
				<div className="auto-container">
					<div className="sec-title title-anim light centered">
						<div className="sec-title_title">
							{' '}By The Numbers{' '}
							<div className="sec-title_dots">
								<span></span>
								{' '}
								<span></span>
								{' '}
								<span></span>
							</div>
						</div>
						{' '}
						<h2 className="sec-title_heading">Our Track Record &amp; Delivery Milestones</h2>
					</div>
					{' '}
					<div className="achieve-one_counter">
						{/* Counter One */}
						<div className="counter-one_column">
							<div className="counter-one_inner wow fadeInUp" data-wow-delay="0ms" data-wow-duration="1500ms">
								<div className="counter-one_icon">
									<i className="fa-solid fa-users"></i>
								</div>
								{' '}
								<div className="counter-one_count">
									<span className="odometer" data-count="20"></span>
								</div>
								{' '}
								<div className="counter-one_text">Happy Clients Across the US, Europe &amp; Asia</div>
							</div>
						</div>
						{/* Counter One */}
						{' '}
						<div className="counter-one_column">
							<div className="counter-one_inner wow fadeInUp" data-wow-delay="150ms" data-wow-duration="1500ms">
								<div className="counter-one_icon">
									<i className="fa-solid fa-star"></i>
								</div>
								{' '}
								<div className="counter-one_count">5.0</div>
								{' '}
								<div className="counter-one_text">Average Client Rating on Fiverr</div>
							</div>
						</div>
						{/* Counter One */}
						{' '}
						<div className="counter-one_column">
							<div className="counter-one_inner wow fadeInUp" data-wow-delay="300ms" data-wow-duration="1500ms">
								<div className="counter-one_icon">
									<i className="fa-solid fa-calendar-check"></i>
								</div>
								{' '}
								<div className="counter-one_count">
									<span className="odometer" data-count="2"></span>
									+
								</div>
								{' '}
								<div className="counter-one_text">Years Shipping Mobile &amp; Web Products</div>
							</div>
						</div>
						{/* Counter One */}
						{' '}
						<div className="counter-one_column">
							<div className="counter-one_inner wow fadeInUp" data-wow-delay="450ms" data-wow-duration="1500ms">
								<div className="counter-one_icon">
									<i className="fa-solid fa-code"></i>
								</div>
								{' '}
								<div className="counter-one_count">
									<span className="odometer" data-count="5"></span>
								</div>
								{' '}
								<div className="counter-one_text">Core Designers &amp; Developers</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Of Achieve One */}
			{/* Testimonials Section */}
			{' '}
			<section className="testimonial-one" id="testimonial">
				<div className="auto-container">
					<div className="row clearfix">
						{/* Column */}
						<div className="testimonial-one_content-column col-lg-5 col-md-12 col-sm-12">
							{/* Sec Title */}
							<div className="sec-title title-anim">
								<div className="sec-title_title">
									{' '}Client Reviews{' '}
									<div className="sec-title_dots">
										<span></span>
										{' '}
										<span></span>
										{' '}
										<span></span>
									</div>
								</div>
								{' '}
								<h2 className="sec-title_heading">What Our Clients Say About Us</h2>
								{' '}
								<div className="sec-title_text">
									Unedited 5-star reviews from our founder Saurav Wahid's{' '}
									<a href="https://www.fiverr.com/wahidsaurav" target="_blank" rel="noopener">Fiverr profile</a>
									. You can also hire us on{' '}
									<a href="https://www.upwork.com/freelancers/sauravwahid" target="_blank" rel="noopener">Upwork</a>
									.
								</div>
							</div>
							{' '}
							<div className="testimonial-one_talk d-flex">
								<span className="up-down_animation">Let’s Talk</span>
								{' '}
								<i>
									<img loading="lazy" decoding="async" src="/assets/images/icons/hand-shake.png" alt="Handshake" />
								</i>
							</div>
							{/* Button Box */}
							{' '}
							<div className="testimonial-one_button d-flex justify-content-end">
								<Link href="/contact" className="theme-btn btn-style-three">
									<span className="btn-wrap">
										<span className="text-one">Get a Free Quote</span>
										{' '}
										<span className="text-two">Get a Free Quote</span>
									</span>
								</Link>
							</div>
							{' '}
							<div className="about-one_arrows" style={{ backgroundImage: 'url(/assets/images/icons/testimonial-arrow.png)' }}></div>
						</div>
						{/* Column */}
						{' '}
						<div className="testimonial-one_carousel-column col-lg-7 col-md-12 col-sm-12">
							<div className="testimonial-one_carousel-content">
								<div className="testimonial-one_carousel-layer" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-7.png)' }}></div>
								{' '}
								<div className="testimonial-one_carousel swiper-container">
									<div className="swiper-wrapper">
										{/* Slide 1: theinnerpoint (USA) */}
										<div className="swiper-slide">
											{/* Testimonial Block One */}
											<div className="testimonial-block_one">
												<div className="testimonial-block_one-inner">
													<div className="review-gig-tag">
														<i className="fa-solid fa-mobile-screen-button"></i>
														{' '}Mobile Store &amp; Codemagic CI/CD Pipeline{' '}
														<span className="price-badge">Top-Notch Quality</span>
													</div>
													{' '}
													<div className="testimonial-block_one-text">“ He is just amazing - he came to my rescue right in time after fighting with Codemagic for months - he build the pipeline in top notch quality and his attention to detail is just amazing. He is the best Codemagic expert I've ever worked with! ”</div>
													{' '}
													<div className="testimonial-author-wrapper">
														<div className="testimonial-block_one-author">
															<div className="fiverr-author-avatar">T</div>
															{' '}
															<div className="author-info-box">
																<h4 className="author-name">theinnerpoint</h4>
																{' '}
																<div className="author-meta">
																	<span className="country-pill">🇺🇸 United States</span>
																	{' '}
																	<span>•</span>
																	{' '}
																	<span className="verified-tag">
																		<i className="fa-solid fa-circle-check"></i>
																		{' '}Verified Fiverr Client
																	</span>
																</div>
															</div>
														</div>
														{' '}
														<div className="testimonial-block_one-rating">
															<span>5.0</span>
															{' '}
															<div className="stars-group">
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										{/* Slide 2: sairamchaganti (India) */}
										{' '}
										<div className="swiper-slide">
											{/* Testimonial Block One */}
											<div className="testimonial-block_one">
												<div className="testimonial-block_one-inner">
													<div className="review-gig-tag">
														<i className="fa-solid fa-cloud-arrow-up"></i>
														{' '}Codemagic Deployment &amp; Store Management{' '}
														<span className="price-badge">Ahead of Schedule</span>
													</div>
													{' '}
													<div className="testimonial-block_one-text">“ I had an excellent experience working with Saurav Wahid for our deployment through Codemagic. They were not only highly knowledgeable and skilled in handling the intricacies of the deployment process but also demonstrated exceptional care and attention to detail throughout the project. What stood out the most was their ability to deliver the work ahead of schedule, which was a tremendous help for our team. Truly a five-star service! ”</div>
													{' '}
													<div className="testimonial-author-wrapper">
														<div className="testimonial-block_one-author">
															<div className="fiverr-author-avatar">S</div>
															{' '}
															<div className="author-info-box">
																<h4 className="author-name">sairamchaganti</h4>
																{' '}
																<div className="author-meta">
																	<span className="country-pill">🇮🇳 India</span>
																	{' '}
																	<span>•</span>
																	{' '}
																	<span className="verified-tag">
																		<i className="fa-solid fa-circle-check"></i>
																		{' '}Verified Fiverr Client
																	</span>
																</div>
															</div>
														</div>
														{' '}
														<div className="testimonial-block_one-rating">
															<span>5.0</span>
															{' '}
															<div className="stars-group">
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										{/* Slide 3: bluebahia2018 (USA) */}
										{' '}
										<div className="swiper-slide">
											{/* Testimonial Block One */}
											<div className="testimonial-block_one">
												<div className="testimonial-block_one-inner">
													<div className="review-gig-tag">
														<i className="fa-solid fa-code"></i>
														{' '}Mobile App Customization &amp; Engineering{' '}
														<span className="price-badge">5-Star Communication</span>
													</div>
													{' '}
													<div className="testimonial-block_one-text">“ Saurav was a pleasure to work with! He was exceptionally professional -- especially with communication and responsiveness -- and really went above and beyond with my project. I would most definitely use his services again. ”{' '}</div>
													{' '}
													<div className="testimonial-author-wrapper">
														<div className="testimonial-block_one-author">
															<div className="fiverr-author-avatar">B</div>
															{' '}
															<div className="author-info-box">
																<h4 className="author-name">bluebahia2018</h4>
																{' '}
																<div className="author-meta">
																	<span className="country-pill">🇺🇸 United States</span>
																	{' '}
																	<span>•</span>
																	{' '}
																	<span className="verified-tag">
																		<i className="fa-solid fa-circle-check"></i>
																		{' '}Verified Fiverr Client
																	</span>
																</div>
															</div>
														</div>
														{' '}
														<div className="testimonial-block_one-rating">
															<span>5.0</span>
															{' '}
															<div className="stars-group">
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										{/* Slide 4: jamiegale (Ireland) */}
										{' '}
										<div className="swiper-slide">
											{/* Testimonial Block One */}
											<div className="testimonial-block_one">
												<div className="testimonial-block_one-inner">
													<div className="review-gig-tag">
														<i className="fa-brands fa-apple"></i>
														{' '}iOS Deployment Pipeline &amp; Store Management{' '}
														<span className="price-badge">Super Fast Delivery</span>
													</div>
													{' '}
													<div className="testimonial-block_one-text">“ Absolutely awesome experience. Super fast delivery. Helped our team streamline our iOS deployment pipeline. Would highly recommend. ”</div>
													{' '}
													<div className="testimonial-author-wrapper">
														<div className="testimonial-block_one-author">
															<div className="fiverr-author-avatar">J</div>
															{' '}
															<div className="author-info-box">
																<h4 className="author-name">jamiegale</h4>
																{' '}
																<div className="author-meta">
																	<span className="country-pill">🇮🇪 Ireland</span>
																	{' '}
																	<span>•</span>
																	{' '}
																	<span className="verified-tag">
																		<i className="fa-solid fa-circle-check"></i>
																		{' '}Verified Fiverr Client
																	</span>
																</div>
															</div>
														</div>
														{' '}
														<div className="testimonial-block_one-rating">
															<span>5.0</span>
															{' '}
															<div className="stars-group">
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
										{/* Slide 5: messinis (Switzerland) */}
										{' '}
										<div className="swiper-slide">
											{/* Testimonial Block One */}
											<div className="testimonial-block_one">
												<div className="testimonial-block_one-inner">
													<div className="review-gig-tag">
														<i className="fa-solid fa-wrench"></i>
														{' '}Mobile Store Management &amp; Problem Solving{' '}
														<span className="price-badge">1-Day Turnaround</span>
													</div>
													{' '}
													<div className="testimonial-block_one-text">“ Solved the problem I had and answered all my questions. Fast, accurate, and great communication. Thank you! ”</div>
													{' '}
													<div className="testimonial-author-wrapper">
														<div className="testimonial-block_one-author">
															<div className="fiverr-author-avatar">M</div>
															{' '}
															<div className="author-info-box">
																<h4 className="author-name">messinis</h4>
																{' '}
																<div className="author-meta">
																	<span className="country-pill">🇨🇭 Switzerland</span>
																	{' '}
																	<span>•</span>
																	{' '}
																	<span className="verified-tag">
																		<i className="fa-solid fa-circle-check"></i>
																		{' '}Verified Fiverr Client
																	</span>
																</div>
															</div>
														</div>
														{' '}
														<div className="testimonial-block_one-rating">
															<span>5.0</span>
															{' '}
															<div className="stars-group">
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
																{' '}
																<i className="fa-solid fa-star"></i>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
									{/* Slider One Arrows */}
									{' '}
									<div className="testimonial-one_arrow">
										<div className="testimonial-one_carousel-prev fas fa-arrow-left fa-fw"></div>
										{' '}
										<div className="testimonial-one_carousel-next fas fa-arrow-right fa-fw"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Of Testimonial One */}
			{/* Process Section */}
			{' '}
			<section className="process-one" id="process">
				<div className="auto-container">
					{/* Sec Title */}
					<div className="sec-title">
						<div className="sec-title_title">
							{' '}Our Work Process{' '}
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
							From Idea to App Store{' '}
							<br />
							{' '}in 4 Steps
						</h2>
					</div>
					{' '}
					<div className="row clearfix">
						{/* Step Block 01 */}
						<div className="step-block_one col-lg-3 col-md-6 col-sm-12">
							<div className="step-block_one-inner">
								<div className="step-block_one-bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-5.png)' }}></div>
								{' '}
								<div className="step-block_one-number">
									<span>01</span>
									Step
								</div>
								{' '}
								<h4 className="step-block_one-heading">Discovery &amp; Architecture</h4>
								{' '}
								<div className="step-block_one-text">We deep-dive into your requirements, map intuitive user journeys, and architect a robust, scalable tech foundation tailored for long-term growth.</div>
							</div>
						</div>
						{/* Step Block 02 */}
						{' '}
						<div className="step-block_one col-lg-3 col-md-6 col-sm-12">
							<div className="step-block_one-inner">
								<div className="step-block_one-bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-5.png)' }}></div>
								{' '}
								<div className="step-block_one-number">
									<span>02</span>
									Step
								</div>
								{' '}
								<h4 className="step-block_one-heading">UI/UX &amp; Interactive Design</h4>
								{' '}
								<div className="step-block_one-text">Crafting modern, pixel-perfect Figma prototypes and user-centric design systems that ensure high engagement, retention, and seamless usability.</div>
							</div>
						</div>
						{/* Step Block 03 */}
						{' '}
						<div className="step-block_one col-lg-3 col-md-6 col-sm-12">
							<div className="step-block_one-inner">
								<div className="step-block_one-bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-5.png)' }}></div>
								{' '}
								<div className="step-block_one-number">
									<span>03</span>
									Step
								</div>
								{' '}
								<h4 className="step-block_one-heading">Agile Sprint Development</h4>
								{' '}
								<div className="step-block_one-text">Building high-performance mobile and web apps with clean, modular code, modern frameworks (Flutter, React, Next.js), and secure APIs.</div>
							</div>
						</div>
						{/* Step Block 04 */}
						{' '}
						<div className="step-block_one col-lg-3 col-md-6 col-sm-12">
							<div className="step-block_one-inner">
								<div className="step-block_one-bg" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-5.png)' }}></div>
								{' '}
								<div className="step-block_one-number">
									<span>04</span>
									Step
								</div>
								{' '}
								<h4 className="step-block_one-heading">QA, Deployment &amp; Scale</h4>
								{' '}
								<div className="step-block_one-text">Comprehensive end-to-end testing, seamless App Store, Google Play, and Cloud deployments, backed by dedicated post-launch support and optimization.</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Of Process One */}
			{/* Team Section */}
			{' '}
			<section className="team-one" id="team">
				<div className="team-one_layer" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-8.png)' }}></div>
				{' '}
				<div className="auto-container">
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
							{' '}Our Expert Team{' '}
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
							Meet Our Core Team{' '}
							<br />
							{' '}Behind TechFiyr
						</h2>
					</div>
					{' '}
					<div className="team-one_carousel swiper-container">
						<div className="swiper-wrapper">
							{/* Team Member 1 */}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/saurav-wahid-portrait.jpg" alt="Saurav Wahid" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">Full Stack AI Native Engineer | Java | Spring | Web | Mobile App | DevOps</span>
												{' '}
												<span className="cat">Co-Founder &amp; Team Lead</span>
												{' '}
												<h5 className="title">Saurav Wahid</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/sauravwahid/" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in"></i>
													</a>
													{' '}
													<a href="https://github.com/swahid" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github"></i>
													</a>
													{' '}
													<a href="https://www.credly.com/badges/8a5a2d48-5ff5-4f9a-b4d5-cbe49eb03732/public_url" target="_blank" rel="noopener" aria-label="Oracle Certified Professional" title="Oracle Certified Professional">
														<i className="fa-solid fa-certificate"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Team Member 2 */}
							{' '}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/viswajit-roy.jpg" alt="Viswajit Roy" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">{' '}Lead UI/UX Designer</span>
												{' '}
												<span className="cat">Co-Founder &amp; Managing Director</span>
												{' '}
												<h5 className="title">Viswajit Roy</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/viswajitroy" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in"></i>
													</a>
													{' '}
													<a href="https://github.com/viswajitRoy" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github"></i>
													</a>
													{' '}
													<a href="https://www.behance.net/royviswajie8fd" target="_blank" rel="noopener" aria-label="Behance">
														<i className="fa-brands fa-behance"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Team Member 3 */}
							{' '}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/ponir-saha.jpg" alt="Ponir Saha" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">Software Architect | Production AI/RAG | Java | Spring | Python</span>
												{' '}
												<span className="cat">Co-Founder &amp; CTO</span>
												{' '}
												<h5 className="title">Ponir Saha</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/ponirsaha/" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in"></i>
													</a>
													{' '}
													<a href="https://github.com/ponir-saha" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Team Member 4 */}
							{' '}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/masud-parvez.jpg" alt="Md Masud Parvez" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">Lead Android &amp; iOS Developer</span>
												{' '}
												<h5 className="title">Md Masud Parvez</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/masudparvez11/" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in"></i>
													</a>
													{' '}
													<a href="https://github.com/pavelsust" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Team Member 5 */}
							{' '}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/awon-uz-zaman.jpg" alt="Md. Awon-Uz-Zaman" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">Android &amp; iOS Developer</span>
												{' '}
												<h5 className="title">Md. Awon-Uz-Zaman</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/awonuzzaman/" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in"></i>
													</a>
													{' '}
													<a href="https://github.com/awon057" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Team Member 6 */}
							{' '}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/sohanur-islam.jpg" alt="Sohanur Islam" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">Full-Stack Software Engineer | Java | Angular | Spring | AI Agent Specialist | Next.js | React Native</span>
												{' '}
												<h5 className="title">Sohanur Islam</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/sohanur-islam-b2a027145/" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in" aria-hidden="true"></i>
													</a>
													{' '}
													<a href="https://github.com/sohanur1" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github" aria-hidden="true"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* Team Member 7 */}
							{' '}
							<div className="team-one_one swiper-slide">
								<div className="inner-box">
									<div className="image-box">
										<figure className="image">
											<img loading="lazy" decoding="async" src="/assets/images/team/pranabesh-sarkar.jpg" alt="Pranabesh Sarkar" />
										</figure>
									</div>
									{' '}
									<div className="content-box">
										<div className="d-flex justify-content-between align-items-center">
											<div className="left-box">
												<span className="cat">AI/ML Engineer | MLOps, Deep Learning &amp; Scalable AI Infrastructure | LLM Integration, Vector DBs &amp; Smart Products</span>
												{' '}
												<h5 className="title">Pranabesh Sarkar</h5>
											</div>
											{' '}
											<div className="right-box">
												<div className="team-one_socials">
													<a href="https://www.linkedin.com/in/pranab-csra" target="_blank" rel="noopener" aria-label="LinkedIn">
														<i className="fa-brands fa-linkedin-in" aria-hidden="true"></i>
													</a>
													{' '}
													<a href="https://github.com/pranab-sarkar" target="_blank" rel="noopener" aria-label="GitHub">
														<i className="fa-brands fa-github" aria-hidden="true"></i>
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					{/* Team One Arrows */}
					{' '}
					<div className="team-one_arrow d-flex justify-content-center">
						<button type="button" className="team-one_carousel-prev" aria-label="Previous team member">
							<i className="fa-solid fa-arrow-left fa-fw" aria-hidden="true"></i>
						</button>
						{' '}
						<button type="button" className="team-one_carousel-next" aria-label="Next team member">
							<i className="fa-solid fa-arrow-right fa-fw" aria-hidden="true"></i>
						</button>
					</div>
				</div>
			</section>
			{/* End Of Team One */}
			{/* Incredible One Section */}
			{' '}
			<section className="incredible-one">
				<div className="incredible-one_bg"></div>
				{' '}
				<div className="incredible-one_pattern" style={{ backgroundImage: 'url(/assets/images/backgrounds/pattern-9.png)' }}></div>
				{' '}
				<div className="auto-container">
					<div className="row align-items-center">
						{/* Left Column: Title & Outlined Tech */}
						<div className="col-lg-7 col-md-12 mb-4 mb-lg-0">
							<div className="sec-title light title-anim">
								<div className="sec-title_title">
									{' '}Driven by Passion &amp; Excellence{' '}
									<div className="sec-title_dots">
										<span></span>
										{' '}
										<span></span>
										{' '}
										<span></span>
									</div>
								</div>
								{' '}
								<h2 className="sec-title_heading">Engineering Next-Gen Digital Products</h2>
							</div>
							{' '}
							<div className="incredible-one_title">
								TechFiyr{' '}
								<br />
								Software
							</div>
						</div>
						{/* Right Column: Card */}
						{' '}
						<div className="col-lg-5 col-md-12">
							<div className="experiance-one_years-inner">
								<div className="experiance-one_text">From first prototype to App Store launch, TechFiyr is the team startups and growing businesses trust to ship.</div>
								{/* Button Box */}
								{' '}
								<div className="experiance-one_button">
									<Link href="/contact" className="theme-btn btn-style-one">
										<span className="btn-wrap">
											<span className="text-one">Get a Free Quote</span>
											{' '}
											<span className="text-two">Get a Free Quote</span>
										</span>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			{/* End Of Incredible One */}
		</>
	);
}
