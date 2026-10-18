/*
 * Web app manifest (/manifest.webmanifest): lets visitors install techfiyr.com as an app.
 * Icons are the logo mark on white, in public/assets/images/brand/.
 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: '/',
		name: 'TechFiyr | Mobile App & Web Software Agency',
		short_name: 'TechFiyr',
		description: 'Flutter, React Native, iOS and Android apps, custom web software, SaaS, UI/UX and CI/CD from Dhaka, Bangladesh.',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		orientation: 'portrait-primary',
		background_color: '#ffffff',
		theme_color: '#237a57',
		lang: 'en',
		categories: ['business', 'productivity'],
		icons: [
			{ src: '/assets/images/brand/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/assets/images/brand/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: '/assets/images/brand/app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
		],
		shortcuts: [
			{ name: 'Book a free call', url: '/contact', icons: [{ src: '/assets/images/brand/app-icon-192.png', sizes: '192x192' }] },
			{ name: 'Projects', url: '/projects', icons: [{ src: '/assets/images/brand/app-icon-192.png', sizes: '192x192' }] },
		],
	};
}
