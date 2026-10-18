/*
 * Layout for every page with the header and footer. The stylesheets and scripts are the template's
 * own files in public/assets (unchanged design); versions come from ASSET_VERSION in lib/site.ts.
 * The header, footer and back-to-top ring stay mounted while pages change, so navigation is instant.
 */
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SiteRuntime from '@/components/SiteRuntime';
import { ASSET_VERSION as V } from '@/lib/site';

const FONTS = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=Outfit:wght@100..900&family=Raleway:wght@800&display=swap';

// Same libraries, same order as the original pages. All deferred: they run after the HTML is parsed.
const SCRIPTS = [
	'/assets/js/boot.js?v=' + V.script,
	'/assets/vendor/jquery/jquery.js?v=' + V.vendor,
	'/assets/vendor/jquery-appear/jquery.appear.js?v=' + V.vendor,
	'/assets/vendor/wow/wow.js?v=' + V.vendor,
	'/assets/vendor/swiper/swiper.min.js?v=' + V.vendor,
	'/assets/js/backtotop.js?v=' + V.vendor,
	'/assets/vendor/odometer/odometer.js?v=' + V.vendor,
	'/assets/vendor/parallax-scroll/parallax-scroll.js?v=' + V.vendor,
	'/assets/vendor/gsap/gsap.min.js?v=' + V.vendor,
	'/assets/vendor/gsap/SplitText.min.js?v=' + V.vendor,
	'/assets/vendor/gsap/ScrollTrigger.min.js?v=' + V.vendor,
	'/assets/vendor/typeit/jquery.typeit.js?v=' + V.vendor,
	'/assets/vendor/jquery-marquee/jquery.marquee.min.js?v=' + V.vendor,
	'/assets/js/element-in-view.js?v=' + V.vendor,
	'/assets/js/consent.js?v=' + V.consent,
	'/firebase-config.js',
	'/assets/js/analytics.js?v=' + V.analytics,
	'/assets/js/visitors.js?v=' + V.visitors,
	'/assets/js/booking.js?v=' + V.booking,
	'/assets/js/script.js?v=' + V.script,
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* Stylesheets (React places them in <head>, in this order) */}
			<link rel="stylesheet" href={'/assets/vendor/bootstrap/bootstrap.css?v=' + V.bootstrap} precedence="template" />
			<link rel="stylesheet" href={'/assets/css/style.css?v=' + V.style} precedence="template" />
			<link rel="stylesheet" href={'/assets/vendor/meanmenu/meanmenu.min.css?v=' + V.meanmenu} precedence="template" />
			<link rel="stylesheet" href={'/assets/css/responsive.css?v=' + V.responsive} precedence="template" />
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
			<link rel="stylesheet" href={FONTS} precedence="template" />

			<a className="skip-link" href="#main">Skip to content</a>

			<div className="page-wrapper">
				{/* Preloader (script.js fades it out on DOM ready, which can be just before React hydrates) */}
				<div className="preloader" suppressHydrationWarning></div>
				{/* End Preloader */}

				<Header />

				<main id="main">{children}</main>

				<Footer />
			</div>
			{/* End PageWrapper */}

			{/* backtotop.js adds .active-progress on DOM ready when the page opens scrolled down, which can be just before React hydrates */}
			<button type="button" className="progress-wrap" aria-label="Back to top" suppressHydrationWarning>
				<svg className="progress-circle svg-content" aria-hidden="true" width="100%" height="100%" viewBox="-1 -1 102 102">
					{/* backtotop.js sets the ring's stroke styles on DOM ready */}
					<path d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" suppressHydrationWarning />
				</svg>
			</button>

			{SCRIPTS.map((src) => <script key={src} src={src} defer />)}
			<SiteRuntime />
		</>
	);
}
