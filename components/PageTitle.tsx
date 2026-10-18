/*
 * Inner-page hero: navy-washed photo in the rounded frame, giant outlined word, the page's <h1>
 * and the breadcrumb. Same markup as the original template pages.
 */
import Link from 'next/link';

type Crumb = { label: string; href?: string };

export default function PageTitle({ bigTitle, title, crumbs }: { bigTitle: string; title: string; crumbs: Crumb[] }) {
	return (
		<>
			{/* Page Title */}
			<section className="page-title">
				<div className="page-title_big-title" aria-hidden="true">{bigTitle}</div>
				{' '}
				<div className="page-title_bg-image" style={{ backgroundImage: 'url(/assets/images/backgrounds/page-title-bg.jpg)' }}></div>
				{' '}
				<div className="page-title_shape-two" style={{ backgroundImage: 'url(/assets/images/backgrounds/page-title-shape.png)' }}></div>
				{' '}
				<div className="auto-container">
					<h1>{title}</h1>
					{' '}
					<ul className="bread-crumb clearfix">
						{crumbs.map((c, i) => (
							<li key={c.label} aria-current={!c.href && i === crumbs.length - 1 ? 'page' : undefined}>
								{c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
							</li>
						)).reduce<React.ReactNode[]>((all, li, i) => (i ? [...all, ' ', li] : [li]), [])}
					</ul>
				</div>
			</section>
			{/* End Page Title */}
		</>
	);
}
