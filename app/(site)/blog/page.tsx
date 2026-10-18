/*
 * Blog (/blog): every published post from the CMS (admin panel → Blog), newest first. A static page
 * from the CDN, refreshed when a post is saved (tag "posts") or hourly at most.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PostCard } from '@/components/ContentCards';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { postPath } from '@/lib/content';
import { getPublishedPosts } from '@/lib/server/content';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, SITE_URL, WEBSITE_ID, absUrl, breadcrumbNode, orgNode } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
	title: 'App Development Blog: Flutter, SaaS & Costs | TechFiyr',
	description: 'Practical guides from TechFiyr’s designers and engineers on Flutter, React Native, SaaS builds, app costs, timelines and store releases.',
	path: '/blog',
});

export default async function BlogPage() {
	const posts = await getPublishedPosts();

	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Blog',
				'@id': `${SITE_URL}/blog#blog`,
				url: `${SITE_URL}/blog`,
				name: 'TechFiyr Blog',
				description: 'Guides on mobile app and web software development from the TechFiyr team.',
				isPartOf: { '@id': WEBSITE_ID },
				publisher: { '@id': ORG_ID },
				inLanguage: 'en',
				blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: absUrl(postPath(p)), datePublished: p.publishedAt, author: { '@type': 'Person', name: p.author } })),
			},
			orgNode,
			breadcrumbNode([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }]),
		],
	};

	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Blog" title="Blog" crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />

			{/* Blog Posts (from the CMS) */}
			<section className="projects-section">
				<div className="auto-container">
					<div className="sec-title centered">
						<div className="sec-title_title">
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
							{' '}From The Team{' '}
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
						</div>
						{' '}
						<h2 className="sec-title_heading">
							Straight answers on building{' '}
							<br />
							{' '}apps &amp; SaaS products
						</h2>
						<div className="sec-title_text">
							What an app costs, how long it takes, Flutter or React Native, and how a release reaches the App Store and Google Play: written by
							the people who build them at TechFiyr. Looking for the latest AI headlines? See today&apos;s <Link href="/news">top 10 AI news</Link>.
						</div>
					</div>
					{' '}
					{posts.length ? (
						<div className="projects-grid">{posts.map((p, i) => <PostCard key={p.id} p={p} eager={i < 3} />)}</div>
					) : (
						<div className="content-empty">
							<h3>The first articles are on their way</h3>
							<p>
								Meanwhile, see the apps and websites we&apos;ve shipped in <Link href="/projects">our projects</Link>, or{' '}
								<Link href="/contact">book a free 30-minute call</Link> and ask us directly.
							</p>
						</div>
					)}
				</div>
			</section>
			{/* End Blog Posts */}
		</>
	);
}
