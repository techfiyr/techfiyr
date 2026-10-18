/*
 * Shell for the admin panel (/admin): its own stylesheet (public/assets/css/admin.css, the site's
 * tokens in a working-tool layout) and the site's fonts. None of the template's CSS or jQuery
 * scripts load here. Every admin page is private: noindex, and never cached (proxy.ts).
 */
import type { Metadata } from 'next';
import { ASSET_VERSION as V } from '@/lib/site';
import { NOINDEX } from '@/lib/seo';

const FONTS = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=Outfit:wght@100..900&family=Raleway:wght@800&display=swap';

export const metadata: Metadata = {
	title: { default: 'Admin | TechFiyr', template: '%s | TechFiyr Admin' },
	robots: NOINDEX,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<link rel="stylesheet" href={'/assets/css/admin.css?v=' + V.admin} precedence="admin" />
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
			<link rel="stylesheet" href={FONTS} precedence="admin" />
			<div className="admin-root">{children}</div>
		</>
	);
}
