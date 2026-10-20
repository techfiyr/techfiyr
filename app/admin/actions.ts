'use server';

/*
 * Server actions for the admin panel. Every action checks the admin session first
 * (requireAdmin), validates its input, writes through lib/server/store.ts and then refreshes the
 * public pages that show the content (updateTag for the cached data, revalidatePath for the
 * pages, an IndexNow ping for Bing and other engines).
 */
import { randomUUID } from 'node:crypto';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { AUTHORS, postPath, productPath, slugify, type Status } from '@/lib/content';
import { checkPassword, endSession, requireAdmin, startSession } from '@/lib/server/auth';
import { TAGS, listPosts, listProducts, toPost, toProduct } from '@/lib/server/content';
import { pingIndexNow } from '@/lib/server/insights';
import { saveImage } from '@/lib/server/media';
import { refreshNews } from '@/lib/server/news';
import { store } from '@/lib/server/store';
import { generateBlogWithGemini, type GeneratedBlogPost } from '@/lib/server/gemini';

export type FormState = { error?: string; fields?: Record<string, string> } | undefined;

const text = (fd: FormData, key: string, max = 300) => String(fd.get(key) ?? '').trim().slice(0, max);
const lines = (fd: FormData, key: string, max = 40) =>
	String(fd.get(key) ?? '')
		.split(/\r?\n|,/)
		.map((s) => s.trim())
		.filter(Boolean)
		.slice(0, max);
const statusOf = (fd: FormData): Status => (fd.get('status') === 'published' ? 'published' : 'draft');
const echo = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === 'string' && !k.startsWith('$')).map(([k, v]) => [k, String(v)]));

async function upload(fd: FormData, key: string, folder: 'blog' | 'products'): Promise<string> {
	const file = fd.get(key);
	if (!(file instanceof File) || !file.size) return '';
	return saveImage(file, folder);
}

function refresh(tag: string, paths: string[]) {
	updateTag(tag);
	for (const p of paths) revalidatePath(p);
	revalidatePath('/sitemap.xml');
}

// ---------- Session ----------
export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
	const email = text(fd, 'email', 200);
	const result = await checkPassword(email, String(fd.get('password') ?? ''));
	if (!result.ok) {
		// a short pause makes password guessing slower
		await new Promise((r) => setTimeout(r, 700));
		return { error: result.error, fields: { email } };
	}
	await startSession(result.email);
	const next = text(fd, 'next', 200);
	redirect(/^\/admin(\/[a-z0-9/-]*)?$/.test(next) ? next : '/admin');
}

export async function logout() {
	await endSession();
	redirect('/admin/login');
}

// ---------- Blog ----------
export async function savePost(_prev: FormState, fd: FormData): Promise<FormState> {
	await requireAdmin();
	const id = text(fd, 'id', 60) || randomUUID();
	const existing = await store.get('posts', id);
	const before = existing ? toPost(existing) : null;

	const title = text(fd, 'title', 160);
	const slug = slugify(text(fd, 'slug', 100) || title);
	const excerpt = text(fd, 'excerpt', 400);
	const body = String(fd.get('body') ?? '').trim().slice(0, 100_000);
	const status = statusOf(fd);
	const author = AUTHORS.some((a) => a.name === text(fd, 'author')) ? text(fd, 'author') : AUTHORS[0].name;

	if (!title) return { error: 'Add a title.', fields: echo(fd) };
	if (!slug) return { error: 'The address (slug) needs at least one letter or number.', fields: echo(fd) };
	if (status === 'published' && !excerpt) return { error: 'Add a short summary before publishing: it is the card text and the search snippet.', fields: echo(fd) };
	if (status === 'published' && body.length < 200) return { error: 'The article is too short to publish (200 characters at least).', fields: echo(fd) };
	if ((await listPosts()).some((p) => p.slug === slug && p.id !== id)) return { error: `Another post already uses the address /blog/${slug}.`, fields: echo(fd) };

	let coverUrl = text(fd, 'coverUrl', 500);
	try {
		coverUrl = (await upload(fd, 'coverFile', 'blog')) || coverUrl;
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'The image could not be uploaded.', fields: echo(fd) };
	}
	if (fd.get('removeCover') === 'on') coverUrl = '';

	const now = new Date().toISOString();
	const publishedAt = status === 'published' ? before?.publishedAt || text(fd, 'publishedAt', 40) || now : before?.publishedAt || '';
	await store.put('posts', id, {
		slug,
		title,
		excerpt,
		body,
		coverUrl,
		coverAlt: text(fd, 'coverAlt', 200) || title,
		tags: lines(fd, 'tags', 12),
		author,
		status,
		seoTitle: text(fd, 'seoTitle', 70),
		seoDescription: text(fd, 'seoDescription', 170),
		publishedAt,
		createdAt: before?.createdAt || now,
		updatedAt: now,
	});

	const paths = ['/blog', postPath({ slug })];
	if (before && before.slug !== slug) paths.push(postPath(before));
	refresh(TAGS.posts, paths);
	if (status === 'published' || before?.status === 'published') await pingIndexNow(paths);
	redirect(`/admin/blog/${id}?saved=1`);
}

export async function deletePost(fd: FormData) {
	await requireAdmin();
	const id = text(fd, 'id', 60);
	const doc = await store.get('posts', id);
	if (doc) {
		await store.remove('posts', id);
		const p = toPost(doc);
		refresh(TAGS.posts, ['/blog', postPath(p)]);
		if (p.status === 'published') await pingIndexNow(['/blog', postPath(p)]);
	}
	redirect('/admin/blog?deleted=1');
}

export async function generatePostWithAi(
	topic: string,
	author?: string
): Promise<{ ok: true; post: GeneratedBlogPost } | { ok: false; error: string }> {
	await requireAdmin();
	return generateBlogWithGemini(topic, author);
}

// ---------- Products ----------
export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
	await requireAdmin();
	const id = text(fd, 'id', 60) || randomUUID();
	const existing = await store.get('products', id);
	const before = existing ? toProduct(existing) : null;

	const name = text(fd, 'name', 120);
	const slug = slugify(text(fd, 'slug', 100) || name);
	const tagline = text(fd, 'tagline', 200);
	const description = String(fd.get('description') ?? '').trim().slice(0, 50_000);
	const status = statusOf(fd);

	if (!name) return { error: 'Add the product name.', fields: echo(fd) };
	if (!slug) return { error: 'The address (slug) needs at least one letter or number.', fields: echo(fd) };
	if (status === 'published' && !tagline) return { error: 'Add a one-line tagline before publishing.', fields: echo(fd) };
	if ((await listProducts()).some((p) => p.slug === slug && p.id !== id)) return { error: `Another product already uses the address /products/${slug}.`, fields: echo(fd) };

	const links = [1, 2, 3]
		.map((n) => ({ label: text(fd, `linkLabel${n}`, 40), url: text(fd, `linkUrl${n}`, 500) }))
		.filter((l) => l.label && l.url);
	const badLink = links.find((l) => !/^https:\/\//.test(l.url));
	if (badLink) return { error: `The "${badLink.label}" link must start with https://`, fields: echo(fd) };

	let coverUrl = text(fd, 'coverUrl', 500);
	let gallery = lines(fd, 'gallery', 12).filter((g) => g.startsWith('/media/') || g.startsWith('/assets/') || g.startsWith('https://'));
	try {
		coverUrl = (await upload(fd, 'coverFile', 'products')) || coverUrl;
		for (const f of fd.getAll('galleryFiles')) {
			if (f instanceof File && f.size) gallery.push(await saveImage(f, 'products'));
		}
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'The image could not be uploaded.', fields: echo(fd) };
	}
	if (fd.get('removeCover') === 'on') coverUrl = '';
	gallery = gallery.slice(0, 12);

	const now = new Date().toISOString();
	const order = Number.parseInt(text(fd, 'order', 6), 10);
	await store.put('products', id, {
		slug,
		name,
		tagline,
		description,
		category: text(fd, 'category', 60),
		platforms: lines(fd, 'platforms', 8),
		price: text(fd, 'price', 60),
		features: lines(fd, 'features', 16).map((f) => f.slice(0, 160)),
		coverUrl,
		coverAlt: text(fd, 'coverAlt', 200) || name,
		gallery,
		links,
		status,
		order: Number.isFinite(order) ? order : 100,
		seoTitle: text(fd, 'seoTitle', 70),
		seoDescription: text(fd, 'seoDescription', 170),
		createdAt: before?.createdAt || now,
		updatedAt: now,
	});

	const paths = ['/products', productPath({ slug })];
	if (before && before.slug !== slug) paths.push(productPath(before));
	refresh(TAGS.products, paths);
	if (status === 'published' || before?.status === 'published') await pingIndexNow(paths);
	redirect(`/admin/products/${id}?saved=1`);
}

export async function deleteProduct(fd: FormData) {
	await requireAdmin();
	const id = text(fd, 'id', 60);
	const doc = await store.get('products', id);
	if (doc) {
		await store.remove('products', id);
		const p = toProduct(doc);
		refresh(TAGS.products, ['/products', productPath(p)]);
		if (p.status === 'published') await pingIndexNow(['/products', productPath(p)]);
	}
	redirect('/admin/products?deleted=1');
}

// ---------- AI news ----------
export async function fetchNewsNow() {
	await requireAdmin();
	const run = await refreshNews();
	refresh(TAGS.news, ['/news']);
	if (run.stored) await pingIndexNow(['/news']);
	redirect(`/admin/news?fetched=${run.stored}`);
}

export async function updateNews(fd: FormData) {
	await requireAdmin();
	const id = text(fd, 'id', 60);
	const action = text(fd, 'action', 20);
	const doc = await store.get('news', id);
	if (doc) {
		if (action === 'delete') await store.remove('news', id);
		else if (action === 'hide' || action === 'show') await store.put('news', id, { ...doc, hidden: action === 'hide' });
		else if (action === 'pin' || action === 'unpin') await store.put('news', id, { ...doc, pinned: action === 'pin' });
		refresh(TAGS.news, ['/news']);
	}
	redirect('/admin/news');
}

// ---------- Images inside articles ----------
export type UploadState = { url?: string; error?: string } | undefined;

export async function uploadInlineImage(_prev: UploadState, fd: FormData): Promise<UploadState> {
	await requireAdmin();
	const folder = fd.get('folder') === 'products' ? 'products' : 'blog';
	try {
		const url = await upload(fd, 'file', folder);
		return url ? { url } : { error: 'Choose an image first.' };
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'The image could not be uploaded.' };
	}
}
