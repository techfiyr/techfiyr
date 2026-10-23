'use client';

/*
 * Form fields shared by the post and product editors: text with a character counter, cover image
 * with preview, the Google result preview, and the delete confirmation.
 */
import { useEffect, useState } from 'react';
import SubmitButton from './SubmitButton';

type TextProps = {
	id: string;
	name: string;
	label: string;
	value: string;
	onChange: (v: string) => void;
	hint?: React.ReactNode;
	max?: number;
	/** counter turns amber past this many characters */
	ideal?: number;
	multiline?: boolean;
	required?: boolean;
	prefix?: string;
	placeholder?: string;
	type?: string;
	inputMode?: 'numeric' | 'url' | 'text';
};

export function TextField({ id, name, label, value, onChange, hint, max, ideal, multiline, required, prefix, placeholder, type = 'text', inputMode }: TextProps) {
	const over = ideal ? value.length > ideal : false;
	const describedBy = [hint ? `${id}-hint` : '', ideal ? `${id}-count` : ''].filter(Boolean).join(' ') || undefined;
	const common = {
		id,
		name,
		value,
		required,
		placeholder,
		maxLength: max,
		'aria-describedby': describedBy,
	};
	return (
		<div className="admin-field">
			<div className="admin-field_row">
				<label htmlFor={id}>
					{label}
					{required && <span className="admin-required" aria-hidden="true"> *</span>}
				</label>
				{ideal && (
					<span id={`${id}-count`} className={over ? 'admin-count is-over' : 'admin-count'} aria-live="polite">
						{value.length}/{ideal}
						<span className="sr-only"> characters{over ? ', longer than search engines show' : ''}</span>
					</span>
				)}
			</div>
			{prefix ? (
				<div className="admin-prefix">
					<span aria-hidden="true">{prefix}</span>
					<input {...common} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
				</div>
			) : multiline ? (
				<textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
			) : (
				<input {...common} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
			)}
			{hint && <p className="admin-hint" id={`${id}-hint`}>{hint}</p>}
		</div>
	);
}

export function CoverField({ id, current, alt, onAlt, label = 'Cover image' }: { id: string; current: string; alt: string; onAlt: (v: string) => void; label?: string }) {
	const [preview, setPreview] = useState('');
	const [remove, setRemove] = useState(false);
	useEffect(() => {
		setRemove(false);
	}, [current]);
	useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
	const shown = remove ? '' : preview || current;

	return (
		<div className="admin-field admin-cover">
			<span className="admin-label">{label}</span>
			<div className={shown ? 'admin-cover_frame' : 'admin-cover_frame is-empty'}>
				{shown ? <img src={shown} alt="" /> : <span><i className="fa-solid fa-image" aria-hidden="true"></i> No image</span>}
			</div>
			<input type="hidden" name="coverUrl" value={current} />
			<label className="admin-btn is-quiet is-file" htmlFor={`${id}-file`}>
				<i className="fa-solid fa-upload" aria-hidden="true"></i> {shown ? 'Replace image' : 'Upload image'}
			</label>
			<input
				id={`${id}-file`}
				className="admin-file"
				type="file"
				name="coverFile"
				accept="image/jpeg,image/png,image/webp,image/avif"
				aria-describedby={`${id}-hint`}
				onChange={(e) => {
					const f = e.target.files?.[0];
					setRemove(false);
					setPreview(f ? URL.createObjectURL(f) : '');
				}}
			/>
			{current && (
				<label className="admin-check">
					<input type="checkbox" name="removeCover" checked={remove} onChange={(e) => setRemove(e.target.checked)} /> Remove the image
				</label>
			)}
			<p className="admin-hint" id={`${id}-hint`}>JPG, PNG, WebP or AVIF, up to 5 MB. 1600 × 1000 px works best (16:10).</p>
			<div className="admin-field">
				<label htmlFor={`${id}-alt`}>Image description (alt text)</label>
				<input id={`${id}-alt`} name="coverAlt" value={alt} maxLength={200} onChange={(e) => onAlt(e.target.value)} aria-describedby={`${id}-alt-hint`} />
				<p className="admin-hint" id={`${id}-alt-hint`}>What the image shows, for screen readers and image search.</p>
			</div>
		</div>
	);
}

/** How the page may look in Google results. */
export function SearchPreview({ title, description, path }: { title: string; description: string; path: string }) {
	const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
	return (
		<div className="admin-serp" aria-label="Google result preview">
			<span className="admin-serp_url">techfiyr.com{path.replace(/\//g, ' › ').replace(/^ › /, ' › ')}</span>
			<span className="admin-serp_title">{cut(title || 'Page title', 60)}</span>
			<span className="admin-serp_text">{cut(description || 'Add a summary to control the text under your result.', 160)}</span>
		</div>
	);
}

/** Two-step delete without a modal: open the box, then confirm. */
export function DeleteBox({ what, action, id }: { what: string; action: (fd: FormData) => void; id: string }) {
	return (
		<details className="admin-danger">
			<summary>
				<i className="fa-solid fa-trash-can" aria-hidden="true"></i> Delete this {what}
			</summary>
			<form action={action}>
				<input type="hidden" name="id" value={id} />
				<p>The {what} and its page are removed from the website straight away. This cannot be undone.</p>
				<SubmitButton className="admin-btn is-danger" pending="Deleting…">Yes, delete the {what}</SubmitButton>
			</form>
		</details>
	);
}
