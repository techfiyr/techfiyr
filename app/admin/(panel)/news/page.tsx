/*
 * /admin/news: the daily top 10 AI stories (fetched automatically every morning, lib/server/news.ts).
 * Pin a story to keep it at the top, hide one to take it off the site, or fetch again now.
 */
import type { Metadata } from 'next';
import { fetchNewsNow, updateNews } from '@/app/admin/actions';
import SubmitButton from '@/components/admin/SubmitButton';
import { Chip, PageHead, Panel, dayLabel, timeAgo } from '@/components/admin/ui';
import type { NewsItem } from '@/lib/content';
import { lastNewsRun, listNews } from '@/lib/server/content';
import { FEEDS, editionDay } from '@/lib/server/news';

export const metadata: Metadata = { title: 'AI news' };

function StoryActions({ n }: { n: NewsItem }) {
	return (
		<form action={updateNews} className="admin-row-actions">
			<input type="hidden" name="id" value={n.id} />
			<SubmitButton className="admin-btn is-small is-quiet" name="action" value={n.pinned ? 'unpin' : 'pin'} pending="…">
				<i className="fa-solid fa-thumbtack" aria-hidden="true"></i> {n.pinned ? 'Unpin' : 'Pin'}
				<span className="sr-only"> {n.title}</span>
			</SubmitButton>
			<SubmitButton className="admin-btn is-small is-quiet" name="action" value={n.hidden ? 'show' : 'hide'} pending="…">
				<i className={n.hidden ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'} aria-hidden="true"></i> {n.hidden ? 'Show' : 'Hide'}
				<span className="sr-only"> {n.title}</span>
			</SubmitButton>
			<SubmitButton className="admin-btn is-small is-quiet" name="action" value="delete" pending="…">
				<i className="fa-solid fa-trash-can" aria-hidden="true"></i> Delete
				<span className="sr-only"> {n.title}</span>
			</SubmitButton>
		</form>
	);
}

function Story({ n }: { n: NewsItem }) {
	return (
		<li className={n.hidden ? 'admin-story is-hidden' : 'admin-story'}>
			<span className="admin-story_rank" aria-label={`Rank ${n.rank}`}>{n.pinned ? <i className="fa-solid fa-thumbtack" aria-hidden="true"></i> : n.rank}</span>
			<div className="admin-story_body">
				<a className="admin-story_title" href={n.url} target="_blank" rel="noopener">
					{n.title}
					<span className="sr-only"> (opens in a new tab)</span>
				</a>
				<p className="admin-story_meta">
					<strong>{n.source}</strong> · {timeAgo(n.publishedAt)}
					{n.pinned && <> · <Chip tone="good">Pinned</Chip></>}
					{n.hidden && <> · <Chip tone="draft">Hidden</Chip></>}
				</p>
				{n.summary && <p className="admin-story_text">{n.summary}</p>}
			</div>
			<StoryActions n={n} />
		</li>
	);
}

export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<{ fetched?: string }> }) {
	const { fetched } = await searchParams;
	const [news, run] = await Promise.all([listNews(), lastNewsRun()]);
	const today = editionDay();
	const pinned = news.filter((n) => n.pinned);
	const days = [...new Set(news.filter((n) => !n.pinned).map((n) => n.day))].slice(0, 7);

	return (
		<>
			<PageHead
				title="AI news"
				intro="Every morning at 06:30 (Dhaka) the site picks the top 10 AI stories from the feeds below and publishes them at techfiyr.com/news. Pin, hide or delete a story; changes go live at once."
				actions={
					<form action={fetchNewsNow}>
						<SubmitButton className="admin-btn is-primary" pending="Fetching stories…">
							<i className="fa-solid fa-rotate" aria-hidden="true"></i> Fetch now
						</SubmitButton>
					</form>
				}
			/>
			{fetched !== undefined && (
				<p className={Number(fetched) > 0 ? 'admin-alert is-good' : 'admin-alert is-error'} role="status">
					<i className={Number(fetched) > 0 ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'} aria-hidden="true"></i>{' '}
					{Number(fetched) > 0 ? `Today's edition now has ${fetched} stories.` : 'No new stories were found. Check the feeds below.'}
				</p>
			)}

			<div className="admin-grid">
				<Panel title="Feeds" meta={run ? `Last run ${timeAgo(run.ranAt)}` : 'Not run yet'} id="feeds">
					<ul className="admin-checks">
						{FEEDS.map((f) => {
							const r = run?.feeds.find((x) => x.source === f.source);
							return (
								<li key={f.source}>
									<Chip tone={!r ? 'neutral' : r.error ? 'warn' : 'good'}>{!r ? 'Waiting' : r.error ? 'Failed' : `${r.items} stories`}</Chip>
									<span>
										{f.source} <span className="admin-muted">{r?.error || new URL(f.url).host}</span>
									</span>
								</li>
							);
						})}
					</ul>
					<p className="admin-muted admin-panel_foot">
						The site shows each story&apos;s headline, publisher, date and the feed&apos;s own short summary, and links to the original article. No article text or images are copied.
					</p>
				</Panel>

				<Panel title={`Pinned (${pinned.length})`} id="pinned">
					{pinned.length ? <ol className="admin-stories">{pinned.map((n) => <Story key={n.id} n={n} />)}</ol> : <p className="admin-muted">Pin a story to keep it at the top of /news after the daily refresh.</p>}
				</Panel>

				{days.length === 0 && (
					<div className="admin-empty is-wide">
						<p className="admin-empty_title">No stories yet.</p>
						<p className="admin-muted">Press “Fetch now” to load today&apos;s top 10. After that it runs by itself every morning.</p>
					</div>
				)}
				{days.map((day) => {
					const items = news.filter((n) => !n.pinned && n.day === day);
					return (
						<Panel key={day} title={day === today ? `Today, ${dayLabel(day, 'long')}` : dayLabel(day, 'long')} meta={`${items.filter((n) => !n.hidden).length} on the site`} wide id={`day-${day}`}>
							<ol className="admin-stories">{items.map((n) => <Story key={n.id} n={n} />)}</ol>
						</Panel>
					);
				})}
			</div>
		</>
	);
}
