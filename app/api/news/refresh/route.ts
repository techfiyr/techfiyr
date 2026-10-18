/*
 * POST /api/news/refresh: fetches today's top 10 AI stories (lib/server/news.ts) and refreshes the
 * /news page. Called once a day by the scheduled function netlify/functions/news-daily.mjs with
 * "Authorization: Bearer <CRON_SECRET>". The admin panel uses a server action instead.
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { TAGS } from '@/lib/server/content';
import { pingIndexNow } from '@/lib/server/insights';
import { refreshNews } from '@/lib/server/news';

export const maxDuration = 60;

function authorised(req: Request): boolean {
	const secret = (process.env.CRON_SECRET || '').trim();
	const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
	if (secret.length < 24 || !given) return false;
	const a = Buffer.from(given);
	const b = Buffer.from(secret);
	return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
	if (!authorised(req)) return Response.json({ error: 'unauthorised' }, { status: 401 });
	try {
		const run = await refreshNews();
		revalidateTag(TAGS.news, { expire: 0 });
		revalidatePath('/news');
		if (run.stored) await pingIndexNow(['/news']);
		return Response.json(run, { status: run.ok ? 200 : 502 });
	} catch (err) {
		console.error('news refresh:', err instanceof Error ? err.message : err);
		return Response.json({ error: 'refresh failed', detail: err instanceof Error ? err.message.slice(0, 300) : '' }, { status: 500 });
	}
}
