/*
 * Page metadata in one shape for every indexable page (AGENTS.md section 7.1):
 * title, description, canonical, robots, Open Graph, Twitter and the llms.txt alternate link.
 */
import type { Metadata } from 'next';
import { LLMS_URL, OG_IMAGE, SITE_NAME, absUrl } from './site';

type PageSeo = {
	title: string;
	description: string;
	/** site path, e.g. "/contact" (the canonical URL) */
	path: string;
	ogTitle?: string;
	ogDescription?: string;
	twitterDescription?: string;
	image?: { url: string; width?: number; height?: number; alt: string };
	keywords?: string[];
};

export const INDEX_ROBOTS: Metadata['robots'] = {
	index: true,
	follow: true,
	'max-image-preview': 'large',
	'max-snippet': -1,
};

export function pageMetadata(p: PageSeo): Metadata {
	const url = p.path === '/' ? absUrl('/').replace(/\/$/, '/') : absUrl(p.path);
	const image = p.image || OG_IMAGE;
	const ogTitle = p.ogTitle || p.title;
	const ogDescription = p.ogDescription || p.description;
	return {
		title: { absolute: p.title },
		description: p.description,
		keywords: p.keywords,
		alternates: {
			canonical: url,
			types: { 'text/markdown': [{ url: LLMS_URL, title: 'TechFiyr summary for AI assistants' }] },
		},
		robots: INDEX_ROBOTS,
		openGraph: {
			type: 'website',
			siteName: SITE_NAME,
			locale: 'en_US',
			title: ogTitle,
			description: ogDescription,
			url,
			images: [{ url: image.url, width: image.width, height: image.height, alt: image.alt }],
		},
		twitter: {
			card: 'summary_large_image',
			title: ogTitle,
			description: p.twitterDescription || ogDescription,
			images: [image.url],
		},
	};
}

export const NOINDEX: Metadata['robots'] = { index: false, follow: false };
