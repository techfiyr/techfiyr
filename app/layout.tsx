/*
 * Root layout: the <html> and <body> every route shares, plus site-wide metadata
 * (icons, PWA manifest, theme colour). Pages with the header and footer use app/(site)/layout.tsx;
 * the stand-alone 404, offline and coming-soon pages bring their own styles.
 */
import type { Metadata, Viewport } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	applicationName: SITE_NAME,
	icons: {
		icon: [{ url: '/assets/images/brand/favicon.png', type: 'image/png' }],
		apple: [{ url: '/assets/images/brand/apple-touch-icon.png', sizes: '180x180' }],
	},
	appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	themeColor: '#237a57',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		// data-scroll-behavior: Bootstrap makes scrolling smooth; Next.js turns that off while it
		// changes page, so a new page starts at the top straight away
		<html lang="en" data-scroll-behavior="smooth">
			<body>{children}</body>
		</html>
	);
}
