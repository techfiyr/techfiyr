/*
 * /admin: the dashboard. Visitors (the site's own counter), Google Search Console performance and
 * index status per page, Google Analytics 4, content at a glance and the setup checklist.
 * Each Google section streams in on its own, so a slow API never holds up the rest.
 * Data: lib/server/insights.ts and lib/server/content.ts.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import sitemap from '@/app/sitemap';
import { BarChart, Chip, NotConnected, PageHead, Panel, SourceError, Stat, dayLabel, fmt, pct, timeAgo } from '@/components/admin/ui';
import { formatDate } from '@/lib/content';
import { lastNewsRun, listNews, listPosts, listProducts } from '@/lib/server/content';
import { env, hasServiceAccount } from '@/lib/server/google';
import { analytics, indexNowKey, indexStatus, searchPerformance, visitors } from '@/lib/server/insights';
import { editionDay } from '@/lib/server/news';
import { adminEmails } from '@/lib/server/session';
import { storeMode } from '@/lib/server/store';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = { title: 'Dashboard' };

const regionName = (() => {
	const names = new Intl.DisplayNames(['en'], { type: 'region' });
	return (code: string) => {
		try {
			return code === 'XX' ? 'Unknown' : names.of(code) || code;
		} catch {
			return code;
		}
	};
})();

const shortPath = (url: string) => url.replace(SITE_URL, '') || '/';

function Skeleton({ title, wide }: { title: string; wide?: boolean }) {
	return (
		<Panel title={title} wide={wide}>
			<div className="admin-skeleton" aria-hidden="true">
				<span></span>
				<span></span>
				<span></span>
			</div>
			<p className="sr-only">Loading {title.toLowerCase()}…</p>
		</Panel>
	);
}

// ---------- Content at a glance ----------
async function ContentPanel() {
	const [posts, products, news, run] = await Promise.all([listPosts(), listProducts(), listNews(), lastNewsRun()]);
	const today = editionDay();
	const published = posts.filter((p) => p.status === 'published').length;
	const liveProducts = products.filter((p) => p.status === 'published').length;
	const todayNews = news.filter((n) => n.day === today && !n.hidden).length;

	return (
		<Panel title="Content" meta={<Link href="/admin/blog/new">New post</Link>}>
			<dl className="admin-stats is-three">
				<Stat label="Blog posts" value={fmt(published)} note={`${posts.length - published} draft${posts.length - published === 1 ? '' : 's'}`} />
				<Stat label="Products" value={fmt(liveProducts)} note={`${products.length - liveProducts} draft${products.length - liveProducts === 1 ? '' : 's'}`} />
				<Stat label="AI news today" value={`${todayNews}/10`} note={run ? `fetched ${timeAgo(run.ranAt)}` : 'not fetched yet'} />
			</dl>
			{run && !run.ok && (
				<p className="admin-alert is-error">
					<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> The last news fetch found no stories. <Link href="/admin/news">See which feeds failed</Link>
				</p>
			)}
			<ul className="admin-quick">
				<li><Link className="admin-btn is-quiet" href="/admin/blog/new"><i className="fa-solid fa-pen" aria-hidden="true"></i> Write a post</Link></li>
				<li><Link className="admin-btn is-quiet" href="/admin/products/new"><i className="fa-solid fa-plus" aria-hidden="true"></i> Add a product</Link></li>
				<li><Link className="admin-btn is-quiet" href="/admin/news"><i className="fa-solid fa-newspaper" aria-hidden="true"></i> Manage AI news</Link></li>
			</ul>
		</Panel>
	);
}

// ---------- Visitors ----------
async function VisitorsPanel() {
	const v = await visitors();
	if (v.status !== 'ok') {
		return (
			<Panel title="Visitors" wide>
				{v.status === 'off' ? (
					<NotConnected what="The visitor counter" reason={v.reason} steps={<p>Add the Firebase service account variables to Netlify (AGENTS.md section 7.6). Counts start with the next visit.</p>} />
				) : (
					<SourceError what="Visitors" reason={v.reason} />
				)}
			</Panel>
		);
	}
	const { total, countries, daily } = v.data;
	const month = daily.reduce((n, d) => n + d.count, 0);
	const today = daily[daily.length - 1]?.count || 0;
	const week = daily.slice(-7).reduce((n, d) => n + d.count, 0);
	const countryTotal = countries.reduce((n, c) => n + c.count, 0) || 1;

	return (
		<Panel title="Visitors" meta="Unique visitors per day, counted by the site itself" wide id="visitors">
			<dl className="admin-stats">
				<Stat label="Today" value={fmt(today)} />
				<Stat label="Last 7 days" value={fmt(week)} />
				<Stat label="Last 30 days" value={fmt(month)} />
				<Stat label="All time" value={fmt(total)} />
			</dl>
			<div className="admin-split">
				<BarChart label="Unique visitors per day, last 30 days" unit="visitors" data={daily.map((d) => ({ label: dayLabel(d.day, 'long'), short: dayLabel(d.day), value: d.count }))} />
				<div>
					<h3 className="admin-subhead">Top countries</h3>
					{countries.length ? (
						<ol className="admin-bars">
							{countries.slice(0, 6).map((c) => (
								<li key={c.code}>
									<span className="admin-bars_label">{regionName(c.code)}</span>
									<span className="admin-bars_value">{fmt(c.count)}</span>
									<span className="admin-bars_track" aria-hidden="true">
										<span style={{ width: `${(c.count / countryTotal) * 100}%` }}></span>
									</span>
								</li>
							))}
						</ol>
					) : (
						<p className="admin-muted">No visits counted yet.</p>
					)}
				</div>
			</div>
		</Panel>
	);
}

// ---------- Google Search ----------
const gscSteps = (
	<ol>
		<li>In Google Search Console, open the techfiyr.com property, then Settings → Users and permissions → Add user.</li>
		<li>Add the service account&apos;s email (FIREBASE_CLIENT_EMAIL) with Restricted permission.</li>
		<li>In Netlify, set <code>GSC_SITE_URL</code> to <code>sc-domain:techfiyr.com</code> (or <code>https://techfiyr.com/</code> for a URL-prefix property).</li>
	</ol>
);

async function SearchPanel() {
	const s = await searchPerformance();
	if (s.status !== 'ok') {
		return (
			<Panel title="Google Search" wide>
				{s.status === 'off' ? <NotConnected what="Google Search Console" reason={s.reason} steps={gscSteps} /> : <SourceError what="Search Console" reason={s.reason} />}
			</Panel>
		);
	}
	const { totals, daily, queries, pages } = s.data;
	return (
		<Panel title="Google Search" meta="Last 28 days, Search Console (about two days behind)" wide id="search">
			<dl className="admin-stats">
				<Stat label="Clicks" value={fmt(totals.clicks)} />
				<Stat label="Impressions" value={fmt(totals.impressions)} />
				<Stat label="Click-through rate" value={pct(totals.ctr)} />
				<Stat label="Average position" value={totals.position ? totals.position.toFixed(1) : '–'} />
			</dl>
			{daily.length > 0 && <BarChart label="Clicks from Google Search per day" unit="clicks" data={daily.map((d) => ({ label: dayLabel(d.day, 'long'), short: dayLabel(d.day), value: d.clicks }))} />}
			<div className="admin-split is-even">
				<div>
					<h3 className="admin-subhead">Top searches</h3>
					{queries.length ? (
						<table className="admin-table is-compact">
							<thead><tr><th scope="col">Query</th><th scope="col" className="is-num">Clicks</th><th scope="col" className="is-num">Shown</th><th scope="col" className="is-num">Position</th></tr></thead>
							<tbody>
								{queries.map((q) => (
									<tr key={q.query}><td>{q.query}</td><td className="is-num">{fmt(q.clicks)}</td><td className="is-num">{fmt(q.impressions)}</td><td className="is-num">{q.position.toFixed(1)}</td></tr>
								))}
							</tbody>
						</table>
					) : <p className="admin-muted">No searches recorded yet. New sites usually appear within a few weeks.</p>}
				</div>
				<div>
					<h3 className="admin-subhead">Top pages</h3>
					{pages.length ? (
						<table className="admin-table is-compact">
							<thead><tr><th scope="col">Page</th><th scope="col" className="is-num">Clicks</th><th scope="col" className="is-num">Shown</th></tr></thead>
							<tbody>
								{pages.map((p) => (
									<tr key={p.page}><td><a href={p.page} target="_blank" rel="noopener">{shortPath(p.page)}<span className="sr-only">{' '}(opens in a new tab)</span></a></td><td className="is-num">{fmt(p.clicks)}</td><td className="is-num">{fmt(p.impressions)}</td></tr>
								))}
							</tbody>
						</table>
					) : <p className="admin-muted">No pages have search clicks yet.</p>}
				</div>
			</div>
		</Panel>
	);
}

// ---------- Indexing ----------
const VERDICT: Record<string, { tone: 'good' | 'warn' | 'neutral'; text: string }> = {
	PASS: { tone: 'good', text: 'Indexed' },
	PARTIAL: { tone: 'warn', text: 'Indexed, with issues' },
	FAIL: { tone: 'warn', text: 'Not indexed' },
	NEUTRAL: { tone: 'neutral', text: 'Not indexed' },
};

async function IndexingPanel() {
	const urls = (await sitemap()).map((e) => e.url);
	const [result, perf] = await Promise.all([indexStatus(urls), searchPerformance()]);
	const key = indexNowKey();
	const maps = perf.status === 'ok' ? perf.data.sitemaps : [];

	return (
		<Panel title="Search engine indexing" meta={`${urls.length} pages in the sitemap`} wide id="indexing">
			<ul className="admin-checks">
				<li>
					<Chip tone={maps.length ? 'good' : 'neutral'}>{maps.length ? 'Submitted' : 'Unknown'}</Chip>
					<span>
						Sitemap in Google{' '}
						{maps[0] ? <span className="admin-muted">read {maps[0].lastDownloaded ? formatDate(maps[0].lastDownloaded) : 'not yet'}, {maps[0].errors} errors, {maps[0].warnings} warnings</span> : <span className="admin-muted">submit https://techfiyr.com/sitemap.xml in Search Console</span>}
					</span>
				</li>
				<li>
					<Chip tone={key ? 'good' : 'neutral'}>{key ? 'On' : 'Off'}</Chip>
					<span>
						IndexNow (Bing, Copilot, ChatGPT search, Yandex){' '}
						<span className="admin-muted">{key ? 'pinged automatically when you publish, update or delete' : 'set INDEXNOW_KEY in Netlify to ping Bing on every change'}</span>
					</span>
				</li>
			</ul>
			{result.status === 'off' && <NotConnected what="Google index status" reason={result.reason} steps={gscSteps} />}
			{result.status === 'error' && <SourceError what="Index status" reason={result.reason} />}
			{result.status === 'ok' && (
				<div className="admin-table_wrap">
					<table className="admin-table">
						<thead><tr><th scope="col">Page</th><th scope="col">Google</th><th scope="col">Details</th><th scope="col">Last crawled</th></tr></thead>
						<tbody>
							{result.data.map((r) => {
								const v = VERDICT[r.verdict] || { tone: 'neutral' as const, text: r.error ? 'Unknown' : 'Not checked' };
								return (
									<tr key={r.url}>
										<td><a href={r.url} target="_blank" rel="noopener">{shortPath(r.url)}<span className="sr-only">{' '}(opens in a new tab)</span></a></td>
										<td><Chip tone={v.tone}>{v.text}</Chip></td>
										<td className="admin-muted">{r.error || r.coverage || '–'}</td>
										<td>{r.lastCrawl ? formatDate(r.lastCrawl) : '–'}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</Panel>
	);
}

// ---------- Google Analytics ----------
async function AnalyticsPanel() {
	const a = await analytics();
	if (a.status !== 'ok') {
		return (
			<Panel title="Google Analytics">
				{a.status === 'off' ? (
					<NotConnected
						what="Google Analytics 4"
						reason={a.reason}
						steps={
							<ol>
								<li>In Google Analytics, Admin → Property access management → add the service account&apos;s email as Viewer.</li>
								<li>Copy the property ID (Admin → Property details, numbers only) into <code>GA4_PROPERTY_ID</code> in Netlify.</li>
							</ol>
						}
					/>
				) : (
					<SourceError what="Analytics" reason={a.reason} />
				)}
			</Panel>
		);
	}
	const { totals, pages, sources } = a.data;
	return (
		<Panel title="Google Analytics" meta="Last 28 days, visitors who allowed analytics" id="analytics">
			<dl className="admin-stats is-two">
				<Stat label="Users" value={fmt(totals.users)} />
				<Stat label="Sessions" value={fmt(totals.sessions)} />
				<Stat label="Page views" value={fmt(totals.views)} />
				<Stat label="Engaged sessions" value={pct(totals.engagement)} />
			</dl>
			<h3 className="admin-subhead">Most viewed pages</h3>
			<table className="admin-table is-compact">
				<thead><tr><th scope="col">Page</th><th scope="col" className="is-num">Views</th></tr></thead>
				<tbody>{pages.map((p) => <tr key={p.path}><td>{p.path}</td><td className="is-num">{fmt(p.views)}</td></tr>)}</tbody>
			</table>
			<h3 className="admin-subhead">Where visitors came from</h3>
			<table className="admin-table is-compact">
				<thead><tr><th scope="col">Channel</th><th scope="col" className="is-num">Sessions</th></tr></thead>
				<tbody>{sources.map((s) => <tr key={s.source}><td>{s.source}</td><td className="is-num">{fmt(s.sessions)}</td></tr>)}</tbody>
			</table>
		</Panel>
	);
}

// ---------- Setup checklist ----------
function SetupPanel() {
	const mode = storeMode();
	const items: { ok: boolean; label: string; detail: string }[] = [
		{ ok: mode === 'firestore', label: 'Content database (Firestore)', detail: mode === 'firestore' ? 'Connected with the service account' : mode === 'local' ? 'Local files in .data (development)' : 'Set the FIREBASE_* service account variables' },
		{ ok: Boolean(env('FIREBASE_API_KEY')) && adminEmails().length > 0, label: 'Admin sign-in', detail: `${adminEmails().length} admin address${adminEmails().length === 1 ? '' : 'es'} in ADMIN_EMAILS${env('FIREBASE_API_KEY') ? ', Firebase Authentication' : ', local password'}` },
		{ ok: Boolean(env('SESSION_SECRET')), label: 'Session secret', detail: env('SESSION_SECRET') ? 'Set' : 'Set SESSION_SECRET (32+ random characters)' },
		{
			ok: hasServiceAccount(),
			label: 'Image uploads',
			detail: !hasServiceAccount() ? 'Needs the Firebase service account' : env('MEDIA_STORE') === 'storage' ? `Firebase Storage (${env('FIREBASE_STORAGE_BUCKET') || 'set FIREBASE_STORAGE_BUCKET'})` : 'Stored in Firestore (free plan), served from /media',
		},
		{ ok: (env('CRON_SECRET') || '').length >= 24, label: 'Daily AI news schedule', detail: 'Runs at 06:30 Dhaka time; needs CRON_SECRET (24+ characters)' },
		{ ok: Boolean(env('GSC_SITE_URL')), label: 'Google Search Console', detail: env('GSC_SITE_URL') || 'Set GSC_SITE_URL' },
		{ ok: Boolean(env('GA4_PROPERTY_ID')), label: 'Google Analytics 4 reports', detail: env('GA4_PROPERTY_ID') ? `Property ${env('GA4_PROPERTY_ID')}` : 'Set GA4_PROPERTY_ID' },
		{ ok: Boolean(indexNowKey()), label: 'IndexNow', detail: indexNowKey() ? 'Key published at /indexnow-key.txt' : 'Set INDEXNOW_KEY' },
	];
	return (
		<Panel title="Site setup" meta={`${items.filter((i) => i.ok).length} of ${items.length} connected`} id="setup">
			<ul className="admin-checks">
				{items.map((i) => (
					<li key={i.label}>
						<Chip tone={i.ok ? 'good' : 'neutral'}>{i.ok ? 'On' : 'Off'}</Chip>
						<span>
							{i.label} <span className="admin-muted">{i.detail}</span>
						</span>
					</li>
				))}
			</ul>
			<p className="admin-muted admin-panel_foot">
				Public files: <a href="/sitemap.xml" target="_blank" rel="noopener">sitemap.xml<span className="sr-only"> (opens in a new tab)</span></a> · <a href="/robots.txt" target="_blank" rel="noopener">robots.txt<span className="sr-only"> (opens in a new tab)</span></a> · <a href="/llms.txt" target="_blank" rel="noopener">llms.txt<span className="sr-only"> (opens in a new tab)</span></a>
			</p>
		</Panel>
	);
}

export default function DashboardPage() {
	const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });
	return (
		<>
			<PageHead title="Dashboard" intro={`${today} · techfiyr.com`} />
			<div className="admin-grid">
				<Suspense fallback={<Skeleton title="Content" />}><ContentPanel /></Suspense>
				<SetupPanel />
				<Suspense fallback={<Skeleton title="Visitors" wide />}><VisitorsPanel /></Suspense>
				<Suspense fallback={<Skeleton title="Google Search" wide />}><SearchPanel /></Suspense>
				<Suspense fallback={<Skeleton title="Search engine indexing" wide />}><IndexingPanel /></Suspense>
				<Suspense fallback={<Skeleton title="Google Analytics" />}><AnalyticsPanel /></Suspense>
			</div>
		</>
	);
}
