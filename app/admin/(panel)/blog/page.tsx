/*
 * /admin/blog: every blog post, newest first, filtered by status. Data: lib/server/content.ts.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Chip, PageHead } from '@/components/admin/ui';
import { formatDate, postPath } from '@/lib/content';
import { listPosts } from '@/lib/server/content';

export const metadata: Metadata = { title: 'Blog' };

const FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'published', label: 'Published' },
	{ key: 'draft', label: 'Drafts' },
] as const;

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ status?: string; deleted?: string }> }) {
	const { status = 'all', deleted } = await searchParams;
	const posts = await listPosts();
	const shown = posts.filter((p) => status === 'all' || p.status === status);

	return (
		<>
			<PageHead
				title="Blog"
				intro="Articles at techfiyr.com/blog. Drafts stay private until you publish them."
				actions={<Link className="admin-btn is-primary" href="/admin/blog/new"><i className="fa-solid fa-plus" aria-hidden="true"></i> New post</Link>}
			/>
			{deleted && <p className="admin-alert is-good" role="status"><i className="fa-solid fa-circle-check" aria-hidden="true"></i> The post was deleted.</p>}

			<nav className="admin-tabs" aria-label="Filter posts">
				{FILTERS.map((f) => (
					<Link key={f.key} href={f.key === 'all' ? '/admin/blog' : `/admin/blog?status=${f.key}`} aria-current={status === f.key ? 'page' : undefined}>
						{f.label} <span>{f.key === 'all' ? posts.length : posts.filter((p) => p.status === f.key).length}</span>
					</Link>
				))}
			</nav>

			{shown.length === 0 ? (
				<div className="admin-empty">
					<p className="admin-empty_title">{posts.length ? 'No posts with this status.' : 'No blog posts yet.'}</p>
					<p className="admin-muted">
						Write about what clients ask before they hire you: costs, timelines, Flutter or React Native, how a release works. Each post gets its own page,
						a place in the sitemap and article data for Google and AI assistants.
					</p>
					<Link className="admin-btn is-primary" href="/admin/blog/new">Write the first post</Link>
				</div>
			) : (
				<div className="admin-table_wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th scope="col">Title</th>
								<th scope="col">Status</th>
								<th scope="col" className="is-hide-m">Author</th>
								<th scope="col" className="is-hide-m">Updated</th>
								<th scope="col"><span className="sr-only">Actions</span></th>
							</tr>
						</thead>
						<tbody>
							{shown.map((p) => (
								<tr key={p.id}>
									<td>
										<Link className="admin-table_title" href={`/admin/blog/${p.id}`}>{p.title || 'Untitled'}</Link>
										<span className="admin-table_sub">/blog/{p.slug}</span>
									</td>
									<td>{p.status === 'published' ? <Chip tone="good">Published</Chip> : <Chip tone="draft">Draft</Chip>}</td>
									<td className="is-hide-m">{p.author}</td>
									<td className="is-hide-m">{formatDate(p.updatedAt)}</td>
									<td className="admin-table_actions">
										<Link href={`/admin/blog/${p.id}`}>Edit<span className="sr-only"> {p.title}</span></Link>
										{p.status === 'published' && (
											<a href={postPath(p)} target="_blank" rel="noopener">View<span className="sr-only"> {p.title} (opens in a new tab)</span></a>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</>
	);
}
