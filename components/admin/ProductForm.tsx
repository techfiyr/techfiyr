'use client';

/*
 * Product editor (/admin/products/new, /admin/products/<id>): TechFiyr's own apps, SaaS and
 * templates. Saves through the saveProduct action (app/admin/actions.ts).
 */
import { useActionState, useState } from 'react';
import { deleteProduct, saveProduct, type FormState } from '@/app/admin/actions';
import { productPath, slugify, type Product } from '@/lib/content';
import { CoverField, DeleteBox, SearchPreview, TextField } from './fields';
import MarkdownEditor from './MarkdownEditor';
import SubmitButton from './SubmitButton';

const CATEGORIES = ['Mobile app', 'SaaS', 'Web app', 'Template', 'Developer tool', 'AI tool'];

export default function ProductForm({ product, saved }: { product: Product | null; saved: boolean }) {
	const [state, action] = useActionState<FormState, FormData>(saveProduct, undefined);
	const f = state?.fields;
	const link = (n: number, k: 'label' | 'url') => f?.[`link${k === 'label' ? 'Label' : 'Url'}${n}`] ?? product?.links[n - 1]?.[k] ?? '';
	const [v, setV] = useState({
		name: f?.name ?? product?.name ?? '',
		slug: f?.slug ?? product?.slug ?? '',
		tagline: f?.tagline ?? product?.tagline ?? '',
		description: f?.description ?? product?.description ?? '',
		category: f?.category ?? product?.category ?? CATEGORIES[0],
		platforms: f?.platforms ?? product?.platforms.join(', ') ?? '',
		price: f?.price ?? product?.price ?? '',
		features: f?.features ?? product?.features.join('\n') ?? '',
		coverAlt: f?.coverAlt ?? product?.coverAlt ?? '',
		gallery: f?.gallery ?? product?.gallery.join('\n') ?? '',
		order: f?.order ?? String(product?.order ?? 100),
		seoTitle: f?.seoTitle ?? product?.seoTitle ?? '',
		seoDescription: f?.seoDescription ?? product?.seoDescription ?? '',
		linkLabel1: link(1, 'label'),
		linkUrl1: link(1, 'url'),
		linkLabel2: link(2, 'label'),
		linkUrl2: link(2, 'url'),
		linkLabel3: link(3, 'label'),
		linkUrl3: link(3, 'url'),
	});
	const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
	const set = (key: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [key]: value }));
	const slug = slugTouched ? v.slug : slugify(v.name);
	const live = product?.status === 'published';

	return (
		<>
			<form className="admin-editor" action={action} noValidate>
				<input type="hidden" name="id" value={product?.id || ''} />
				<div className="admin-editor_main">
					{saved && !state?.error && (
						<p className="admin-alert is-good" role="status">
							<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Saved. {live && <a href={productPath(product!)} target="_blank" rel="noopener">View the live page<span className="sr-only"> (opens in a new tab)</span></a>}
						</p>
					)}
					{state?.error && (
						<p className="admin-alert is-error" role="alert">
							<i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {state.error}
						</p>
					)}
					<TextField id="product-name" name="name" label="Product name" value={v.name} onChange={set('name')} max={120} required />
					<TextField
						id="product-slug"
						name="slug"
						label="Page address"
						prefix="techfiyr.com/products/"
						value={slug}
						onChange={(x) => {
							setSlugTouched(true);
							set('slug')(slugify(x) || x.toLowerCase());
						}}
						max={100}
						hint="Lower-case words with dashes. Filled in from the name until you change it."
					/>
					<TextField id="product-tagline" name="tagline" label="Tagline" value={v.tagline} onChange={set('tagline')} max={200} ideal={120} hint="One line on what it does and for whom." />
					<MarkdownEditor
						id="product-description"
						name="description"
						label="Description"
						value={v.description}
						onChange={set('description')}
						folder="products"
						rows={12}
						hint="Open with what the product does and who it is for, then how it works. Headings phrased as questions help search and AI answers."
					/>
					<div className="admin-field">
						<div className="admin-field_row">
							<label htmlFor="product-features">Key features</label>
						</div>
						<textarea id="product-features" name="features" rows={6} value={v.features} onChange={(e) => set('features')(e.target.value)} aria-describedby="product-features-hint" />
						<p className="admin-hint" id="product-features-hint">One per line. Shown as a checklist on the product page.</p>
					</div>
					<fieldset className="admin-fieldset">
						<legend>Links</legend>
						<p className="admin-hint">Store pages, a live demo, a sign-up page. Each must start with https://</p>
						{[1, 2, 3].map((n) => (
							<div className="admin-pair" key={n}>
								<TextField id={`product-link-label-${n}`} name={`linkLabel${n}`} label={`Button ${n} text`} value={v[`linkLabel${n}` as keyof typeof v]} onChange={set(`linkLabel${n}` as keyof typeof v)} max={40} placeholder={n === 1 ? 'Google Play' : n === 2 ? 'App Store' : 'Live demo'} />
								<TextField id={`product-link-url-${n}`} name={`linkUrl${n}`} label={`Button ${n} address`} value={v[`linkUrl${n}` as keyof typeof v]} onChange={set(`linkUrl${n}` as keyof typeof v)} max={500} type="url" inputMode="url" placeholder="https://" />
							</div>
						))}
					</fieldset>
				</div>

				<aside className="admin-editor_side">
					<section className="admin-box">
						<h2>Publish</h2>
						<p className="admin-muted">{live ? 'This product is live.' : product ? 'This product is a draft: only you can see it.' : 'Save a draft any time; publish when it is ready.'}</p>
						<div className="admin-box_actions">
							<SubmitButton className="admin-btn is-primary is-wide" name="status" value="published" pending={live ? 'Updating…' : 'Publishing…'}>
								{live ? 'Update live page' : 'Publish'}
							</SubmitButton>
							<SubmitButton className="admin-btn is-quiet is-wide" name="status" value="draft" pending="Saving…">
								{live ? 'Unpublish (back to draft)' : 'Save draft'}
							</SubmitButton>
						</div>
					</section>

					<section className="admin-box">
						<h2>Details</h2>
						<div className="admin-field">
							<label htmlFor="product-category">Category</label>
							<select id="product-category" name="category" value={v.category} onChange={(e) => set('category')(e.target.value)}>
								{[...new Set([...CATEGORIES, v.category])].filter(Boolean).map((c) => <option key={c}>{c}</option>)}
							</select>
						</div>
						<TextField id="product-platforms" name="platforms" label="Platforms" value={v.platforms} onChange={set('platforms')} max={200} hint="Separated by commas, e.g. Android, iOS, Web" />
						<TextField id="product-price" name="price" label="Price" value={v.price} onChange={set('price')} max={60} hint="Shown as written: “Free”, “$19/month”, “Contact us”. Leave empty to hide." />
						<TextField id="product-order" name="order" label="Position on the products page" value={v.order} onChange={set('order')} max={6} inputMode="numeric" hint="Lower numbers come first." />
					</section>

					<section className="admin-box">
						<h2>Images</h2>
						<CoverField id="product-cover" current={product?.coverUrl || ''} alt={v.coverAlt} onAlt={set('coverAlt')} label="Main image" />
						<div className="admin-field">
							<label htmlFor="product-gallery-files">Add screenshots</label>
							<input id="product-gallery-files" className="admin-file is-visible" type="file" name="galleryFiles" multiple accept="image/jpeg,image/png,image/webp,image/avif" />
						</div>
						<div className="admin-field">
							<label htmlFor="product-gallery">Screenshots on the page</label>
							<textarea id="product-gallery" name="gallery" rows={3} value={v.gallery} onChange={(e) => set('gallery')(e.target.value)} aria-describedby="product-gallery-hint" />
							<p className="admin-hint" id="product-gallery-hint">One image address per line; delete a line to remove that screenshot.</p>
						</div>
					</section>

					<section className="admin-box">
						<h2>Search appearance</h2>
						<SearchPreview title={v.seoTitle || `${v.name} | TechFiyr Products`} description={v.seoDescription || v.tagline} path={`/products/${slug}`} />
						<TextField id="product-seo-title" name="seoTitle" label="Search title" value={v.seoTitle} onChange={set('seoTitle')} max={70} ideal={60} hint="Optional. Leave empty to use “Name | TechFiyr Products”." />
						<TextField id="product-seo-desc" name="seoDescription" label="Search description" multiline value={v.seoDescription} onChange={set('seoDescription')} max={170} ideal={160} hint="Optional. Leave empty to use the tagline." />
					</section>
				</aside>
			</form>
			{product && <DeleteBox what="product" action={deleteProduct} id={product.id} />}
		</>
	);
}
