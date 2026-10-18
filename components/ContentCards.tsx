/*
 * Cards for CMS content on the public site, built from the portfolio card (.project-card in
 * style.css) so blog posts and products look like the rest of the site. Data: lib/server/content.ts.
 */
import Link from 'next/link';
import { formatDate, postPath, productPath, readingMinutes, type Post, type Product } from '@/lib/content';

export function PostCard({ p, eager }: { p: Post; eager?: boolean }) {
	return (
		<article className="project-card content-card">
			<div className="project-card_media">
				{p.coverUrl ? (
					<img src={p.coverUrl} alt={p.coverAlt || p.title} width="1600" height="1000" loading={eager ? undefined : 'lazy'} decoding="async" />
				) : (
					<div className="content-card_placeholder" aria-hidden="true">{p.tags[0] || 'TechFiyr'}</div>
				)}
				{p.tags[0] && <span className="project-chip">{p.tags[0]}</span>}
			</div>
			<div className="project-card_body">
				<p className="content-card_meta">
					<time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time> · {readingMinutes(p.body)} min read
				</p>
				<h3 className="project-card_title"><Link href={postPath(p)}>{p.title}</Link></h3>
				<p className="project-card_text">{p.excerpt}</p>
				<div className="project-card_foot">
					<span className="project-card_more">Read the article <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
					<span className="content-card_author">{p.author}</span>
				</div>
			</div>
		</article>
	);
}

export function ProductCard({ p, eager }: { p: Product; eager?: boolean }) {
	return (
		<article className="project-card content-card">
			<div className="project-card_media">
				{p.coverUrl ? (
					<img src={p.coverUrl} alt={p.coverAlt || p.name} width="1600" height="1000" loading={eager ? undefined : 'lazy'} decoding="async" />
				) : (
					<div className="content-card_placeholder" aria-hidden="true">{p.name}</div>
				)}
				{p.category && <span className="project-chip">{p.category}</span>}
				{p.price && <span className="project-chip content-card_price">{p.price}</span>}
			</div>
			<div className="project-card_body">
				<h3 className="project-card_title"><Link href={productPath(p)}>{p.name}</Link></h3>
				<p className="project-card_text">{p.tagline}</p>
				{p.platforms.length > 0 && <ul className="project-tags">{p.platforms.map((t) => <li key={t}>{t}</li>)}</ul>}
				<div className="project-card_foot">
					<span className="project-card_more">View product <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
				</div>
			</div>
		</article>
	);
}
