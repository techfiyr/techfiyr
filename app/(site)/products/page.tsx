/*
 * Products (/products): TechFiyr's own apps, SaaS and templates from the CMS (admin panel → Products),
 * in the order set there. Static from the CDN, refreshed when a product is saved (tag "products").
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/ContentCards';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { productPath } from '@/lib/content';
import { getPublishedProducts } from '@/lib/server/content';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, SITE_URL, WEBSITE_ID, absUrl, breadcrumbNode, orgNode } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
	title: 'Products: Apps, SaaS & Templates by TechFiyr',
	description: 'Apps, SaaS tools and templates designed and built by TechFiyr in Dhaka: features, platforms, pricing and links to try each one.',
	path: '/products',
});

export default async function ProductsPage() {
	const products = await getPublishedProducts();

	const structuredData = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'CollectionPage',
				'@id': `${SITE_URL}/products#webpage`,
				url: `${SITE_URL}/products`,
				name: 'TechFiyr products',
				description: 'Apps, SaaS tools and templates made by TechFiyr.',
				isPartOf: { '@id': WEBSITE_ID },
				about: { '@id': ORG_ID },
				inLanguage: 'en',
				mainEntity: {
					'@type': 'ItemList',
					itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(productPath(p)), name: p.name })),
				},
			},
			orgNode,
			breadcrumbNode([{ name: 'Home', path: '/' }, { name: 'Products', path: '/products' }]),
		],
	};

	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Products" title="Our Products" crumbs={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />

			{/* Products Grid (from the CMS) */}
			<section className="projects-section">
				<div className="auto-container">
					<div className="sec-title centered">
						<div className="sec-title_title">
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
							{' '}Made By TechFiyr{' '}
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
						</div>
						{' '}
						<h2 className="sec-title_heading">
							Apps &amp; tools we build{' '}
							<br />
							{' '}and run ourselves
						</h2>
						<div className="sec-title_text">
							Besides client work, the TechFiyr team designs and ships its own products. Each one below is live: see what it does, where it runs and how to start.
						</div>
					</div>
					{' '}
					{products.length ? (
						<div className="projects-grid">{products.map((p, i) => <ProductCard key={p.id} p={p} eager={i < 3} />)}</div>
					) : (
						<div className="content-empty">
							<h3>New products are on the way</h3>
							<p>
								While we get them ready, see the apps and websites we&apos;ve built for clients in <Link href="/projects">our projects</Link>, or{' '}
								<Link href="/contact">tell us about yours</Link>.
							</p>
						</div>
					)}
				</div>
			</section>
			{/* End Products Grid */}
		</>
	);
}
