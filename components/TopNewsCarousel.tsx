/*
 * Horizontal Top AI News card carousel shown at the top of /blog.
 * Uses native overflow scrolling + scroll-snap, gentle auto-advance (with hover/focus pause,
 * WCAG 2.2.2 Pause/Play control, and prefers-reduced-motion respect), Previous/Next buttons,
 * marker dots, and a subtle edge-fade scrollability affordance hint.
 */
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDate, type NewsItem } from '@/lib/content';

const AUTO_INITIAL_DELAY_MS = 1600;
const AUTO_INTERVAL_MS = 4000;

export default function TopNewsCarousel({ items, day }: { items: NewsItem[]; day: string }) {
	const trackRef = useRef<HTMLDivElement>(null);
	const interactingRef = useRef(false);
	const pendingTargetRef = useRef<number | null>(null);
	const settledIndexRef = useRef(0);
	const scrollRafRef = useRef<number | null>(null);
	const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [activeIndex, setActiveIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const [reduceMotion, setReduceMotion] = useState(false);
	const [announcement, setAnnouncement] = useState('');
	const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});
	const [moreEdges, setMoreEdges] = useState({ start: false, end: false });

	const count = items.length;

	const getSlides = useCallback((): HTMLElement[] => {
		const track = trackRef.current;
		if (!track) return [];
		return Array.from(track.querySelectorAll<HTMLElement>('[data-news-slide]'));
	}, []);

	const measureNearest = useCallback((): number => {
		const track = trackRef.current;
		const slides = getSlides();
		if (!track || !slides.length) return 0;

		const left = track.scrollLeft;
		const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
		if (left <= 4) return 0;
		if (maxScroll > 8 && left >= maxScroll - 8) return slides.length - 1;

		let best = 0;
		let bestDist = Infinity;
		for (let i = 0; i < slides.length; i++) {
			const target = Math.min(maxScroll, Math.max(0, slides[i].offsetLeft - track.offsetLeft));
			const dist = Math.abs(target - left);
			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		}
		return best;
	}, [getSlides]);

	const scrollToIndex = useCallback(
		(index: number, announceUserMove: boolean) => {
			const track = trackRef.current;
			const slides = getSlides();
			if (!track || !slides.length) return;

			const bounded = ((index % slides.length) + slides.length) % slides.length;
			const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
			const rawLeft = Math.max(0, slides[bounded].offsetLeft - track.offsetLeft);
			const targetLeft = Math.min(maxScroll, rawLeft);

			pendingTargetRef.current = bounded;
			setActiveIndex(bounded);

			if (announceUserMove) {
				settledIndexRef.current = bounded;
				setAnnouncement(`Story ${bounded + 1} of ${slides.length}: ${items[bounded]?.title || ''}`);
			}

			track.scrollTo({
				left: targetLeft,
				behavior: reduceMotion ? 'auto' : 'smooth',
			});
		},
		[getSlides, items, reduceMotion],
	);

	const step = useCallback(
		(delta: number, announceUserMove = true) => {
			const track = trackRef.current;
			const slides = getSlides();
			if (!track || !slides.length) return;

			const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
			if (maxScroll <= 4) return;

			const base = pendingTargetRef.current !== null ? pendingTargetRef.current : measureNearest();

			if (delta > 0) {
				// If the current position or target is already at the far right edge, wrap smoothly back to the start
				const currentTargetLeft = Math.max(0, slides[base].offsetLeft - track.offsetLeft);
				if (track.scrollLeft >= maxScroll - 8 || currentTargetLeft >= maxScroll - 8 || base >= slides.length - 1) {
					scrollToIndex(0, announceUserMove);
					return;
				}
				// Advance to the next card whose scroll position actually moves forward visibly
				let nextIdx = base + 1;
				while (nextIdx < slides.length - 1 && slides[nextIdx].offsetLeft - track.offsetLeft <= track.scrollLeft + 8) {
					nextIdx += 1;
				}
				scrollToIndex(nextIdx, announceUserMove);
				return;
			}

			if (track.scrollLeft <= 8 && base <= 0) {
				scrollToIndex(slides.length - 1, announceUserMove);
				return;
			}
			scrollToIndex(Math.max(0, base - 1), announceUserMove);
		},
		[getSlides, measureNearest, scrollToIndex],
	);

	// Detect reduced-motion preference after mount so SSR and initial hydration markup match cleanly
	useEffect(() => {
		const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
		if (!mq) return;
		const apply = () => {
			setReduceMotion(mq.matches);
			if (mq.matches) setPaused(true);
		};
		apply();
		mq.addEventListener?.('change', apply);
		return () => mq.removeEventListener?.('change', apply);
	}, []);

	// Sync active indicator & polite announcement after native scroll settles
	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;

		let settleFallback: ReturnType<typeof setTimeout> | null = null;
		const supportsScrollEnd = 'onscrollend' in window;

		const onSettle = () => {
			const idx = measureNearest();
			pendingTargetRef.current = null;
			setActiveIndex(idx);
			if (settledIndexRef.current !== idx) {
				settledIndexRef.current = idx;
				setAnnouncement(`Story ${idx + 1} of ${items.length}: ${items[idx]?.title || ''}`);
			}
		};

		const onScroll = () => {
			if (pendingTargetRef.current === null && scrollRafRef.current === null) {
				scrollRafRef.current = requestAnimationFrame(() => {
					scrollRafRef.current = null;
					const idx = measureNearest();
					setActiveIndex((prev) => (prev === idx ? prev : idx));
				});
			}
			if (!supportsScrollEnd) {
				if (settleFallback) clearTimeout(settleFallback);
				settleFallback = setTimeout(onSettle, 140);
			}
		};

		track.addEventListener('scroll', onScroll, { passive: true });
		if (supportsScrollEnd) track.addEventListener('scrollend', onSettle, { passive: true });

		return () => {
			track.removeEventListener('scroll', onScroll);
			if (supportsScrollEnd) track.removeEventListener('scrollend', onSettle);
			if (settleFallback) clearTimeout(settleFallback);
			if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
		};
	}, [items, measureNearest]);

	// IntersectionObserver fallback for horizontal edge fade hints when CSS scroll-timeline masks aren't supported
	useEffect(() => {
		const track = trackRef.current;
		if (!track || typeof CSS === 'undefined' || CSS.supports?.('animation-timeline', 'scroll()')) return;
		const slides = getSlides();
		if (!slides.length) return;
		const first = slides[0];
		const last = slides[slides.length - 1];
		const observer = new IntersectionObserver(
			(entries) => {
				setMoreEdges((prev) => {
					const next = { ...prev };
					for (const { target, intersectionRatio } of entries) {
						if (target === first) next.start = intersectionRatio < 0.99;
						if (target === last) next.end = intersectionRatio < 0.99;
					}
					return next;
				});
			},
			{ root: track, threshold: 0.99, rootMargin: '2px' },
		);
		observer.observe(first);
		observer.observe(last);
		return () => observer.disconnect();
	}, [getSlides, count]);

	// Left-to-right gentle auto-scroll along the story strip; pauses on hover, focus, reduced motion, or user toggle
	useEffect(() => {
		if (paused || reduceMotion || count <= 1) return;
		let cancelled = false;

		const schedule = (delay: number) => {
			if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
			autoTimerRef.current = setTimeout(() => {
				if (cancelled) return;
				if (!interactingRef.current && !document.hidden) {
					step(1, false);
				}
				schedule(AUTO_INTERVAL_MS);
			}, delay);
		};

		schedule(AUTO_INITIAL_DELAY_MS);
		return () => {
			cancelled = true;
			if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
		};
	}, [paused, reduceMotion, count, step]);

	if (!count) return null;

	const markFailed = (id: string) => {
		setFailedImgs((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
	};

	const trackClasses = [
		'blog-news_track',
		moreEdges.start ? 'more-start' : '',
		moreEdges.end ? 'more-end' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<section className="blog-news_section" id="top-ai-news" aria-roledescription="carousel" aria-label="Top AI news today">
			<div className="auto-container">
				<div className="blog-news_head">
					<div className="blog-news_intro">
						<div className="sec-title_title">
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
							{' '}AI News Feed{' '}
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
						</div>
						{' '}
						<h2 className="blog-news_heading">Today&apos;s Top AI News</h2>
						<p className="blog-news_sub">
							Updated daily with top headlines, thumbnails and short summaries{day ? ` (${day})` : ''}.{' '}
							<Link href="/news">
								View full briefing <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
							</Link>
						</p>
					</div>

					{count > 1 && (
						<div className="blog-news_controls">
							<button
								type="button"
								className="blog-news_ctrl blog-news_toggle"
								onClick={() => setPaused((p) => !p)}
								aria-pressed={!paused}
								aria-label={paused ? 'Resume auto-scrolling AI news' : 'Pause auto-scrolling AI news'}
								title={paused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
							>
								<i className={paused ? 'fa-solid fa-play' : 'fa-solid fa-pause'} aria-hidden="true"></i>
							</button>
							<button
								type="button"
								className="blog-news_ctrl"
								onClick={() => step(-1, true)}
								aria-label="Previous AI news story"
								title="Previous story"
							>
								<i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
							</button>
							<button
								type="button"
								className="blog-news_ctrl"
								onClick={() => step(1, true)}
								aria-label="Next AI news story"
								title="Next story"
							>
								<i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
							</button>
						</div>
					)}
				</div>

				<div
					ref={trackRef}
					className={trackClasses}
					tabIndex={0}
					role="group"
					aria-label="Top AI news cards"
					onMouseEnter={() => {
						interactingRef.current = true;
					}}
					onMouseLeave={() => {
						interactingRef.current = false;
					}}
					onFocusCapture={() => {
						interactingRef.current = true;
					}}
					onBlurCapture={(e) => {
						if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
							interactingRef.current = false;
						}
					}}
					onPointerDown={() => {
						pendingTargetRef.current = null;
					}}
					onKeyDown={(e) => {
						if (e.target !== trackRef.current) return;
						if (e.key === 'ArrowRight') {
							e.preventDefault();
							step(1, true);
						} else if (e.key === 'ArrowLeft') {
							e.preventDefault();
							step(-1, true);
						}
					}}
				>
					{items.map((item, i) => {
						const hasImage = Boolean(item.imageUrl) && !failedImgs[item.id];
						const formattedDate = formatDate(item.publishedAt);
						return (
							<article
								key={item.id}
								data-news-slide=""
								role="group"
								aria-roledescription="slide"
								aria-label={`${i + 1} of ${count}`}
								className="blog-news_card"
							>
								<div className="blog-news_media">
									{hasImage ? (
										<img
											src={item.imageUrl}
											alt={item.title}
											width={640}
											height={360}
											loading={i < 3 ? 'eager' : 'lazy'}
											decoding="async"
											referrerPolicy="no-referrer"
											onError={() => markFailed(item.id)}
										/>
									) : (
										<span className="content-card_placeholder" aria-hidden="true">
											{item.source}
										</span>
									)}
									<span className="project-chip">{item.source}</span>
									<span className="blog-news_rank" aria-hidden="true">
										#{String(i + 1).padStart(2, '0')}
									</span>
								</div>

								<div className="blog-news_body">
									<p className="content-card_meta">
										{formattedDate ? <time dateTime={item.publishedAt}>{formattedDate}</time> : item.source}
										{item.pinned ? <span className="blog-news_pin"> · Featured</span> : null}
									</p>
									<h3 className="blog-news_title">
										<a href={item.url} target="_blank" rel="noopener nofollow">
											{item.title}
											<span className="sr-only"> ({item.source}, opens in a new tab)</span>
										</a>
									</h3>
									<p className="blog-news_text">
										{item.summary || `${item.source} coverage of recent AI developments.`}
									</p>
									<div className="project-card_foot">
										<span className="project-card_more" aria-hidden="true">
											Read article <i className="fa-solid fa-arrow-up-right-from-square"></i>
										</span>
									</div>
								</div>
							</article>
						);
					})}
				</div>

				{count > 1 && (
					<div className="blog-news_foot">
						<nav className="blog-news_markers" aria-label="Choose an AI news story">
							{items.map((item, i) => (
								<button
									key={item.id}
									type="button"
									className="blog-news_dot"
									aria-label={`Story ${i + 1}: ${item.title}`}
									aria-current={activeIndex === i ? 'true' : undefined}
									onClick={() => scrollToIndex(i, true)}
								/>
							))}
						</nav>
					</div>
				)}

				<p className="sr-only" role="status" aria-live="polite">
					{announcement}
				</p>
			</div>
		</section>
	);
}
