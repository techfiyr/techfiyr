/*
 * Product page (/products/<slug>), built like a project case study (.project-hero, .project-body).
 * Published products are prerendered; new ones get their page on the first visit and are cached
 * from then on (tag "products"). JSON-LD: SoftwareApplication made by TechFiyr.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { productPath, type Product } from '@/lib/content';
import { Markdown, plainText } from '@/lib/markdown';
import { getProduct, getPublishedProducts } from '@/lib/server/content';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, WEBSITE_ID, absUrl, breadcrumbNode } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
	return (await getPublishedProducts()).map((p) => ({ slug: p.slug }));
}

const seoTitle = (p: Product) => p.seoTitle || `${p.name} | TechFiyr Products`;
const seoDescription = (p: Product) => p.seoDescription || p.tagline || plainText(p.description).slice(0, 158);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const p = await getProduct((await params).slug);
	if (!p) return {};
	return pageMetadata({
		title: seoTitle(p),
		description: seoDescription(p),
		path: productPath(p),
		ogTitle: p.name,
		image: p.coverUrl ? { url: absUrl(p.coverUrl), alt: p.coverAlt || p.name } : undefined,
	});
}

const LINK_ICON: [RegExp, string][] = [
	[/play/i, 'fa-brands fa-google-play'],
	[/app store|ios|apple/i, 'fa-brands fa-apple'],
	[/github/i, 'fa-brands fa-github'],
];
const iconFor = (label: string) => LINK_ICON.find(([re]) => re.test(label))?.[1] || 'fa-solid fa-arrow-up-right-from-square';

/** "Free" -> 0 USD, "$19/month" -> 19 USD; anything else is left out of the structured data. */
function offer(price: string) {
	if (/^free\b/i.test(price.trim())) return { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
	const m = /^\$\s?(\d+(?:\.\d{1,2})?)/.exec(price.trim());
	return m ? { '@type': 'Offer', price: m[1], priceCurrency: 'USD' } : null;
}

function structuredData(p: Product) {
	const url = absUrl(productPath(p));
	const o = offer(p.price);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'SoftwareApplication',
				'@id': `${url}#product`,
				name: p.name,
				description: seoDescription(p),
				url,
				applicationCategory: /mobile/i.test(p.category) ? 'MobileApplication' : 'BusinessApplication',
				...(p.platforms.length ? { operatingSystem: p.platforms.join(', ') } : {}),
				...(p.coverUrl || p.gallery.length ? { image: [p.coverUrl, ...p.gallery].filter(Boolean).map(absUrl) } : {}),
				...(p.features.length ? { featureList: p.features } : {}),
				...(o ? { offers: o } : {}),
				...(p.links.length ? { sameAs: p.links.map((l) => l.url) } : {}),
				creator: { '@id': ORG_ID },
				publisher: { '@id': ORG_ID },
			},
			{ '@type': 'WebPage', '@id': `${url}#webpage`, url, name: seoTitle(p), isPartOf: { '@id': WEBSITE_ID }, mainEntity: { '@id': `${url}#product` }, inLanguage: 'en' },
			breadcrumbNode([
				{ name: 'Home', path: '/' },
				{ name: 'Products', path: '/products' },
				{ name: p.name, path: productPath(p) },
			]),
		],
	};
}

export default async function ProductPage({ params }: Props) {
	const p = await getProduct((await params).slug);
	if (!p) notFound();

	const meta = ([['Category', p.category], ['Platforms', p.platforms.join(', ')], ['Price', p.price]] as const).filter((m) => m[1]);

	return (
		<>
			<JsonLd data={structuredData(p)} />

			<PageTitle bigTitle="Product" title={p.name} crumbs={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: p.name }]} />

			{/* Product Details (from the CMS) */}
			<section className="project-detail-section">
				<div className="auto-container">
					<div className={p.coverUrl ? 'project-hero' : 'project-hero is-text-only'}>
						<div className="project-hero_text">
							{p.category && <span className="project-chip">{p.category}</span>}
							<h2 className="project-hero_title">{p.name}</h2>
							<p className="project-hero_summary">{p.tagline}</p>
							{meta.length > 0 && (
								<dl className="project-meta">
									{meta.map((m) => <div key={m[0]}><dt>{m[0]}</dt><dd>{m[1]}</dd></div>)}
								</dl>
							)}
							{p.links.length > 0 && (
								<div className="project-links">
									{p.links.map((l) => (
										<a key={l.url} className="project-link" href={l.url} target="_blank" rel="noopener">
											<i className={iconFor(l.label)} aria-hidden="true"></i> {l.label}<span className="sr-only"> (opens in a new tab)</span>
										</a>
									))}
								</div>
							)}
						</div>
						{p.coverUrl && <div className="project-hero_media"><img src={p.coverUrl} alt={p.coverAlt || p.name} width="1600" height="1000" fetchPriority="high" /></div>}
					</div>
					<div className="project-body">
						<div className="project-body_main article-body">
							{p.description.trim() ? <Markdown source={p.description} /> : <p>{p.tagline}</p>}
							{p.features.length > 0 && (
								<>
									<h2>What {p.name} does</h2>
									<ul className="project-highlights">
										{p.features.map((f) => <li key={f}><i className="fa-solid fa-circle-check" aria-hidden="true"></i> {f}</li>)}
									</ul>
								</>
							)}
						</div>
						<aside className="project-body_aside">
							{p.platforms.length > 0 && (
								<>
									<h2 className="article-aside_title">Runs on</h2>
									<ul className="project-tags">{p.platforms.map((t) => <li key={t}>{t}</li>)}</ul>
								</>
							)}
							<h2 className="article-aside_title">Need it tailored?</h2>
							<p>We build custom versions and integrations for businesses. Book a free call and tell us what you need.</p>
							<Link className="theme-btn btn-style-one" href="/contact"><span className="btn-wrap"><span className="text-one">Book a Free Call</span><span className="text-two">Book a Free Call</span></span></Link>
						</aside>
					</div>
					{p.gallery.length > 0 && (
						<div className="project-gallery">
							{p.gallery.map((g, i) => <img key={g} src={g} alt={`${p.name} screenshot ${i + 1}`} loading="lazy" decoding="async" />)}
						</div>
					)}
					<div className="project-nav"><Link href="/products"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> All products</Link></div>
				</div>
			</section>
			{/* End Product Details */}
		</>
	);
}
