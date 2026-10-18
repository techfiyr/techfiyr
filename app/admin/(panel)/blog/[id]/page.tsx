/*
 * /admin/blog/new and /admin/blog/<id>: write or edit a post (components/admin/PostForm.tsx).
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostForm from '@/components/admin/PostForm';
import { PageHead } from '@/components/admin/ui';
import { AUTHORS } from '@/lib/content';
import { toPost } from '@/lib/server/content';
import { store } from '@/lib/server/store';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	return { title: (await params).id === 'new' ? 'New post' : 'Edit post' };
}

export default async function EditPostPage({ params, searchParams }: Props) {
	const { id } = await params;
	const { saved } = await searchParams;
	const doc = id === 'new' ? null : await store.get('posts', id);
	if (id !== 'new' && !doc) notFound();
	const post = doc ? toPost(doc) : null;

	return (
		<>
			<PageHead title={post ? 'Edit post' : 'New post'} intro={post ? post.title : 'Drafts stay private until you publish them.'} />
			<PostForm post={post} authors={AUTHORS.map((a) => a.name)} saved={Boolean(saved)} />
		</>
	);
}
