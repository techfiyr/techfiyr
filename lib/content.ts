/*
 * Content types for the CMS (blog posts, products, AI news) shared by the public pages and the
 * admin panel. The documents live in Firestore (lib/server/store.ts); the admin panel edits them.
 */

export type Status = 'draft' | 'published';

export type Post = {
	id: string;
	slug: string;
	title: string;
	/** one or two sentences: card text, meta description fallback, answer-first summary */
	excerpt: string;
	/** Markdown (lib/markdown.tsx) */
	body: string;
	coverUrl: string;
	coverAlt: string;
	tags: string[];
	/** a real person from AUTHORS */
	author: string;
	status: Status;
	seoTitle: string;
	seoDescription: string;
	publishedAt: string;
	createdAt: string;
	updatedAt: string;
};

export type ProductLink = { label: string; url: string };

export type Product = {
	id: string;
	slug: string;
	name: string;
	/** one line under the name */
	tagline: string;
	/** Markdown */
	description: string;
	category: string;
	platforms: string[];
	/** shown as written, e.g. "Free", "$19/month", "Contact us" */
	price: string;
	features: string[];
	coverUrl: string;
	coverAlt: string;
	gallery: string[];
	links: ProductLink[];
	status: Status;
	/** lower comes first */
	order: number;
	seoTitle: string;
	seoDescription: string;
	createdAt: string;
	updatedAt: string;
};

export type NewsItem = {
	id: string;
	title: string;
	url: string;
	source: string;
	/** plain-text snippet from the publisher's feed, trimmed */
	summary: string;
	imageUrl: string;
	publishedAt: string;
	fetchedAt: string;
	/** day of the top-10 edition this story belongs to (YYYY-MM-DD) */
	day: string;
	/** position in that day's top 10 (1 = first) */
	rank: number;
	hidden: boolean;
	pinned: boolean;
};

export type NewsRun = {
	ranAt: string;
	ok: boolean;
	stored: number;
	feeds: { source: string; items: number; error?: string }[];
};

/** People who can sign a post (Article JSON-LD needs a real author). Facts as on the home page. */
export const AUTHORS = [
	{ name: 'Saurav Wahid', role: 'Founder & Mobile DevOps Lead', url: 'https://www.linkedin.com/in/sauravwahid/' },
	{ name: 'Viswajit Roy', role: 'Co-founder, Lead UI/UX Designer', url: 'https://www.linkedin.com/in/viswajitroy' },
	{ name: 'Ponir Saha', role: 'Co-Founder & CTO', url: 'https://www.linkedin.com/in/ponirsaha/' },
	{ name: 'Md Masud Parvez', role: 'Lead Android & iOS Developer', url: 'https://www.linkedin.com/in/masudparvez11/' },
	{ name: 'Sohanur Islam', role: 'Full-Stack Software Engineer', url: 'https://www.linkedin.com/in/sohanur-islam-b2a027145/' },
	{ name: 'Pranabesh Sarkar', role: 'AI/ML Engineer', url: '' },
	{ name: 'TechFiyr Team', role: 'TechFiyr', url: '' },
];

export const authorOf = (name: string) => AUTHORS.find((a) => a.name === name) || AUTHORS[0];

export const postPath = (p: Pick<Post, 'slug'>) => `/blog/${p.slug}`;
export const productPath = (p: Pick<Product, 'slug'>) => `/products/${p.slug}`;

/** "Flutter vs React Native in 2026!" -> "flutter-vs-react-native-in-2026" */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
		.replace(/-+$/g, '');
}

/** Rough reading time for a Markdown body (200 words a minute). */
export function readingMinutes(markdown: string): number {
	const words = markdown.replace(/[#*_`>\[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 200));
}

/** "2026-10-18T09:30:00Z" -> "18 October 2026" (fixed locale and time zone, so server and browser agree) */
export function formatDate(iso: string): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });
}
