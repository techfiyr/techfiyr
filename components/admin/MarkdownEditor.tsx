'use client';

/*
 * Markdown field for posts and product descriptions: a toolbar for the common marks, image upload
 * (stored through the uploadInlineImage action, inserted as ![alt](/media/...)), and a preview tab
 * that renders exactly what the public page will show (lib/markdown.tsx).
 */
import { useRef, useState } from 'react';
import { uploadInlineImage } from '@/app/admin/actions';
import { Markdown } from '@/lib/markdown';

type Props = {
	id: string;
	name: string;
	label: string;
	value: string;
	onChange: (v: string) => void;
	folder: 'blog' | 'products';
	hint?: React.ReactNode;
	rows?: number;
	required?: boolean;
};

const TOOLS: { label: string; icon: string; before: string; after?: string; block?: boolean; placeholder: string }[] = [
	{ label: 'Heading', icon: 'fa-heading', before: '## ', block: true, placeholder: 'Question your readers ask' },
	{ label: 'Subheading', icon: 'fa-heading is-small', before: '### ', block: true, placeholder: 'Subheading' },
	{ label: 'Bold', icon: 'fa-bold', before: '**', after: '**', placeholder: 'bold text' },
	{ label: 'Italic', icon: 'fa-italic', before: '*', after: '*', placeholder: 'italic text' },
	{ label: 'Link', icon: 'fa-link', before: '[', after: '](https://)', placeholder: 'link text' },
	{ label: 'Bulleted list', icon: 'fa-list-ul', before: '- ', block: true, placeholder: 'List item' },
	{ label: 'Numbered list', icon: 'fa-list-ol', before: '1. ', block: true, placeholder: 'First step' },
	{ label: 'Quote', icon: 'fa-quote-left', before: '> ', block: true, placeholder: 'Quote' },
	{ label: 'Code', icon: 'fa-code', before: '`', after: '`', placeholder: 'code' },
	{ label: 'Table', icon: 'fa-table-cells', before: '| Option | Best for |\n| --- | --- |\n| ', after: ' |  |', block: true, placeholder: 'Flutter' },
];

export default function MarkdownEditor({ id, name, label, value, onChange, folder, hint, rows = 18, required }: Props) {
	const area = useRef<HTMLTextAreaElement>(null);
	const file = useRef<HTMLInputElement>(null);
	const [tab, setTab] = useState<'write' | 'preview'>('write');
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');

	function insert(before: string, after = '', placeholder = '', block = false) {
		const el = area.current;
		if (!el) return;
		const { selectionStart: s, selectionEnd: e } = el;
		const selected = value.slice(s, e) || placeholder;
		const lead = block && s > 0 && value[s - 1] !== '\n' ? '\n\n' : '';
		const next = value.slice(0, s) + lead + before + selected + after + value.slice(e);
		onChange(next);
		const start = s + lead.length + before.length;
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(start, start + selected.length);
		});
	}

	async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (!f) return;
		setUploading(true);
		setUploadError('');
		const fd = new FormData();
		fd.set('file', f);
		fd.set('folder', folder);
		const res = await uploadInlineImage(undefined, fd);
		setUploading(false);
		e.target.value = '';
		if (res?.url) {
			const alt = f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
			insert(`![${alt}](${res.url} "`, '")', 'Caption (optional)', true);
		} else setUploadError(res?.error || 'The image could not be uploaded.');
	}

	return (
		<div className="admin-field admin-md">
			<div className="admin-md_head">
				<label htmlFor={id}>{label}</label>
				<div className="admin-md_tabs" role="tablist" aria-label={`${label} view`}>
					<button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>Write</button>
					<button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
				</div>
			</div>
			{tab === 'write' && (
				<div className="admin-md_toolbar" role="toolbar" aria-label="Formatting" aria-controls={id}>
					{TOOLS.map((t) => (
						<button key={t.label} type="button" title={t.label} onClick={() => insert(t.before, t.after, t.placeholder, t.block)}>
							<i className={`fa-solid ${t.icon}`} aria-hidden="true"></i>
							<span className="sr-only">{t.label}</span>
						</button>
					))}
					<button type="button" title="Upload an image" onClick={() => file.current?.click()} disabled={uploading}>
						{uploading ? <span className="admin-spinner" aria-hidden="true"></span> : <i className="fa-solid fa-image" aria-hidden="true"></i>}
						<span className="sr-only">{uploading ? 'Uploading image' : 'Upload an image'}</span>
					</button>
					<input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" hidden onChange={onImage} tabIndex={-1} />
				</div>
			)}
			<textarea
				ref={area}
				id={id}
				name={name}
				rows={rows}
				value={value}
				required={required}
				onChange={(e) => onChange(e.target.value)}
				hidden={tab !== 'write'}
				aria-describedby={`${id}-hint`}
				spellCheck
			/>
			{tab === 'preview' && (
				<div className="admin-md_preview article-body" aria-live="polite">
					{value.trim() ? <Markdown source={value} /> : <p className="admin-muted">Nothing to preview yet.</p>}
				</div>
			)}
			<p className="admin-hint" id={`${id}-hint`}>
				{uploadError ? <span className="admin-hint_error" role="alert">{uploadError} </span> : null}
				{hint}
			</p>
		</div>
	);
}
