/*
 * /indexnow-key.txt: proves to IndexNow engines (Bing, Yandex, Seznam, Naver) that the pings sent by
 * lib/server/insights.ts come from this site. The key is the INDEXNOW_KEY environment variable.
 */
import { indexNowKey } from '@/lib/server/insights';

export const dynamic = 'force-dynamic';

export function GET() {
	const key = indexNowKey();
	if (!key) return new Response('Not found', { status: 404 });
	return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
