/*
 * Images uploaded in the admin panel (server only).
 *
 * Where they are kept:
 *   default        Firestore, on the free Spark plan: "media" holds each image's details and
 *                  "media_chunks" its bytes in pieces under Firestore's 1 MiB document limit.
 *   MEDIA_STORE=storage   the private Firebase Storage bucket (FIREBASE_STORAGE_BUCKET; needs the
 *                  Blaze plan for new buckets). Images already in Firestore keep working.
 *   no credentials (development)   files in .data/uploads/.
 * Visitors always load them from our own address, /media/<name> (app/media/[...path]/route.ts), so no
 * request goes to Google before consent, and the CDN caches each file for a year: names are unique,
 * so a changed image gets a new address and Firestore is read about once per image, not per visit.
 */
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GoogleError, SCOPES, accessToken, env, googleError } from './google';
import { store, storeMode } from './store';

export const IMAGE_TYPES: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/gif': 'gif',
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const LOCAL_DIR = path.join(process.cwd(), '.data', 'uploads');
const bucket = () => env('FIREBASE_STORAGE_BUCKET');
const NAME = /^cms\/[a-z0-9-]+\/[a-z0-9-]+\.(jpg|png|webp|avif|gif)$/;
const CHUNK_BYTES = 900_000;
const useBucket = () => env('MEDIA_STORE') === 'storage' && Boolean(bucket());
const docIdOf = (name: string) => name.replace(/\//g, '__');

export const mediaUrl = (name: string) => `/${name.replace(/^cms\//, 'media/')}`;

/** Saves an uploaded image and returns its public address (/media/...). */
export async function saveImage(file: File, folder: 'blog' | 'products'): Promise<string> {
	const ext = IMAGE_TYPES[file.type];
	if (!ext) throw new Error('Use a JPG, PNG, WebP, AVIF or GIF image.');
	if (file.size > MAX_IMAGE_BYTES) throw new Error('Images can be 5 MB at most. Resize it to about 1600px wide first.');

	const base = path.parse(file.name).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'image';
	const name = `cms/${folder}/${base}-${randomUUID().slice(0, 8)}.${ext}`;
	const bytes = Buffer.from(await file.arrayBuffer());

	if (storeMode() === 'firestore' && !useBucket()) {
		const id = docIdOf(name);
		const chunks = Math.ceil(bytes.length / CHUNK_BYTES);
		for (let i = 0; i < chunks; i++) {
			await store.put('media_chunks', `${id}--${i}`, { data: new Uint8Array(bytes.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES)) });
		}
		// written last, so a half-finished upload is never served
		await store.put('media', id, { name, type: file.type, size: bytes.length, chunks, createdAt: new Date().toISOString() });
	} else if (storeMode() === 'firestore') {
		const token = await accessToken(SCOPES.storage);
		const res = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket())}/o?uploadType=media&name=${encodeURIComponent(name)}`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type },
			body: bytes,
			cache: 'no-store',
		});
		if (!res.ok) throw new GoogleError('upload', res.status, await googleError(res));
	} else if (storeMode() === 'local') {
		const target = path.join(LOCAL_DIR, name);
		await fs.mkdir(path.dirname(target), { recursive: true });
		await fs.writeFile(target, bytes);
	} else {
		throw new Error('Image storage is not configured.');
	}
	return mediaUrl(name);
}

/** Reads a stored image for /media/... ; null when it does not exist. */
export async function readImage(name: string): Promise<{ body: Uint8Array; type: string } | null> {
	if (!NAME.test(name)) return null;
	const type = Object.entries(IMAGE_TYPES).find(([, e]) => name.endsWith(`.${e}`))?.[0] || 'application/octet-stream';

	if (storeMode() === 'firestore') {
		const meta = await store.get('media', docIdOf(name));
		if (meta) {
			const id = docIdOf(name);
			const parts = await Promise.all(Array.from({ length: Number(meta.chunks) || 0 }, (_, i) => store.get('media_chunks', `${id}--${i}`)));
			if (parts.some((d) => !(d?.data instanceof Uint8Array))) return null;
			return { body: new Uint8Array(Buffer.concat(parts.map((d) => d!.data as Uint8Array))), type: String(meta.type || type) };
		}
		if (!bucket()) return null;
		const token = await accessToken(SCOPES.storage);
		const res = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket())}/o/${encodeURIComponent(name)}?alt=media`, {
			headers: { Authorization: `Bearer ${token}` },
			cache: 'no-store',
		});
		if (res.status === 404) return null;
		if (!res.ok) throw new GoogleError('media', res.status, await googleError(res));
		return { body: new Uint8Array(await res.arrayBuffer()), type };
	}
	if (storeMode() === 'local') {
		try {
			return { body: new Uint8Array(await fs.readFile(path.join(LOCAL_DIR, name))), type };
		} catch {
			return null;
		}
	}
	return null;
}
