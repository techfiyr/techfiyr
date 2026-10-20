/*
 * Gemini AI blog generator (server only).
 * Connects to Google Gemini 2.5 Flash to generate human-written blog articles
 * following strict anti-AI-slop rules, AEO question-first structure, and
 * realistic engineering depth tailored for TechFiyr.
 */
import { AUTHORS, slugify } from '@/lib/content';
import { env } from './google';
import { saveImage } from './media';

export type GeneratedBlogPost = {
	title: string;
	slug: string;
	excerpt: string;
	body: string;
	tags: string;
	author: string;
	seoTitle: string;
	seoDescription: string;
	coverUrl: string;
	coverAlt: string;
};

export function geminiApiKey(): string {
	let key = env('GEMINI_API_KEY') || env('API_KEY_GEMINI');
	if (/^(".*"|'.*')$/s.test(key)) key = key.slice(1, -1).trim();
	return key;
}

export function hasGeminiKey(): boolean {
	return Boolean(geminiApiKey());
}

const SYSTEM_INSTRUCTION = `You are a veteran principal mobile and web software engineer and technical lead at TechFiyr (https://techfiyr.com), a premier software development agency in Mirpur DOHS, Dhaka, Bangladesh, delivering high-performance mobile apps and SaaS platforms for clients across the US, Europe, and Asia.

CRITICAL VOICE & HUMAN WRITING RULES (MANDATORY):
1. Speak as a real engineer who builds production apps every day. Be direct, authoritative, opinionated, and conversational.
2. STRICTLY FORBIDDEN WORDS AND AI CLICHES (DO NOT USE ANY OF THESE UNDER ANY CIRCUMSTANCES):
   - "In this digital era", "In today's fast-paced digital world", "In the rapidly evolving landscape", "In the realm of"
   - "delve", "delving", "tapestry", "beacon", "testament", "game-changer", "revolutionize", "unleash", "elevate"
   - "embark on a journey", "navigating the landscape", "at the end of the day", "look no further", "without further ado"
   - "furthermore", "moreover", "in conclusion", "to sum up", "it is worth noting", "crucial role", "pivotal"
   - Do NOT use fluffy filler adjectives like "vibrant", "cutting-edge", "seamless" without concrete technical justification.
3. STRUCTURE & SEO/AEO RULES:
   - The first 2-3 sentences MUST give a direct, unequivocal answer to the topic/title question. No throat-clearing intro.
   - Headings (##) MUST be phrased as questions clients and CTOs actually ask (e.g. "## How much does a Flutter MVP actually cost?", "## Why do cross-platform apps fail App Store review?").
   - Include realistic technical details: tools (Flutter, Dart, React Native, Codemagic CI/CD, Fastlane, TestFlight, Firebase, AWS, Docker), timelines (4-8 weeks), and real architecture choices.
   - Use bullet points, bold key terms, and Markdown comparison tables where applicable.
   - Include helpful internal links where natural: [book a technical discovery call](/contact) or [explore our shipped mobile apps](/projects).
4. OUTPUT FORMAT:
   Return a valid JSON object matching the requested schema.`;

type GeminiRawResponse = {
	title?: string;
	slug?: string;
	excerpt?: string;
	body?: string;
	tags?: string[] | string;
	seoTitle?: string;
	seoDescription?: string;
	imagePrompt?: string;
};

/**
 * Downloads an AI-generated realistic photo from Pollinations and saves it to media store.
 */
async function fetchAndSaveCover(prompt: string, title: string): Promise<{ coverUrl: string; coverAlt: string }> {
	const cleanPrompt = prompt.replace(/[^\w\s,-]/g, '').trim().slice(0, 200);
	const photoPrompt = encodeURIComponent(`${cleanPrompt}, clean modern studio setup, realistic photography, professional tech workspace, high resolution`);
	const seed = Math.floor(Math.random() * 900000) + 100000;
	const imageUrl = `https://image.pollinations.ai/prompt/${photoPrompt}?width=1200&height=630&nologo=true&seed=${seed}`;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12000);

	try {
		const res = await fetch(imageUrl, { signal: controller.signal });
		clearTimeout(timeout);
		if (!res.ok) return { coverUrl: '', coverAlt: '' };

		const buffer = Buffer.from(await res.arrayBuffer());
		if (buffer.length < 5000) return { coverUrl: '', coverAlt: '' };

		const file = new File([buffer], `ai-cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
		const savedUrl = await saveImage(file, 'blog');
		return { coverUrl: savedUrl, coverAlt: title };
	} catch {
		clearTimeout(timeout);
		return { coverUrl: '', coverAlt: '' };
	}
}

export async function generateBlogWithGemini(
	topicIdea: string,
	requestedAuthor?: string
): Promise<{ ok: true; post: GeneratedBlogPost } | { ok: false; error: string }> {
	const apiKey = geminiApiKey();
	if (!apiKey) {
		return { ok: false, error: 'Gemini API key is missing. Add GEMINI_API_KEY (or API_KEY_GEMINI) to your environment variables.' };
	}

	const promptText = topicIdea.trim();
	if (!promptText) {
		return { ok: false, error: 'Enter a topic, idea, or outline for the blog post.' };
	}

	const userInstruction = `Write a comprehensive, human-grade blog post about the following topic or outline:
"${promptText}"

Requirements:
- Target audience: Founders, CTOs, product managers, and startups looking to hire mobile & web engineers.
- Tone: Hands-on, practical, experienced engineer. Completely free of AI clichés.
- Return a JSON object with:
  "title": Catchy, search-friendly title (max 70 chars)
  "slug": URL slug (lowercase letters and dashes)
  "excerpt": 40-60 words answering the main question directly
  "body": Comprehensive article in Markdown (headings with ## phrased as questions, paragraphs, lists, comparison tables, links to /contact and /projects)
  "tags": Array of 3-5 relevant tags
  "seoTitle": Search title (within 60 chars)
  "seoDescription": Search meta description (within 160 chars)
  "imagePrompt": A descriptive prompt for a realistic 1200x630 photograph representing the article topic`;

	try {
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: userInstruction }] }],
					systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
					generationConfig: {
						responseMimeType: 'application/json',
						temperature: 0.7,
					},
				}),
				cache: 'no-store',
			}
		);

		if (!res.ok) {
			const detail = await res.text();
			console.error('[Gemini API error]', res.status, detail);
			return { ok: false, error: `Gemini API returned error ${res.status}. Check API key quotas or permissions.` };
		}

		const data = (await res.json()) as {
			candidates?: { content?: { parts?: { text?: string }[] } }[];
		};
		const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!rawText) {
			return { ok: false, error: 'Gemini did not return any content. Please try a different topic prompt.' };
		}

		let parsed: GeminiRawResponse;
		try {
			parsed = JSON.parse(rawText);
		} catch {
			const jsonMatch = rawText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				parsed = JSON.parse(jsonMatch[0]);
			} else {
				return { ok: false, error: 'Could not parse response from Gemini. Please try again.' };
			}
		}

		const title = (parsed.title || promptText).slice(0, 160);
		const slug = slugify(parsed.slug || title);
		const excerpt = (parsed.excerpt || '').slice(0, 400);
		const body = parsed.body || '';
		const tagsList = Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags || '';
		const seoTitle = (parsed.seoTitle || `${title} | TechFiyr Blog`).slice(0, 70);
		const seoDescription = (parsed.seoDescription || excerpt).slice(0, 170);

		const author =
			requestedAuthor && AUTHORS.some((a) => a.name === requestedAuthor)
				? requestedAuthor
				: AUTHORS[0].name;

		// Fetch and save realistic cover photo
		let coverUrl = '';
		let coverAlt = title;
		if (parsed.imagePrompt) {
			const cover = await fetchAndSaveCover(parsed.imagePrompt, title);
			if (cover.coverUrl) {
				coverUrl = cover.coverUrl;
				coverAlt = cover.coverAlt;
			}
		}

		return {
			ok: true,
			post: {
				title,
				slug,
				excerpt,
				body,
				tags: tagsList,
				author,
				seoTitle,
				seoDescription,
				coverUrl,
				coverAlt,
			},
		};
	} catch (err) {
		console.error('[Gemini generation error]', err);
		return { ok: false, error: err instanceof Error ? err.message : 'Failed to generate blog post with Gemini.' };
	}
}
