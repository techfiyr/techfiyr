/*
 * Daily AI news (server only): reads the AI feeds of leading publishers and AI labs, picks the
 * top 10 stories of the day and stores them in the "news" collection. Run once a day by the
 * scheduled function netlify/functions/news-daily.mjs (through app/api/news/refresh/route.ts),
 * or from the admin panel with "Fetch now".
 *
 * What is stored and shown: the headline, the publisher, the date, the feed's own short summary
 * and a link to the original article. Article text and images are never copied, and the public
 * page loads nothing from the publishers (no third-party requests before consent).
 *
 * Picking the top 10: stories from the last 36 hours (widening to 7 days on a quiet day), newest
 * first, at most two per publisher, near-duplicate headlines across publishers counted once, and
 * stories already shown on an earlier day skipped.
 */
import { createHash } from 'node:crypto';
import type { NewsItem, NewsRun } from '@/lib/content';
import { store } from './store';

export const FEEDS = [
	{ source: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
	{ source: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
	{ source: 'MIT Technology Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' },
	{ source: 'Ars Technica', url: 'https://arstechnica.com/ai/feed/' },
	{ source: 'WIRED', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
	{ source: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
	{ source: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
	{ source: 'Google AI', url: 'https://blog.google/technology/ai/rss/' },
];

const PER_SOURCE = 2;
const EDITION_SIZE = 10;
const KEEP_DAYS = 30;
const USER_AGENT = 'TechFiyrNewsBot/1.0 (+https://techfiyr.com/news)';

type FeedItem = Omit<NewsItem, 'id' | 'fetchedAt' | 'day' | 'rank' | 'hidden' | 'pinned'>;

// ---------- Tiny RSS / Atom reader ----------
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };

function decodeEntities(s: string): string {
	return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
		if (e[0] === '#') {
			const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : m;
		}
		return ENTITIES[e.toLowerCase()] ?? m;
	});
}

const unwrap = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

/** Text inside the first <tag>…</tag> (namespaced names like media:content are allowed). */
function tagText(xml: string, tag: string): string {
	const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(xml);
	return m ? unwrap(m[1]).trim() : '';
}

function attr(xml: string, tag: string, name: string, where?: RegExp): string {
	const re = new RegExp(`<${tag}\\b([^>]*)/?>`, 'gi');
	let m: RegExpExecArray | null;
	while ((m = re.exec(xml))) {
		if (where && !where.test(m[1])) continue;
		const a = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(m[1]);
		if (a) return decodeEntities(a[1]);
	}
	return '';
}

function plain(html: string, max: number): string {
	const text = decodeEntities(decodeEntities(unwrap(html)).replace(/<[^>]+>/g, ' '))
		.replace(/\s+/g, ' ')
		.replace(/\s*\[(…|&#8230;|\.\.\.)\]\s*$/, '…')
		.trim();
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).replace(/[,.;:\s]+$/, '')}…`;
}

function parseFeed(xml: string, source: string): FeedItem[] {
	const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
	return blocks.slice(0, 40).map((b) => {
		const link = tagText(b, 'link') || attr(b, 'link', 'href', /rel\s*=\s*"alternate"|type\s*=\s*"text\/html"/i) || attr(b, 'link', 'href');
		const date = tagText(b, 'pubDate') || tagText(b, 'published') || tagText(b, 'updated') || tagText(b, 'dc:date');
		const parsed = new Date(date);
		const summary = tagText(b, 'description') || tagText(b, 'summary') || tagText(b, 'content');
		const image =
			attr(b, 'media:content', 'url', /medium\s*=\s*"image"|type\s*=\s*"image/i) ||
			attr(b, 'media:thumbnail', 'url') ||
			attr(b, 'enclosure', 'url', /type\s*=\s*"image/i) ||
			(/<img[^>]+src="([^"]+)"/i.exec(decodeEntities(unwrap(summary + tagText(b, 'content'))))?.[1] ?? '');
		return {
			title: plain(tagText(b, 'title'), 200),
			url: decodeEntities(link.trim()),
			source,
			summary: plain(summary, 240),
			imageUrl: /^https:\/\//.test(image) ? image : '',
			publishedAt: Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString(),
		};
	}).filter((i) => i.title && /^https?:\/\//.test(i.url) && i.publishedAt);
}

async function readFeed(feed: (typeof FEEDS)[number]): Promise<{ items: FeedItem[]; error?: string }> {
	try {
		const res = await fetch(feed.url, {
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
			cache: 'no-store',
			signal: AbortSignal.timeout(12000),
		});
		if (!res.ok) return { items: [], error: `HTTP ${res.status}` };
		const items = parseFeed(await res.text(), feed.source);
		return items.length ? { items } : { items, error: 'no stories in the feed' };
	} catch (err) {
		return { items: [], error: err instanceof Error ? err.message : 'request failed' };
	}
}

// ---------- Picking the edition ----------
const idOf = (url: string) => createHash('sha1').update(url.replace(/[?#].*$/, '').replace(/\/$/, '')).digest('hex').slice(0, 24);

// first six significant words: catches the same story told by two publishers
const STOP = new Set(['the', 'a', 'an', 'to', 'of', 'and', 'in', 'on', 'for', 'is', 'its', 'with', 'as', 'at', 'by', 'it', 'that', 'this', 'from', 'says']);
const fingerprint = (title: string) =>
	title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).slice(0, 6).sort().join(' ');

/** Today's date in Dhaka, YYYY-MM-DD: the edition's day. */
export const editionDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

export function pickEdition(items: FeedItem[], alreadyShown: Set<string>, now = Date.now()): FeedItem[] {
	const sorted = [...items].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
	for (const windowHours of [36, 72, 168]) {
		const chosen: FeedItem[] = [];
		const perSource = new Map<string, number>();
		const seen = new Set<string>();
		for (const item of sorted) {
			if (now - new Date(item.publishedAt).getTime() > windowHours * 3600e3) continue;
			if (alreadyShown.has(idOf(item.url))) continue;
			const fp = fingerprint(item.title);
			if (seen.has(fp) || (perSource.get(item.source) || 0) >= PER_SOURCE) continue;
			seen.add(fp);
			perSource.set(item.source, (perSource.get(item.source) || 0) + 1);
			chosen.push(item);
			if (chosen.length === EDITION_SIZE) return chosen;
		}
		if (windowHours === 168) return chosen;
	}
	return [];
}

/** Fetch every feed, store today's top 10 and record the run. */
export async function refreshNews(): Promise<NewsRun> {
	const results = await Promise.all(FEEDS.map(readFeed));
	const all = results.flatMap((r) => r.items);
	const day = editionDay();
	const now = new Date().toISOString();

	const existing = await store.list('news');
	const byId = new Map(existing.map((d) => [d.id, d]));
	const shownBefore = new Set(existing.filter((d) => d.day !== day).map((d) => d.id));

	const edition = pickEdition(all, shownBefore);
	// a second run on the same day replaces that day's edition, keeping pinned and hidden choices
	for (const d of existing) {
		if (d.day === day && !d.pinned && !edition.some((e) => idOf(e.url) === d.id)) await store.remove('news', d.id);
	}
	let rank = 1;
	for (const item of edition) {
		const id = idOf(item.url);
		const prev = byId.get(id);
		await store.put('news', id, {
			...item,
			fetchedAt: now,
			day,
			rank: rank++,
			hidden: prev?.hidden === true,
			pinned: prev?.pinned === true,
		});
	}

	// keep a month of history; pinned stories stay until they are unpinned
	const cutoff = editionDay(new Date(Date.now() - KEEP_DAYS * 864e5));
	for (const d of existing) if (!d.pinned && typeof d.day === 'string' && d.day < cutoff) await store.remove('news', d.id);

	const run: NewsRun = {
		ranAt: now,
		ok: edition.length > 0,
		stored: edition.length,
		feeds: FEEDS.map((f, i) => ({ source: f.source, items: results[i].items.length, ...(results[i].error ? { error: results[i].error } : {}) })),
	};
	await store.put('meta', 'news-run', run);
	return run;
}
