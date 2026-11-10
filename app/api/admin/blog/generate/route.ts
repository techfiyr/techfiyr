/*
 * POST /api/admin/blog/generate: fast JSON endpoint for the admin Blog AI writer.
 * Generates article copy (without blocking on cover image fetch) so requests stay
 * well under serverless function timeouts.
 */
import { NextResponse } from 'next/server';
import { currentAdmin } from '@/lib/server/auth';
import { generateBlogWithGemini } from '@/lib/server/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
	const admin = await currentAdmin();
	if (!admin) {
		return NextResponse.json({ ok: false, error: 'Session expired. Please sign in to /admin again.' }, { status: 401 });
	}

	let body: { topic?: string; author?: string };
	try {
		body = (await req.json()) as { topic?: string; author?: string };
	} catch {
		return NextResponse.json({ ok: false, error: 'Invalid JSON request.' }, { status: 400 });
	}

	const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
	const author = typeof body.author === 'string' ? body.author.trim() : undefined;
	const result = await generateBlogWithGemini(topic, author, { skipCover: true });

	return NextResponse.json(result, {
		status: result.ok ? 200 : 502,
		headers: { 'X-Robots-Tag': 'noindex' },
	});
}

