'use client';

/*
 * Portfolio grid with the All / Mobile Apps / Websites filter (/projects).
 * The cards are in the server HTML (so crawlers see them); the filter only changes which show.
 * Data: lib/projects.ts.
 */
import Link from 'next/link';
import { useState } from 'react';
import { PROJECTS, TYPE_LABEL, liveLinks, projectPath, type Project } from '@/lib/projects';

const FILTERS: { key: 'all' | Project['type']; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'mobile', label: 'Mobile Apps' },
	{ key: 'web', label: 'Websites' },
];

function ProjectCard({ p }: { p: Project }) {
	const live = liveLinks(p)[0];
	return (
		<article className="project-card" data-type={p.type}>
			<div className="project-card_media">
				<img src={p.cover} alt={p.title} loading="lazy" decoding="async" />
				<span className="project-chip">{TYPE_LABEL[p.type] || p.type}</span>
				{p.sample && <span className="project-chip project-chip_sample">Sample</span>}
			</div>
			<div className="project-card_body">
				<h3 className="project-card_title"><Link href={projectPath(p)}>{p.title}</Link></h3>
				<p className="project-card_text">{p.summary}</p>
				<ul className="project-tags">{(p.tags || []).map((t) => <li key={t}>{t}</li>)}</ul>
				<div className="project-card_foot">
					<span className="project-card_more">View details <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
					{live && (
						<a className="project-card_live" href={live.href} target="_blank" rel="noopener">
							<i className={live.icon} aria-hidden="true"></i> Live<span className="sr-only"> (opens in a new tab)</span>
						</a>
					)}
				</div>
			</div>
		</article>
	);
}

export default function ProjectsGrid() {
	const [filter, setFilter] = useState<'all' | Project['type']>('all');
	const list = PROJECTS.filter((p) => filter === 'all' || p.type === filter);

	return (
		<>
			<div className="projects-filter" role="group" aria-label="Filter projects">
				{FILTERS.map((f) => (
					<button key={f.key} type="button" className={filter === f.key ? 'is-active' : undefined} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
						{f.label} <span>{f.key === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.type === f.key).length}</span>
					</button>
				)).reduce<React.ReactNode[]>((all, b, i) => (i ? [...all, ' ', b] : [b]), [])}
			</div>
			{' '}
			<div className="projects-grid">{list.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
			{' '}
			<p className="projects-empty" hidden={list.length > 0}>No projects in this category yet.</p>
		</>
	);
}
