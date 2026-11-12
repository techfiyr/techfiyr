/*
 * Loaded first on every page (app/(site)/layout.tsx), before the vendor libraries.
 * Odometer must not rewrite the counters on DOMContentLoaded: React hydrates the server HTML
 * first, then assets/js/script.js starts the counters (see initPage there).
 */
window.odometerOptions = { auto: false, format: 'd' };

// Dismiss the preloader as soon as the DOM is interactive so it never delays First/Largest Contentful Paint
(function () {
	function hidePreloader() {
		var p = document.querySelector('.preloader');
		if (p && !p.classList.contains('preloader-hidden')) {
			p.classList.add('preloader-hidden');
		}
	}
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		hidePreloader();
	} else {
		document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
	}
})();
