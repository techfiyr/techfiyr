'use client';

/*
 * FAQ Section with FAQPage schema data for Google, Bing, ChatGPT, Claude, and Perplexity.
 * Accessible accordion using template styling and BEM classes.
 */
import { useState } from 'react';

export const FAQ_ITEMS = [
	{
		q: 'What services does TechFiyr specialize in?',
		a: 'TechFiyr specializes in cross-platform mobile app development (Flutter and React Native), native iOS and Android engineering, custom web software and SaaS platform development, UI/UX product prototyping in Figma, and automated CI/CD release pipelines with Codemagic, AWS, and Firebase.',
	},
	{
		q: 'Can TechFiyr build mobile apps for both iOS and Android from a single codebase?',
		a: 'Yes. TechFiyr builds production-grade cross-platform apps using Flutter and React Native. A single unified codebase delivers native 60fps performance, custom animations, and consistent UI across both iOS and Android, reducing development cost and time-to-market by up to 40%.',
	},
	{
		q: 'How does TechFiyr automate App Store and Google Play deployment?',
		a: 'We configure automated mobile DevOps pipelines using Codemagic and GitHub Actions. We handle certificates, code signing, compliance checks, TestFlight beta distribution, and automated submissions to both the Apple App Store and Google Play Store.',
	},
	{
		q: 'What is the typical timeline and cost for developing an MVP mobile app or SaaS?',
		a: 'A typical MVP (Minimum Viable Product) takes 4 to 8 weeks to design, develop, test, and ship. Project engagements feature transparent milestone-based pricing, dedicated sprint demos, and 100% intellectual property (IP) transfer to you upon completion.',
	},
	{
		q: 'How can I hire TechFiyr or get a project quote?',
		a: 'You can book a free 30-minute discovery call on our contact page, message us directly on WhatsApp (+880 1540659530), email info@techfiyr.com, or hire our team via Fiverr and Upwork where TechFiyr holds a 5.0-star client rating.',
	},
];

export const faqSchema = {
	'@type': 'FAQPage',
	'@id': 'https://techfiyr.com/#faq',
	mainEntity: FAQ_ITEMS.map((item) => ({
		'@type': 'Question',
		name: item.q,
		acceptedAnswer: {
			'@type': 'Answer',
			text: item.a,
		},
	})),
};

export default function FaqSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	const toggle = (idx: number) => {
		setOpenIndex((prev) => (prev === idx ? null : idx));
	};

	return (
		<section className="faq-two" id="faq">
			<div className="auto-container">
				<div className="sec-title centered">
					<div className="sec-title_title">
						Frequently Asked Questions
						<div className="sec-title_dots">
							<span></span>{' '}
							<span></span>{' '}
							<span></span>
						</div>
					</div>
					<h2 className="sec-title_heading">Got Questions? We Have Answers</h2>
					<div className="sec-title_text">
						Learn how TechFiyr designs, develops, and deploys high-performance mobile apps and SaaS platforms for global startups.
					</div>
				</div>

				<div className="row clearfix justify-content-center">
					<div className="col-lg-10 col-md-12 col-sm-12">
						<div className="accordion-box">
							{FAQ_ITEMS.map((item, idx) => {
								const isOpen = openIndex === idx;
								return (
									<div key={idx} className={`block ${isOpen ? 'active-block' : ''}`}>
										<button
											type="button"
											className={`acc-btn ${isOpen ? 'active' : ''}`}
											onClick={() => toggle(idx)}
											aria-expanded={isOpen}
											aria-controls={`faq-answer-${idx}`}
											id={`faq-question-${idx}`}
										>
											{item.q}
											<div className="icon-outer">
												<span className="icon fa-solid fa-angle-down" aria-hidden="true"></span>
											</div>
										</button>
										<div
											id={`faq-answer-${idx}`}
											role="region"
											aria-labelledby={`faq-question-${idx}`}
											className={`acc-content ${isOpen ? 'current' : ''}`}
										>
											<div className="content">
												<div className="text">{item.a}</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
