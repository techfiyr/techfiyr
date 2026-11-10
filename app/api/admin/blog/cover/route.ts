/*
 * POST /api/admin/blog/cover: fetches and stores a blog cover image (Pollinations / Unsplash fallback)
 * asynchronously after the article draft text has already loaded in the editor.
 */
import { NextResponse } from 'next/server';
import { currentAdmin } from '@/lib/server/auth';
import { fetchAndSaveCover } from '@/lib/server/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
	const admin = await currentAdmin();
	if (!admin) {
		return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	let body: { prompt?: string; title?: string };
	try {
		body = (await req.json()) as { prompt?: string; title?: string };
	} catch {
		return NextResponse.json({ ok: false, error: 'Invalid JSON request.' }, { status: 400 });
	}

	const title = typeof body.title === 'string' ? body.title.trim() : 'TechFiyr Engineering Article';
	const prompt = typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt.trim() : `${title}, modern software engineering workspace`;

	const cover = await fetchAndSaveCover(prompt, title);
	return NextResponse.json(
		{ ok: Boolean(cover.coverUrl), coverUrl: cover.coverUrl, coverAlt: cover.coverAlt },
		{ headers: { 'X-Robots-Tag': 'noindex' } },
	);
}

