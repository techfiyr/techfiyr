/*
 * /sitemap.xml: every indexable page, with its main images. Project pages come from lib/projects.ts;
 * blog posts and products come from the CMS and carry their own last-updated dates. The file is
 * refreshed whenever the admin panel saves (revalidatePath in app/admin/actions.ts), or hourly.
 * When a static page's content changes, update its date below (AGENTS.md section 7.0 D).
 * Leave out noindex pages (coming-soon, offline, 404, admin).
 */
import type { MetadataRoute } from 'next';
import { postPath, productPath } from '@/lib/content';
import { PROJECTS, projectPath } from '@/lib/projects';
import { getNewsEdition, getPublishedPosts, getPublishedProducts } from '@/lib/server/content';
import { absUrl } from '@/lib/site';

const UPDATED = '2026-10-18';

export const revalidate = 3600;

const imageUrl = (src: string) => (src ? [absUrl(src)] : []);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [posts, products, news] = await Promise.all([getPublishedPosts(), getPublishedProducts(), getNewsEdition()]);
	const latest = (dates: string[]) => dates.filter(Boolean).sort().pop() || UPDATED;

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
		{ url: absUrl('/products'), lastModified: latest([UPDATED, ...products.map((p) => p.updatedAt.slice(0, 10))]) },
		...products.map((p) => ({
			url: absUrl(productPath(p)),
			lastModified: p.updatedAt.slice(0, 10) || UPDATED,
			images: [...imageUrl(p.coverUrl), ...p.gallery.map(absUrl)],
		})),
		{ url: absUrl('/blog'), lastModified: latest([UPDATED, ...posts.map((p) => p.updatedAt.slice(0, 10))]) },
		...posts.map((p) => ({
			url: absUrl(postPath(p)),
			lastModified: p.updatedAt.slice(0, 10) || UPDATED,
			images: imageUrl(p.coverUrl),
		})),
		{ url: absUrl('/news'), lastModified: news.day || UPDATED, changeFrequency: 'daily' as const },
		{ url: absUrl('/contact'), lastModified: UPDATED },
		{ url: absUrl('/privacy-policy'), lastModified: UPDATED },
		{ url: absUrl('/cookie-policy'), lastModified: UPDATED },
		{ url: absUrl('/content-policy'), lastModified: UPDATED },
	];
}
