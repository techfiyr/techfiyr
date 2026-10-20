'use client';

/*
 * Blog post editor (/admin/blog/new, /admin/blog/<id>). Saves through the savePost action
 * (app/admin/actions.ts): "Save draft" keeps the post private, "Publish" puts it live.
 * The fields follow AGENTS.md section 7.0: a summary that answers the reader's question, question
 * style headings, a real author, and a search title and description within Google's limits.
 */
import { useActionState, useState } from 'react';
import { deletePost, generatePostWithAi, savePost, type FormState } from '@/app/admin/actions';
import { postPath, readingMinutes, slugify, type Post } from '@/lib/content';
import { CoverField, DeleteBox, SearchPreview, TextField } from './fields';
import MarkdownEditor from './MarkdownEditor';
import SubmitButton from './SubmitButton';

const STARTER = `Start with a direct two or three sentence answer to the question in the title.

## The first question a client asks

Explain it with real details: tools, timelines, numbers you can stand behind.

## The next question

- A point
- Another point
`;

export default function PostForm({ post, authors, saved }: { post: Post | null; authors: string[]; saved: boolean }) {
	const [state, action] = useActionState<FormState, FormData>(savePost, undefined);
	const f = state?.fields;
	const [v, setV] = useState({
		title: f?.title ?? post?.title ?? '',
		slug: f?.slug ?? post?.slug ?? '',
		excerpt: f?.excerpt ?? post?.excerpt ?? '',
		body: f?.body ?? post?.body ?? STARTER,
		coverUrl: f?.coverUrl ?? post?.coverUrl ?? '',
		coverAlt: f?.coverAlt ?? post?.coverAlt ?? '',
		tags: f?.tags ?? post?.tags.join(', ') ?? '',
		author: f?.author ?? post?.author ?? authors[0],
		seoTitle: f?.seoTitle ?? post?.seoTitle ?? '',
		seoDescription: f?.seoDescription ?? post?.seoDescription ?? '',
	});
	const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
	const [aiPrompt, setAiPrompt] = useState('');
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState('');
	const [aiSuccess, setAiSuccess] = useState('');

	const set = (key: keyof typeof v) => (value: string) => setV((s) => ({ ...s, [key]: value }));
	const slug = slugTouched ? v.slug : slugify(v.title);
	const live = post?.status === 'published';

	const handleAiGenerate = async () => {
		const q = aiPrompt.trim();
		if (!q) {
			setAiError('Please enter a topic, idea, or notes for the article.');
			return;
		}
		setAiLoading(true);
		setAiError('');
		setAiSuccess('');
		try {
			const res = await generatePostWithAi(q, v.author);
			if (!res.ok) {
				setAiError(res.error);
			} else {
				const p = res.post;
				setV((prev) => ({
					...prev,
					title: p.title,
					slug: p.slug,
					excerpt: p.excerpt,
					body: p.body,
					tags: p.tags,
					author: p.author,
					seoTitle: p.seoTitle,
					seoDescription: p.seoDescription,
					coverUrl: p.coverUrl || prev.coverUrl,
					coverAlt: p.coverAlt || prev.coverAlt,
				}));
				setSlugTouched(true);
				setAiSuccess(
					p.coverUrl
						? '✨ Article and real cover image generated with human engineering voice! Review, refine, and publish below.'
						: '✨ Article generated with human engineering voice! Review, refine, and publish below.'
				);
			}
		} catch (err) {
			setAiError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
		} finally {
			setAiLoading(false);
		}
	};

	return (
		<>
			<form className="admin-editor" action={action} noValidate>
				<input type="hidden" name="id" value={post?.id || ''} />
				<div className="admin-editor_main">
					{/* Gemini AI Assistant Box */}
					<div className="admin-ai-box">
						<div className="admin-ai-box_header">
							<h3 className="admin-ai-box_title">
								<i className="fa-solid fa-pen-nib" aria-hidden="true"></i> Write with Gemini AI
							</h3>
							<span className="admin-ai-badge">Human Tone · Anti-AI Slop</span>
						</div>
						<p className="admin-ai-box_desc">
							Describe your idea, notes, or client question. Gemini 3.8 Flash crafts an in-depth, human-grade article with direct answers, question headings, technical details, and an auto-generated cover photo.
						</p>
						<div className="admin-field">
							<textarea
								rows={2}
								placeholder="e.g. How much does a Flutter MVP cost in 2026? Include breakdown of UI/UX, backend, and Codemagic CI/CD..."
								value={aiPrompt}
								onChange={(e) => setAiPrompt(e.target.value)}
								disabled={aiLoading}
							/>
						</div>
						{aiError && (
							<p className="admin-alert is-error" role="alert" style={{ marginTop: '10px' }}>
								<i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {aiError}
							</p>
						)}
						{aiSuccess && (
							<p className="admin-alert is-good" role="status" style={{ marginTop: '10px' }}>
								<i className="fa-solid fa-circle-check" aria-hidden="true"></i> {aiSuccess}
							</p>
						)}
						<div className="admin-ai-box_actions">
							<button
								type="button"
								className="admin-btn is-primary"
								onClick={handleAiGenerate}
								disabled={aiLoading}
							>
								<i className={aiLoading ? 'fa-solid fa-rotate fa-spin' : 'fa-solid fa-pen-nib'} aria-hidden="true"></i>{' '}
								{aiLoading ? 'Gemini 3.8 Flash is drafting your article (reasoning & writing takes ~45–80s)…' : 'Generate Full Draft with Gemini 3.8'}
							</button>
							{aiPrompt && !aiLoading && (
								<button
									type="button"
									className="admin-btn is-quiet"
									onClick={() => { setAiPrompt(''); setAiError(''); setAiSuccess(''); }}
								>
									Clear
								</button>
							)}
						</div>
					</div>

					{saved && !state?.error && (
						<p className="admin-alert is-good" role="status">
							<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Saved. {live && <a href={postPath(post!)} target="_blank" rel="noopener">View the live post<span className="sr-only"> (opens in a new tab)</span></a>}
						</p>
					)}
					{state?.error && (
						<p className="admin-alert is-error" role="alert">
							<i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {state.error}
						</p>
					)}
					<TextField id="post-title" name="title" label="Title" value={v.title} onChange={set('title')} max={160} required hint="Phrase it the way a client would search, e.g. “How much does a Flutter app cost in 2026?”" />
					<TextField
						id="post-slug"
						name="slug"
						label="Page address"
						prefix="techfiyr.com/blog/"
						value={slug}
						onChange={(x) => {
							setSlugTouched(true);
							set('slug')(slugify(x) || x.toLowerCase());
						}}
						max={100}
						hint={live ? 'Changing the address of a live post breaks links to it. Keep it unless you must.' : 'Lower-case words with dashes. Filled in from the title until you change it.'}
					/>
					<TextField
						id="post-excerpt"
						name="excerpt"
						label="Summary"
						multiline
						value={v.excerpt}
						onChange={set('excerpt')}
						max={400}
						ideal={200}
						hint="40–60 words that answer the title on their own. Shown on the blog card, at the top of the post and in search results."
					/>
					<MarkdownEditor
						id="post-body"
						name="body"
						label="Article"
						value={v.body}
						onChange={set('body')}
						folder="blog"
						hint={
							<>
								About {readingMinutes(v.body)} min read. Use <code>##</code> headings phrased as questions, short paragraphs, lists and tables. Links to
								<code>/contact</code> or <code>/projects</code> help readers take the next step.
							</>
						}
					/>
				</div>

				<aside className="admin-editor_side">
					<section className="admin-box">
						<h2>Publish</h2>
						<p className="admin-muted">
							{live ? 'This post is live.' : post ? 'This post is a draft: only you can see it.' : 'Save a draft any time; publish when it is ready.'}
						</p>
						<div className="admin-box_actions">
							<SubmitButton className="admin-btn is-primary is-wide" name="status" value="published" pending={live ? 'Updating…' : 'Publishing…'}>
								{live ? 'Update live post' : 'Publish'}
							</SubmitButton>
							<SubmitButton className="admin-btn is-quiet is-wide" name="status" value="draft" pending="Saving…">
								{live ? 'Unpublish (back to draft)' : 'Save draft'}
							</SubmitButton>
						</div>
					</section>

					<section className="admin-box">
						<h2>Details</h2>
						<div className="admin-field">
							<label htmlFor="post-author">Author</label>
							<select id="post-author" name="author" value={v.author} onChange={(e) => set('author')(e.target.value)}>
								{authors.map((a) => <option key={a}>{a}</option>)}
							</select>
						</div>
						<TextField id="post-tags" name="tags" label="Topics" value={v.tags} onChange={set('tags')} max={300} hint="Separated by commas, e.g. Flutter, App cost, Startups" />
					</section>

					<section className="admin-box">
						<h2>Image</h2>
						<CoverField id="post-cover" current={v.coverUrl} alt={v.coverAlt} onAlt={set('coverAlt')} />
					</section>

					<section className="admin-box">
						<h2>Search appearance</h2>
						<SearchPreview title={v.seoTitle || `${v.title} | TechFiyr Blog`} description={v.seoDescription || v.excerpt} path={`/blog/${slug}`} />
						<TextField id="post-seo-title" name="seoTitle" label="Search title" value={v.seoTitle} onChange={set('seoTitle')} max={70} ideal={60} hint="Optional. Leave empty to use “Title | TechFiyr Blog”." />
						<TextField id="post-seo-desc" name="seoDescription" label="Search description" multiline value={v.seoDescription} onChange={set('seoDescription')} max={170} ideal={160} hint="Optional. Leave empty to use the summary." />
					</section>
				</aside>
			</form>
			{post && <DeleteBox what="post" action={deletePost} id={post.id} />}
		</>
	);
}
