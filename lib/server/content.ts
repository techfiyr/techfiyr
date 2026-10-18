/*
 * Reading CMS content (server only).
 *
 * Public pages read through the cached functions below (tags "posts", "products", "news"), so
 * they are served as static pages from the CDN and refreshed when the admin panel saves
 * (updateTag/revalidateTag in app/admin/actions.ts and the news refresh route), or hourly at most.
 * The admin panel reads uncached with the list*() functions.
 *
 * When the content database is not configured, the public functions return nothing and the pages
 * show their empty states instead of failing the build.
 */
import { unstable_cache } from 'next/cache';
import type { NewsItem, NewsRun, Post, Product, Status } from '@/lib/content';
import { store, storeMode, type Doc } from './store';

export const TAGS = { posts: 'posts', products: 'products', news: 'news' } as const;

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const status = (v: unknown): Status => (v === 'published' ? 'published' : 'draft');

export function toPost(d: Doc): Post {
	return {
		id: d.id,
		slug: str(d.slug),
		title: str(d.title),
		excerpt: str(d.excerpt),
		body: str(d.body),
		coverUrl: str(d.coverUrl),
		coverAlt: str(d.coverAlt),
		tags: strs(d.tags),
		author: str(d.author),
		status: status(d.status),
		seoTitle: str(d.seoTitle),
		seoDescription: str(d.seoDescription),
		publishedAt: str(d.publishedAt),
		createdAt: str(d.createdAt),
		updatedAt: str(d.updatedAt),
	};
}

export function toProduct(d: Doc): Product {
	const links = Array.isArray(d.links) ? d.links : [];
	return {
		id: d.id,
		slug: str(d.slug),
		name: str(d.name),
		tagline: str(d.tagline),
		description: str(d.description),
		category: str(d.category),
		platforms: strs(d.platforms),
		price: str(d.price),
		features: strs(d.features),
		coverUrl: str(d.coverUrl),
		coverAlt: str(d.coverAlt),
		gallery: strs(d.gallery),
		links: links
			.map((l) => ({ label: str((l as Record<string, unknown>)?.label), url: str((l as Record<string, unknown>)?.url) }))
			.filter((l) => l.label && l.url),
		status: status(d.status),
		order: num(d.order, 100),
		seoTitle: str(d.seoTitle),
		seoDescription: str(d.seoDescription),
		createdAt: str(d.createdAt),
		updatedAt: str(d.updatedAt),
	};
}

export function toNews(d: Doc): NewsItem {
	return {
		id: d.id,
		title: str(d.title),
		url: str(d.url),
		source: str(d.source),
		summary: str(d.summary),
		imageUrl: str(d.imageUrl),
		publishedAt: str(d.publishedAt),
		fetchedAt: str(d.fetchedAt),
		day: str(d.day),
		rank: num(d.rank, 99),
		hidden: d.hidden === true,
		pinned: d.pinned === true,
	};
}

const newestFirst = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);

// ---------- Admin (uncached) ----------
export async function listPosts(): Promise<Post[]> {
	return (await store.list('posts')).map(toPost).sort((a, b) => newestFirst(a.publishedAt || a.updatedAt, b.publishedAt || b.updatedAt));
}

export async function listProducts(): Promise<Product[]> {
	return (await store.list('products')).map(toProduct).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listNews(): Promise<NewsItem[]> {
	return (await store.list('news')).map(toNews).sort((a, b) => newestFirst(a.day, b.day) || Number(b.pinned) - Number(a.pinned) || a.rank - b.rank);
}

export async function lastNewsRun(): Promise<NewsRun | null> {
	const d = await store.get('meta', 'news-run');
	if (!d) return null;
	return {
		ranAt: str(d.ranAt),
		ok: d.ok === true,
		stored: num(d.stored),
		feeds: (Array.isArray(d.feeds) ? d.feeds : []).map((f) => {
			const r = f as Record<string, unknown>;
			return { source: str(r.source), items: num(r.items), error: str(r.error) || undefined };
		}),
	};
}

// ---------- Public (cached) ----------
const safe = async <T,>(read: () => Promise<T>, empty: T): Promise<T> => {
	if (storeMode() === 'none') return empty;
	try {
		return await read();
	} catch (err) {
		console.error('content read failed:', err instanceof Error ? err.message : err);
		return empty;
	}
};

export const getPublishedPosts = unstable_cache(
	async () => safe(async () => (await listPosts()).filter((p) => p.status === 'published' && p.slug), [] as Post[]),
	['cms-posts'],
	{ tags: [TAGS.posts], revalidate: 3600 },
);

export async function getPost(slug: string): Promise<Post | null> {
	return (await getPublishedPosts()).find((p) => p.slug === slug) || null;
}

export const getPublishedProducts = unstable_cache(
	async () => safe(async () => (await listProducts()).filter((p) => p.status === 'published' && p.slug), [] as Product[]),
	['cms-products'],
	{ tags: [TAGS.products], revalidate: 3600 },
);

export async function getProduct(slug: string): Promise<Product | null> {
	return (await getPublishedProducts()).find((p) => p.slug === slug) || null;
}

/** The latest top-10 edition: pinned stories first, hidden ones left out. */
export const getNewsEdition = unstable_cache(
	async () =>
		safe(async () => {
			const visible = (await listNews()).filter((n) => !n.hidden);
			const day = visible.find((n) => !n.pinned)?.day || visible[0]?.day || '';
			const pinned = visible.filter((n) => n.pinned);
			const today = visible.filter((n) => !n.pinned && n.day === day).sort((a, b) => a.rank - b.rank);
			return { day, items: [...pinned, ...today].slice(0, 10) };
		}, { day: '', items: [] as NewsItem[] }),
	['cms-news'],
	{ tags: [TAGS.news], revalidate: 3600 },
);
