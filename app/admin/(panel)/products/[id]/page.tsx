/*
 * /admin/products/new and /admin/products/<id>: add or edit a product (components/admin/ProductForm.tsx).
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { PageHead } from '@/components/admin/ui';
import { toProduct } from '@/lib/server/content';
import { store } from '@/lib/server/store';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	return { title: (await params).id === 'new' ? 'New product' : 'Edit product' };
}

export default async function EditProductPage({ params, searchParams }: Props) {
	const { id } = await params;
	const { saved } = await searchParams;
	const doc = id === 'new' ? null : await store.get('products', id);
	if (id !== 'new' && !doc) notFound();
	const product = doc ? toProduct(doc) : null;

	return (
		<>
			<PageHead title={product ? 'Edit product' : 'New product'} intro={product ? product.name : 'Apps, SaaS and templates made by TechFiyr.'} />
			<ProductForm product={product} saved={Boolean(saved)} />
		</>
	);
}
