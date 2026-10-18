/*
 * /media/<folder>/<file>: images uploaded in the admin panel (lib/server/media.ts), served from our
 * own address. File names are unique, so the CDN and browsers may keep them for a year.
 */
import { readImage } from '@/lib/server/media';

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
	const name = `cms/${(await params).path.join('/')}`;
	try {
		const file = await readImage(name);
		if (!file) return new Response('Not found', { status: 404 });
		return new Response(file.body as BodyInit, {
			headers: {
				'Content-Type': file.type,
				'Cache-Control': 'public, max-age=31536000, immutable',
				'Netlify-CDN-Cache-Control': 'public, max-age=31536000, immutable',
				'X-Content-Type-Options': 'nosniff',
			},
		});
	} catch (err) {
		console.error('media:', err instanceof Error ? err.message : err);
		return new Response('Unavailable', { status: 502 });
	}
}
