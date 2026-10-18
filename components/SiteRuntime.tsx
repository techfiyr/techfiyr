'use client';

/*
 * Bridges Next.js navigation and the template's jQuery behaviour (public/assets/js/script.js).
 * After React hydrates, and again after every client-side page change, it calls
 * window.TechFiyr.mount(pathname) so sliders, counters and reveals start on the new page.
 * It also registers the service worker (public/sw.js) that makes the site an installable,
 * offline-capable PWA.
 */
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

declare global {
	interface Window {
		TechFiyr?: { mount: (path: string) => void };
	}
}

export default function SiteRuntime() {
	const pathname = usePathname() || '/';

	useEffect(() => {
		let done = false;
		const run = () => {
			if (done || !window.TechFiyr) return;
			done = true;
			window.TechFiyr.mount(pathname);
		};
		run();
		// the deferred scripts may still be loading on the first visit
		if (!done) document.addEventListener('techfiyr:ready', run);
		return () => document.removeEventListener('techfiyr:ready', run);
	}, [pathname]);

	useEffect(() => {
		if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
		const register = () =>
			navigator.serviceWorker
				.register('/sw.js')
				.then(() => navigator.serviceWorker.ready)
				.then((reg) => {
					// files this first visit already loaded: let the worker keep copies for offline use
					const urls = performance.getEntriesByType('resource').map((e) => e.name);
					reg.active?.postMessage({ type: 'warm', urls });
				})
				.catch(() => {});
		if (document.readyState === 'complete') register();
		else window.addEventListener('load', register, { once: true });
	}, []);

	return null;
}
