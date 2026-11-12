'use client';

/*
 * FAQ Section with FAQPage schema data for Google, Bing, ChatGPT, Claude, and Perplexity.
 * Accessible accordion using template styling and BEM classes.
 */
import { useState } from 'react';
import { FAQ_ITEMS } from '@/lib/faq';

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
						Learn how TechFiyr designs, builds and ships Flutter and React Native apps and SaaS platforms for startups in the US, Europe and Asia.
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
