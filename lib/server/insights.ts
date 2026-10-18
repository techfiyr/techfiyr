/*
 * Data for the admin dashboard (server only): visitors, Google Search Console performance and
 * indexing, Google Analytics 4, and IndexNow pings to Bing and other IndexNow engines.
 *
 * Every source is optional. A missing setting shows as "not connected" on the dashboard with the
 * steps to connect it (AGENTS.md section 7.8), never as an error. Google results are cached for
 * an hour (URL inspections for six) to stay far inside the API quotas.
 *
 * Settings: GSC_SITE_URL (e.g. sc-domain:techfiyr.com), GA4_PROPERTY_ID (numbers only),
 * INDEXNOW_KEY (8-128 letters, digits or dashes). The service account must be added as a user
 * in Search Console and as a Viewer in Google Analytics.
 */
import { unstable_cache } from 'next/cache';
import { SITE_URL } from '@/lib/site';
import { GoogleError, SCOPES, accessToken, env, googleError, hasServiceAccount } from './google';
import { store, storeMode } from './store';

export type Source<T> = { status: 'ok'; data: T } | { status: 'off'; reason: string } | { status: 'error'; reason: string };

const fail = (err: unknown): Source<never> => ({
	status: 'error',
	reason: err instanceof GoogleError ? `${err.detail}`.slice(0, 240) : err instanceof Error ? err.message : 'Request failed',
});

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => isoDay(new Date(Date.now() - n * 864e5));

// ---------- Visitors (Firestore stats written by netlify/functions/visits.mjs) ----------
export type Visitors = { total: number; countries: { code: string; count: number }[]; daily: { day: string; count: number }[] };

export async function visitors(): Promise<Source<Visitors>> {
	if (storeMode() === 'none') return { status: 'off', reason: 'Firebase service account not configured' };
	try {
		const totals = await store.get('stats', 'visits');
		const countriesMap = (totals?.countries || {}) as Record<string, number>;
		const months = [...new Set(Array.from({ length: 30 }, (_, i) => daysAgo(i).slice(0, 7)))];
		const monthDocs = await Promise.all(months.map((m) => store.get('stats', `daily-${m}`)));
		const daily = Array.from({ length: 30 }, (_, i) => {
			const day = daysAgo(29 - i);
			const doc = monthDocs[months.indexOf(day.slice(0, 7))];
			return { day, count: Number((doc as Record<string, unknown> | null)?.[`d${day.slice(8)}`] || 0) };
		});
		return {
			status: 'ok',
			data: {
				total: Number(totals?.total || 0),
				countries: Object.entries(countriesMap)
					.map(([code, count]) => ({ code, count: Number(count) || 0 }))
					.sort((a, b) => b.count - a.count),
				daily,
			},
		};
	} catch (err) {
		return fail(err);
	}
}

// ---------- Google Search Console ----------
export type SearchPerformance = {
	totals: { clicks: number; impressions: number; ctr: number; position: number };
	daily: { day: string; clicks: number; impressions: number }[];
	queries: { query: string; clicks: number; impressions: number; position: number }[];
	pages: { page: string; clicks: number; impressions: number }[];
	sitemaps: { path: string; lastDownloaded: string; errors: number; warnings: number; submitted: number }[];
};

const gscSite = () => env('GSC_SITE_URL');
const gscBase = () => `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSite())}`;

async function gsc<T>(path: string, body?: object): Promise<T> {
	const token = await accessToken(SCOPES.searchConsole);
	const res = await fetch(gscBase() + path, {
		method: body ? 'POST' : 'GET',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
		cache: 'no-store',
	});
	if (!res.ok) throw new GoogleError('search-console', res.status, await googleError(res));
	return res.json() as Promise<T>;
}

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

const readSearch = unstable_cache(
	async (): Promise<SearchPerformance> => {
		// Search Console data lags about two days behind
		const range = { startDate: daysAgo(30), endDate: daysAgo(2) };
		const [total, byDay, byQuery, byPage, maps] = await Promise.all([
			gsc<{ rows?: Row[] }>('/searchAnalytics/query', { ...range }),
			gsc<{ rows?: Row[] }>('/searchAnalytics/query', { ...range, dimensions: ['date'] }),
			gsc<{ rows?: Row[] }>('/searchAnalytics/query', { ...range, dimensions: ['query'], rowLimit: 10 }),
			gsc<{ rows?: Row[] }>('/searchAnalytics/query', { ...range, dimensions: ['page'], rowLimit: 10 }),
			gsc<{ sitemap?: { path: string; lastDownloaded?: string; errors?: string; warnings?: string; contents?: { submitted?: string }[] }[] }>('/sitemaps'),
		]);
		const t = total.rows?.[0];
		return {
			totals: { clicks: t?.clicks || 0, impressions: t?.impressions || 0, ctr: t?.ctr || 0, position: t?.position || 0 },
			daily: (byDay.rows || []).map((r) => ({ day: r.keys?.[0] || '', clicks: r.clicks, impressions: r.impressions })),
			queries: (byQuery.rows || []).map((r) => ({ query: r.keys?.[0] || '', clicks: r.clicks, impressions: r.impressions, position: r.position })),
			pages: (byPage.rows || []).map((r) => ({ page: r.keys?.[0] || '', clicks: r.clicks, impressions: r.impressions })),
			sitemaps: (maps.sitemap || []).map((s) => ({
				path: s.path,
				lastDownloaded: s.lastDownloaded || '',
				errors: Number(s.errors || 0),
				warnings: Number(s.warnings || 0),
				submitted: (s.contents || []).reduce((n, c) => n + Number(c.submitted || 0), 0),
			})),
		};
	},
	['admin-search-performance'],
	{ revalidate: 3600 },
);

export async function searchPerformance(): Promise<Source<SearchPerformance>> {
	if (!hasServiceAccount()) return { status: 'off', reason: 'Firebase service account not configured' };
	if (!gscSite()) return { status: 'off', reason: 'GSC_SITE_URL not set' };
	try {
		return { status: 'ok', data: await readSearch() };
	} catch (err) {
		return fail(err);
	}
}

export type Inspection = { url: string; verdict: string; coverage: string; lastCrawl: string; error?: string };

const inspectOne = unstable_cache(
	async (url: string): Promise<Inspection> => {
		const token = await accessToken(SCOPES.searchConsole);
		const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ inspectionUrl: url, siteUrl: gscSite() }),
			cache: 'no-store',
		});
		if (!res.ok) return { url, verdict: '', coverage: '', lastCrawl: '', error: (await googleError(res)).slice(0, 160) };
		const r = ((await res.json()) as { inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } } }).inspectionResult?.indexStatusResult || {};
		return { url, verdict: r.verdict || '', coverage: r.coverageState || '', lastCrawl: r.lastCrawlTime || '' };
	},
	['admin-url-inspection'],
	{ revalidate: 6 * 3600 },
);

/** Google's index status for each URL (URL Inspection API, 2,000 checks a day). */
export async function indexStatus(urls: string[]): Promise<Source<Inspection[]>> {
	if (!hasServiceAccount()) return { status: 'off', reason: 'Firebase service account not configured' };
	if (!gscSite()) return { status: 'off', reason: 'GSC_SITE_URL not set' };
	try {
		const out: Inspection[] = [];
		// a few at a time: the API allows about 600 checks a minute
		for (let i = 0; i < urls.length; i += 5) out.push(...(await Promise.all(urls.slice(i, i + 5).map((u) => inspectOne(u)))));
		return { status: 'ok', data: out };
	} catch (err) {
		return fail(err);
	}
}

// ---------- Google Analytics 4 ----------
export type Analytics = {
	totals: { users: number; sessions: number; views: number; engagement: number };
	pages: { path: string; views: number }[];
	sources: { source: string; sessions: number }[];
};

type GaReport = { rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] };

async function ga(body: object): Promise<GaReport> {
	const token = await accessToken(SCOPES.analytics);
	const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env('GA4_PROPERTY_ID')}:runReport`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }], ...body }),
		cache: 'no-store',
	});
	if (!res.ok) throw new GoogleError('analytics', res.status, await googleError(res));
	return res.json() as Promise<GaReport>;
}

const readAnalytics = unstable_cache(
	async (): Promise<Analytics> => {
		const [totals, pages, sources] = await Promise.all([
			ga({ metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'engagementRate' }] }),
			ga({ dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], limit: 8, orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }] }),
			ga({ dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], limit: 6, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
		]);
		const m = totals.rows?.[0]?.metricValues || [];
		return {
			totals: { users: Number(m[0]?.value || 0), sessions: Number(m[1]?.value || 0), views: Number(m[2]?.value || 0), engagement: Number(m[3]?.value || 0) },
			pages: (pages.rows || []).map((r) => ({ path: r.dimensionValues?.[0]?.value || '', views: Number(r.metricValues?.[0]?.value || 0) })),
			sources: (sources.rows || []).map((r) => ({ source: r.dimensionValues?.[0]?.value || '', sessions: Number(r.metricValues?.[0]?.value || 0) })),
		};
	},
	['admin-analytics'],
	{ revalidate: 3600 },
);

export async function analytics(): Promise<Source<Analytics>> {
	if (!hasServiceAccount()) return { status: 'off', reason: 'Firebase service account not configured' };
	if (!/^\d+$/.test(env('GA4_PROPERTY_ID'))) return { status: 'off', reason: 'GA4_PROPERTY_ID not set' };
	try {
		return { status: 'ok', data: await readAnalytics() };
	} catch (err) {
		return fail(err);
	}
}

// ---------- IndexNow (Bing, Yandex, Seznam, Naver…) ----------
export const indexNowKey = () => (/^[a-zA-Z0-9-]{8,128}$/.test(env('INDEXNOW_KEY')) ? env('INDEXNOW_KEY') : '');

/** Tell IndexNow engines that these pages changed. Only runs on the production site. */
export async function pingIndexNow(paths: string[]): Promise<void> {
	const key = indexNowKey();
	if (!key || process.env.NODE_ENV !== 'production' || process.env.CONTEXT === 'deploy-preview') return;
	const host = new URL(SITE_URL).host;
	try {
		await fetch('https://api.indexnow.org/indexnow', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify({ host, key, keyLocation: `${SITE_URL}/indexnow-key.txt`, urlList: paths.map((p) => SITE_URL + p) }),
			cache: 'no-store',
			signal: AbortSignal.timeout(8000),
		});
	} catch (err) {
		console.error('IndexNow ping failed:', err instanceof Error ? err.message : err);
	}
}
