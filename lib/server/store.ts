/*
 * Document store for the CMS (server only): blog posts, products, news, settings.
 *
 * Production: Cloud Firestore through its REST API with the site's service account (lib/server/google.ts).
 * Local development without credentials: JSON files in .data/ (git-ignored), so the admin panel and
 * the dynamic pages can be tried without a Firebase project. The file store is never used in production.
 *
 * Documents are plain JSON objects; dates are ISO strings.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GoogleError, SCOPES, accessToken, env, googleError, hasServiceAccount } from './google';

export type Data = Record<string, unknown>;
export type Doc<T = Data> = T & { id: string };

export type StoreMode = 'firestore' | 'local' | 'none';

export function storeMode(): StoreMode {
	if (hasServiceAccount()) return 'firestore';
	return process.env.NODE_ENV === 'production' ? 'none' : 'local';
}

export class StoreUnavailable extends Error {
	constructor() {
		super('The content database is not configured (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
	}
}

// ---------- Firestore value encoding ----------
type FsValue = Record<string, unknown>;

function encode(v: unknown): FsValue {
	if (v === null || v === undefined) return { nullValue: null };
	if (typeof v === 'boolean') return { booleanValue: v };
	if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
	if (typeof v === 'string') return { stringValue: v };
	if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
	if (typeof v === 'object') return { mapValue: { fields: encodeFields(v as Data) } };
	return { stringValue: String(v) };
}

function encodeFields(data: Data): Record<string, FsValue> {
	const out: Record<string, FsValue> = {};
	for (const [k, v] of Object.entries(data)) if (v !== undefined && k !== 'id') out[k] = encode(v);
	return out;
}

function decode(v: FsValue): unknown {
	if ('stringValue' in v) return v.stringValue;
	if ('integerValue' in v) return Number(v.integerValue);
	if ('doubleValue' in v) return Number(v.doubleValue);
	if ('booleanValue' in v) return v.booleanValue;
	if ('timestampValue' in v) return v.timestampValue;
	if ('nullValue' in v) return null;
	if ('arrayValue' in v) return (((v.arrayValue as { values?: FsValue[] }).values) || []).map(decode);
	if ('mapValue' in v) return decodeFields(((v.mapValue as { fields?: Record<string, FsValue> }).fields) || {});
	return null;
}

function decodeFields(fields: Record<string, FsValue>): Data {
	const out: Data = {};
	for (const [k, v] of Object.entries(fields)) out[k] = decode(v);
	return out;
}

const API = 'https://firestore.googleapis.com/v1/';
const root = () => `projects/${env('FIREBASE_PROJECT_ID')}/databases/(default)/documents`;
const docId = (name: string) => name.slice(name.lastIndexOf('/') + 1);

async function fsFetch(url: string, init: RequestInit = {}) {
	const token = await accessToken(SCOPES.datastore);
	return fetch(url, {
		...init,
		cache: 'no-store',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
	});
}

const firestore = {
	async list(collection: string): Promise<Doc[]> {
		const docs: Doc[] = [];
		let pageToken = '';
		do {
			const url = `${API}${root()}/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
			const res = await fsFetch(url);
			if (!res.ok) throw new GoogleError('list', res.status, await googleError(res));
			const body = (await res.json()) as { documents?: { name: string; fields?: Record<string, FsValue> }[]; nextPageToken?: string };
			for (const d of body.documents || []) docs.push({ ...decodeFields(d.fields || {}), id: docId(d.name) });
			pageToken = body.nextPageToken || '';
		} while (pageToken);
		return docs;
	},

	async get(collection: string, id: string): Promise<Doc | null> {
		const res = await fsFetch(`${API}${root()}/${collection}/${encodeURIComponent(id)}`);
		if (res.status === 404) return null;
		if (!res.ok) throw new GoogleError('get', res.status, await googleError(res));
		const d = (await res.json()) as { name: string; fields?: Record<string, FsValue> };
		return { ...decodeFields(d.fields || {}), id: docId(d.name) };
	},

	async put(collection: string, id: string, data: Data): Promise<void> {
		// PATCH without an update mask replaces the whole document and creates it when missing
		const res = await fsFetch(`${API}${root()}/${collection}/${encodeURIComponent(id)}`, {
			method: 'PATCH',
			body: JSON.stringify({ fields: encodeFields(data) }),
		});
		if (!res.ok) throw new GoogleError('put', res.status, await googleError(res));
	},

	async remove(collection: string, id: string): Promise<void> {
		const res = await fsFetch(`${API}${root()}/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' });
		if (!res.ok && res.status !== 404) throw new GoogleError('delete', res.status, await googleError(res));
	},
};

// ---------- Local JSON files (development only) ----------
const DATA_DIR = path.join(process.cwd(), '.data');
const fileOf = (collection: string) => path.join(DATA_DIR, `${collection.replace(/[^a-z0-9_-]/gi, '')}.json`);

async function readLocal(collection: string): Promise<Record<string, Data>> {
	try {
		return JSON.parse(await fs.readFile(fileOf(collection), 'utf8'));
	} catch {
		return {};
	}
}

async function writeLocal(collection: string, all: Record<string, Data>) {
	await fs.mkdir(DATA_DIR, { recursive: true });
	await fs.writeFile(fileOf(collection), JSON.stringify(all, null, '\t'));
}

const local = {
	async list(collection: string): Promise<Doc[]> {
		return Object.entries(await readLocal(collection)).map(([id, d]) => ({ ...d, id }));
	},
	async get(collection: string, id: string): Promise<Doc | null> {
		const d = (await readLocal(collection))[id];
		return d ? { ...d, id } : null;
	},
	async put(collection: string, id: string, data: Data): Promise<void> {
		const all = await readLocal(collection);
		const { id: _drop, ...rest } = data;
		all[id] = rest;
		await writeLocal(collection, all);
	},
	async remove(collection: string, id: string): Promise<void> {
		const all = await readLocal(collection);
		delete all[id];
		await writeLocal(collection, all);
	},
};

function backend() {
	const mode = storeMode();
	if (mode === 'firestore') return firestore;
	if (mode === 'local') return local;
	throw new StoreUnavailable();
}

export const store = {
	list: (collection: string) => backend().list(collection),
	get: (collection: string, id: string) => backend().get(collection, id),
	put: (collection: string, id: string, data: Data) => backend().put(collection, id, data),
	remove: (collection: string, id: string) => backend().remove(collection, id),
};
