/*
 * Blog post (/blog/<slug>). Published posts are prerendered at build time; a new post gets its page
 * on the first visit after publishing and is cached from then on (tag "posts", hourly at most).
 * Title, description, canonical, article JSON-LD (author, dates) and the whole text are in the
 * server HTML for search engines and AI crawlers.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/ContentCards';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { authorOf, formatDate, postPath, readingMinutes, type Post } from '@/lib/content';
import { Markdown, outline, plainText } from '@/lib/markdown';
import { getPost, getPublishedPosts } from '@/lib/server/content';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, SITE_URL, WEBSITE_ID, absUrl, breadcrumbNode } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
	return (await getPublishedPosts()).map((p) => ({ slug: p.slug }));
}

const seoTitle = (p: Post) => p.seoTitle || `${p.title} | TechFiyr Blog`;
const seoDescription = (p: Post) => p.seoDescription || p.excerpt || plainText(p.body).slice(0, 158);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const p = await getPost((await params).slug);
	if (!p) return {};
	const meta = pageMetadata({
		title: seoTitle(p),
		description: seoDescription(p),
		path: postPath(p),
		ogTitle: p.title,
		image: p.coverUrl ? { url: absUrl(p.coverUrl), alt: p.coverAlt || p.title } : undefined,
		keywords: p.tags,
	});
	return {
		...meta,
		openGraph: { ...meta.openGraph, type: 'article', publishedTime: p.publishedAt, modifiedTime: p.updatedAt, authors: [p.author], tags: p.tags },
	};
}

function structuredData(p: Post) {
	const url = absUrl(postPath(p));
	const author = authorOf(p.author);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BlogPosting',
				'@id': `${url}#article`,
				headline: p.title,
				description: seoDescription(p),
				url,
				mainEntityOfPage: url,
				datePublished: p.publishedAt,
				dateModified: p.updatedAt || p.publishedAt,
				author:
					author.name === 'TechFiyr Team'
						? { '@id': ORG_ID }
						: { '@type': 'Person', name: author.name, jobTitle: author.role, ...(author.url ? { sameAs: [author.url] } : {}), worksFor: { '@id': ORG_ID } },
				publisher: { '@id': ORG_ID },
				isPartOf: { '@id': `${SITE_URL}/blog#blog` },
				inLanguage: 'en',
				wordCount: plainText(p.body).split(/\s+/).length,
				...(p.coverUrl ? { image: [absUrl(p.coverUrl)] } : {}),
				...(p.tags.length ? { keywords: p.tags.join(', ') } : {}),
			},
			{ '@type': 'WebPage', '@id': `${url}#webpage`, url, name: seoTitle(p), isPartOf: { '@id': WEBSITE_ID }, mainEntity: { '@id': `${url}#article` }, inLanguage: 'en' },
			breadcrumbNode([
				{ name: 'Home', path: '/' },
				{ name: 'Blog', path: '/blog' },
				{ name: p.title, path: postPath(p) },
			]),
		],
	};
}

export default async function PostPage({ params }: Props) {
	const p = await getPost((await params).slug);
	if (!p) notFound();

	const toc = outline(p.body);
	const author = authorOf(p.author);
	const more = (await getPublishedPosts()).filter((x) => x.id !== p.id).slice(0, 3);

	return (
		<>
			<JsonLd data={structuredData(p)} />

			<PageTitle bigTitle="Blog" title={p.title} crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: p.title }]} />

			{/* Blog Post (from the CMS) */}
			<section className="project-detail-section">
				<div className="auto-container">
					<article>
						<header className="article-head">
							<ul className="project-tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
							<p className="project-hero_summary article-head_summary">{p.excerpt}</p>
							<dl className="project-meta article-head_meta">
								<div><dt>Written by</dt><dd>{author.name}<span className="article-head_role">{author.role}</span></dd></div>
								<div><dt>Published</dt><dd><time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time></dd></div>
								{p.updatedAt && p.updatedAt.slice(0, 10) !== p.publishedAt.slice(0, 10) && (
									<div><dt>Updated</dt><dd><time dateTime={p.updatedAt}>{formatDate(p.updatedAt)}</time></dd></div>
								)}
								<div><dt>Reading time</dt><dd>{readingMinutes(p.body)} min</dd></div>
							</dl>
							{p.coverUrl && (
								<figure className="article-head_media">
									<img src={p.coverUrl} alt={p.coverAlt || p.title} width="1600" height="1000" fetchPriority="high" />
								</figure>
							)}
						</header>
						<div className="project-body">
							<div className="project-body_main article-body">
								<Markdown source={p.body} />
							</div>
							<aside className="project-body_aside article-aside">
								{toc.length > 1 && (
									<nav aria-label="In this article">
										<h2 className="article-aside_title">In this article</h2>
										<ol className="article-toc">
											{toc.map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}
										</ol>
									</nav>
								)}
								<h2 className="article-aside_title">Planning an app or SaaS?</h2>
								<p>Book a free 30-minute call with {author.name === 'TechFiyr Team' ? 'our team' : author.name.split(' ')[0]} and the team. We&apos;ll map out scope, stack and timeline.</p>
								<Link className="theme-btn btn-style-one" href="/contact"><span className="btn-wrap"><span className="text-one">Book a Free Call</span><span className="text-two">Book a Free Call</span></span></Link>
							</aside>
						</div>
					</article>
					{more.length > 0 && (
						<section className="content-more" aria-labelledby="more-posts">
							<h2 id="more-posts" className="content-more_title">More from the blog</h2>
							<div className="projects-grid">{more.map((x) => <PostCard key={x.id} p={x} />)}</div>
						</section>
					)}
					<div className="project-nav"><Link href="/blog"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> All articles</Link></div>
				</div>
			</section>
			{/* End Blog Post */}
		</>
	);
}
