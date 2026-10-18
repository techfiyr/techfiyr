/*
 * Portfolio (/projects): every project in lib/projects.ts, prerendered so crawlers see the cards.
 */
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import PageTitle from '@/components/PageTitle';
import ProjectsGrid from '@/components/ProjectsGrid';
import { PROJECTS, projectPath } from '@/lib/projects';
import { pageMetadata } from '@/lib/seo';
import { ORG_ID, SITE_URL, WEBSITE_ID, absUrl, breadcrumbNode, orgNode } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
	title: 'Projects | TechFiyr Mobile App & Web Portfolio',
	description: 'Mobile apps and websites built by TechFiyr: live links, screenshots and project details.',
	path: '/projects',
});

// Structured data: keep these facts identical to the home page and llms.txt
const structuredData = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'CollectionPage',
			'@id': `${SITE_URL}/projects#webpage`,
			url: `${SITE_URL}/projects`,
			name: 'TechFiyr projects',
			description: 'Mobile apps and websites designed and built by TechFiyr.',
			isPartOf: { '@id': WEBSITE_ID },
			about: { '@id': ORG_ID },
			inLanguage: 'en',
			mainEntity: {
				'@type': 'ItemList',
				itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(projectPath(p)), name: p.title })),
			},
		},
		orgNode,
		breadcrumbNode([{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects' }]),
	],
};

export default function ProjectsPage() {
	return (
		<>
			<JsonLd data={structuredData} />

			<PageTitle bigTitle="Projects" title="Our Projects" crumbs={[{ label: 'Home', href: '/' }, { label: 'Projects' }]} />

			{/* Projects Grid (cards come from lib/projects.ts) */}
			<section className="projects-section">
				<div className="auto-container">
					<div className="sec-title centered">
						<div className="sec-title_title">
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
							{' '}Our Work{' '}
							<div className="sec-title_dots"><span></span><span></span><span></span></div>
						</div>
						{' '}
						<h2 className="sec-title_heading">
							Mobile apps &amp; websites{' '}
							<br />
							{' '}we&apos;ve shipped
						</h2>
					</div>
					{' '}
					<ProjectsGrid />
				</div>
			</section>
			{/* End Projects Grid */}
		</>
	);
}
