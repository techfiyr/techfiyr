/*
 * Project details (/projects/<slug>), one static page per project in lib/projects.ts.
 * Title, description, canonical, Open Graph and JSON-LD are in the server HTML, so search engines
 * and AI crawlers that don't run JavaScript read the full case study.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import { PROJECTS, TYPE_LABEL, getProject, liveLinks, projectPath, type Project } from '@/lib/projects';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, SITE_URL, WEBSITE_ID, absUrl, breadcrumbNode } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
	return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const p = getProject((await params).slug);
	if (!p) return {};
	return pageMetadata({
		title: `${p.title} | TechFiyr Projects`,
		description: p.summary,
		path: projectPath(p),
		image: { url: absUrl(p.cover), alt: p.title },
	});
}

function structuredData(p: Project) {
	const url = absUrl(projectPath(p));
	const image = absUrl(p.cover);
	const links = p.links || {};
	const work: Record<string, unknown> = {
		'@type': p.type === 'mobile' ? 'MobileApplication' : 'WebSite',
		'@id': `${url}#work`,
		name: p.title,
		description: (p.description || [p.summary]).join(' '),
		url: links.website || url,
		image: [image, ...(p.gallery || []).map(absUrl)],
		keywords: (p.tags || []).join(', '),
		creator: { '@id': ORG_ID },
	};
	if (p.type === 'mobile') {
		if (p.category) work.applicationCategory = p.category;
		const os = [links.playStore ? 'Android' : '', links.appStore ? 'iOS' : ''].filter(Boolean).join(', ');
		if (os) work.operatingSystem = os;
		if (links.playStore || links.appStore) work.installUrl = links.playStore || links.appStore;
	}
	if (p.year) work.dateCreated = p.year;
	if (p.client) work.sourceOrganization = { '@type': 'Organization', name: p.client };
	const same = Object.values(links).filter(Boolean);
	if (same.length) work.sameAs = same;

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': `${url}#webpage`,
				url,
				name: `${p.title} | TechFiyr Projects`,
				description: p.summary,
				isPartOf: { '@id': WEBSITE_ID },
				mainEntity: { '@id': `${url}#work` },
				primaryImageOfPage: image,
				inLanguage: 'en',
			},
			work,
			breadcrumbNode([
				{ name: 'Home', path: '/' },
				{ name: 'Projects', path: '/projects' },
				{ name: p.title, path: projectPath(p) },
			]),
		],
	};
}

export default async function ProjectPage({ params }: Props) {
	const p = getProject((await params).slug);
	if (!p) notFound();

	const links = liveLinks(p);
	const meta = ([['Client', p.client], ['Country', p.country], ['Year', p.year], ['Type', TYPE_LABEL[p.type]]] as const).filter((m) => m[1]);

	return (
		<>
			<JsonLd data={structuredData(p)} />

			<PageTitle
				bigTitle={TYPE_LABEL[p.type] || 'Project'}
				title={p.title}
				crumbs={[{ label: 'Home', href: '/' }, { label: 'Projects', href: '/projects' }, { label: p.title }]}
			/>

			{/* Project Details (from lib/projects.ts) */}
			<section className="project-detail-section">
				<div className="auto-container">
					<div>
						<div className="project-hero">
							<div className="project-hero_text">
								<span className="project-chip">{TYPE_LABEL[p.type] || p.type}</span>
								{p.sample && <>{' '}<span className="project-chip project-chip_sample">Sample</span></>}
								<h2 className="project-hero_title">{p.title}</h2>
								<p className="project-hero_summary">{p.summary}</p>
								<dl className="project-meta">
									{meta.map((m) => <div key={m[0]}><dt>{m[0]}</dt><dd>{m[1]}</dd></div>)}
								</dl>
								{links.length > 0 && (
									<div className="project-links">
										{links.map((l) => (
											<a key={l.href} className="project-link" href={l.href} target="_blank" rel="noopener">
												<i className={l.icon} aria-hidden="true"></i> {l.text}<span className="sr-only"> (opens in a new tab)</span>
											</a>
										))}
									</div>
								)}
							</div>
							<div className="project-hero_media"><img src={p.cover} alt={p.title} fetchPriority="high" /></div>
						</div>
						<div className="project-body">
							<div className="project-body_main">
								<h3>Overview</h3>
								{(p.description || []).map((t) => <p key={t}>{t}</p>)}
								{(p.highlights || []).length > 0 && (
									<>
										<h3>Highlights</h3>
										<ul className="project-highlights">
											{(p.highlights || []).map((h) => <li key={h}><i className="fa-solid fa-circle-check" aria-hidden="true"></i> {h}</li>)}
										</ul>
									</>
								)}
							</div>
							<aside className="project-body_aside">
								<h4>Tech stack</h4>
								<ul className="project-tags">{(p.tags || []).map((t) => <li key={t}>{t}</li>)}</ul>
								<h4>Have a similar idea?</h4>
								<p>Book a free call and we&apos;ll map out scope, stack, and timeline.</p>
								<Link className="theme-btn btn-style-one" href="/contact"><span className="btn-wrap"><span className="text-one">Book a Free Call</span><span className="text-two">Book a Free Call</span></span></Link>
							</aside>
						</div>
						{(p.gallery || []).length > 0 && (
							<div className="project-gallery">
								{(p.gallery || []).map((g) => <img key={g} src={g} alt={`${p.title} screenshot`} loading="lazy" decoding="async" />)}
							</div>
						)}
						<div className="project-nav"><Link href="/projects"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> All projects</Link></div>
					</div>
				</div>
			</section>
			{/* End Project Details */}
		</>
	);
}
