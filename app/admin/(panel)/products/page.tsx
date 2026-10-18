/*
 * /admin/products: TechFiyr's own products, in the order they appear on /products.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Chip, PageHead } from '@/components/admin/ui';
import { formatDate, productPath } from '@/lib/content';
import { listProducts } from '@/lib/server/content';

export const metadata: Metadata = { title: 'Products' };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
	const { deleted } = await searchParams;
	const products = await listProducts();

	return (
		<>
			<PageHead
				title="Products"
				intro="Apps, SaaS and templates at techfiyr.com/products, in display order."
				actions={<Link className="admin-btn is-primary" href="/admin/products/new"><i className="fa-solid fa-plus" aria-hidden="true"></i> New product</Link>}
			/>
			{deleted && <p className="admin-alert is-good" role="status"><i className="fa-solid fa-circle-check" aria-hidden="true"></i> The product was deleted.</p>}

			{products.length === 0 ? (
				<div className="admin-empty">
					<p className="admin-empty_title">No products yet.</p>
					<p className="admin-muted">
						Add an app, SaaS or template TechFiyr offers. Each product gets its own page with screenshots, features, price and store links, plus
						product data for search engines. Until the first one is published, the products page says new products are on the way.
					</p>
					<Link className="admin-btn is-primary" href="/admin/products/new">Add the first product</Link>
				</div>
			) : (
				<div className="admin-table_wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th scope="col" className="is-num">#</th>
								<th scope="col">Product</th>
								<th scope="col">Status</th>
								<th scope="col" className="is-hide-m">Category</th>
								<th scope="col" className="is-hide-m">Price</th>
								<th scope="col" className="is-hide-m">Updated</th>
								<th scope="col"><span className="sr-only">Actions</span></th>
							</tr>
						</thead>
						<tbody>
							{products.map((p) => (
								<tr key={p.id}>
									<td className="is-num">{p.order}</td>
									<td>
										<Link className="admin-table_title" href={`/admin/products/${p.id}`}>{p.name || 'Untitled'}</Link>
										<span className="admin-table_sub">{p.tagline}</span>
									</td>
									<td>{p.status === 'published' ? <Chip tone="good">Published</Chip> : <Chip tone="draft">Draft</Chip>}</td>
									<td className="is-hide-m">{p.category}</td>
									<td className="is-hide-m">{p.price || '–'}</td>
									<td className="is-hide-m">{formatDate(p.updatedAt)}</td>
									<td className="admin-table_actions">
										<Link href={`/admin/products/${p.id}`}>Edit<span className="sr-only"> {p.name}</span></Link>
										{p.status === 'published' && <a href={productPath(p)} target="_blank" rel="noopener">View<span className="sr-only"> {p.name} (opens in a new tab)</span></a>}
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
