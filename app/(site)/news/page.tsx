/*
 * AI news (/news): today's top 10 AI stories, picked every morning from the AI feeds of leading
 * publishers and labs (lib/server/news.ts) and managed in the admin panel (pin, hide, delete).
 * Each story shows its headline, publisher, time and the feed's own summary, and links to the
 * original. Nothing loads from the publishers' sites until a visitor clicks through.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { formatDate } from '@/lib/content';
import { getNewsEdition } from '@/lib/server/content';
import { FEEDS } from '@/lib/server/news';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, SITE_URL, WEBSITE_ID, breadcrumbNode, orgNode } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
	title: 'Top 10 AI News Today, Updated Daily | TechFiyr',
	description: 'The 10 most important AI stories of the day from TechCrunch, The Verge, MIT Technology Review, WIRED, OpenAI and Google DeepMind, picked every morning.',
	path: '/news',
});

const sources = FEEDS.map((f) => f.source);
const sourceList = `${sources.slice(0, -1).join(', ')} and ${sources[sources.length - 1]}`;

function time(iso: string) {
	const d = new Date(iso);
	return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' });
}

export default async function NewsPage() {
	const { day, items } = await getNewsEdition();
	const edition = day ? formatDate(`${day}T12:00:00Z`) : '';

	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'CollectionPage',
				'@id': `${SITE_URL}/news#webpage`,
				url: `${SITE_URL}/news`,
				name: 'Top 10 AI news today',
				description: `The day's most important AI stories from ${sourceList}, chosen every morning by TechFiyr.`,
				isPartOf: { '@id': WEBSITE_ID },
				publisher: { '@id': ORG_ID },
				inLanguage: 'en',
				...(day ? { dateModified: `${day}T00:30:00Z` } : {}),
				mainEntity: {
					'@type': 'ItemList',
					itemListOrder: 'https://schema.org/ItemListOrderDescending',
					itemListElement: items.map((n, i) => ({
						'@type': 'ListItem',
						position: i + 1,
						item: { '@type': 'NewsArticle', headline: n.title, url: n.url, datePublished: n.publishedAt, publisher: { '@type': 'Organization', name: n.source } },
					})),
				},
			},
			orgNode,
			breadcrumbNode([{ name: 'Home', path: '/' }, { name: 'AI News', path: '/news' }]),
		],
	};

	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="AI News" title="Top 10 AI News Today" crumbs={[{ label: 'Home', href: '/' }, { label: 'AI News' }]} />

			{/* AI News (from the CMS, refreshed daily) */}
			<section className="projects-section news-section">
				<div className="auto-container">
					<div className="sec-title centered">
						<div className="sec-title_title">
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
							{' '}Updated Every Morning{' '}
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
						</div>
						{' '}
						<h2 className="sec-title_heading">
							{edition ? <>The AI stories that matter{' '}<br />{' '}on {edition}</> : 'The AI stories that matter today'}
						</h2>
						<div className="sec-title_text">
							Every morning at 06:30 Dhaka time we read the AI coverage of {sourceList}, and pick the ten most important stories of the last day.
							There are at most two per publisher, and the same story from two outlets appears only once. Each headline links to the original article.
						</div>
					</div>
					{' '}
					{items.length ? (
						<ol className="news-list">
							{items.map((n, i) => (
								<li key={n.id} className="news-item">
									<span className="news-item_rank" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
									<div className="news-item_body">
										<p className="news-item_meta">
											<span className="project-chip">{n.source}</span>
											{' '}
											<time dateTime={n.publishedAt}>{time(n.publishedAt)}</time>
										</p>
										<h3 className="news-item_title">
											<a href={n.url} target="_blank" rel="noopener nofollow">
												{n.title}
												<span className="sr-only"> ({n.source}, opens in a new tab)</span>
											</a>
										</h3>
										{n.summary && <p className="news-item_text">{n.summary}</p>}
									</div>
								</li>
							))}
						</ol>
					) : (
						<div className="content-empty">
							<h3>Today&apos;s stories are on their way</h3>
							<p>The list refreshes every morning. Meanwhile, read <Link href="/blog">our blog</Link> or see <Link href="/projects">what we build</Link>.</p>
						</div>
					)}
					<p className="news-note">
						Headlines and summaries belong to their publishers and link to the original articles. TechFiyr picks the stories; it does not write or edit them.
						Building an AI feature into your app? <Link href="/contact">Talk to our AI/ML engineer</Link>.
					</p>
				</div>
			</section>
			{/* End AI News */}
		</>
	);
}
