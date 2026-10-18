/*
 * /sitemap.xml: every indexable page, with its main images. Project pages come from lib/projects.ts.
 * When a page's content changes, update its lastModified date here (AGENTS.md section 7.0 D).
 * Leave out noindex pages (coming-soon, offline, 404).
 */
import type { MetadataRoute } from 'next';
import { PROJECTS, projectPath } from '@/lib/projects';
import { absUrl } from '@/lib/site';

const UPDATED = '2026-10-18';

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: absUrl('/'),
			lastModified: UPDATED,
			images: [
				absUrl('/assets/images/og/techfiyr-og.jpg'),
				absUrl('/assets/images/services/mobile-app-development.jpg'),
				absUrl('/assets/images/services/web-software-saas.jpg'),
			],
		},
		{ url: absUrl('/projects'), lastModified: UPDATED },
		...PROJECTS.map((p) => ({
			url: absUrl(projectPath(p)),
			lastModified: UPDATED,
			images: [p.cover, ...(p.gallery || [])].map(absUrl),
		})),
		{ url: absUrl('/contact'), lastModified: UPDATED },
		{ url: absUrl('/privacy-policy'), lastModified: UPDATED },
		{ url: absUrl('/cookie-policy'), lastModified: UPDATED },
		{ url: absUrl('/content-policy'), lastModified: UPDATED },
	];
}
