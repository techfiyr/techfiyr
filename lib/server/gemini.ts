/*
 * AI blog generator (server only).
 * Connects to Google Gemini (with multi-model automatic failover) and Free AI
 * text generation fallbacks so you never encounter "high demand" errors.
 * Strictly enforces anti-AI-slop rules, AEO question-first structure,
 * and realistic engineering depth tailored for TechFiyr.
 * Also generates realistic 1200x630 cover photos via Pollinations AI with Unsplash fallback.
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
   Return ONLY a valid JSON object matching the requested schema.`;

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

const FALLBACK_TECH_PHOTOS = [
	'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&h=630&q=80',
	'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&h=630&q=80',
	'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&h=630&q=80',
	'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=630&q=80',
	'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=630&q=80',
];

/**
 * Downloads an AI-generated realistic photo from Pollinations (with Unsplash fallback)
 * and saves it to media store.
 */
async function fetchAndSaveCover(prompt: string, title: string): Promise<{ coverUrl: string; coverAlt: string }> {
	const cleanPrompt = prompt.replace(/[^\w\s,-]/g, '').trim().slice(0, 200);
	const photoPrompt = encodeURIComponent(`${cleanPrompt}, clean modern studio setup, realistic photography, professional tech workspace, high resolution`);
	const seed = Math.floor(Math.random() * 900000) + 100000;
	const pollinationsUrl = `https://image.pollinations.ai/prompt/${photoPrompt}?width=1200&height=630&nologo=true&seed=${seed}`;

	// 1. Try Pollinations free AI image generator with 25s timeout
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const res = await fetch(pollinationsUrl, { signal: controller.signal });
		clearTimeout(timeout);
		if (res.ok) {
			const buffer = Buffer.from(await res.arrayBuffer());
			if (buffer.length >= 5000) {
				const file = new File([buffer], `ai-cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
				const savedUrl = await saveImage(file, 'blog');
				if (savedUrl) return { coverUrl: savedUrl, coverAlt: title };
			}
		}
	} catch {
		clearTimeout(timeout);
	}

	// 2. Fallback to curated high-resolution tech workspace photography
	try {
		const fallbackUrl = FALLBACK_TECH_PHOTOS[Math.floor(Math.random() * FALLBACK_TECH_PHOTOS.length)];
		const fbRes = await fetch(fallbackUrl);
		if (fbRes.ok) {
			const fbBuffer = Buffer.from(await fbRes.arrayBuffer());
			if (fbBuffer.length >= 5000) {
				const file = new File([fbBuffer], `tech-cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
				const savedUrl = await saveImage(file, 'blog');
				if (savedUrl) return { coverUrl: savedUrl, coverAlt: title };
			}
		}
	} catch (err) {
		console.warn('[Cover photo download failed]', err);
	}

	return { coverUrl: '', coverAlt: '' };
}

/**
 * Free fallback text generation via Pollinations AI (no API key required).
 */
async function generateWithPollinationsFallback(
	userInstruction: string
): Promise<{ ok: true; rawText: string } | { ok: false; error: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 45000);

	try {
		const res = await fetch('https://text.pollinations.ai/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: SYSTEM_INSTRUCTION },
					{ role: 'user', content: userInstruction },
				],
				model: 'openai',
				jsonMode: true,
			}),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!res.ok) {
			return { ok: false, error: `Free AI generator returned status ${res.status}` };
		}

		const rawText = await res.text();
		return { ok: true, rawText };
	} catch (err) {
		clearTimeout(timeout);
		return { ok: false, error: err instanceof Error ? err.message : 'Free AI generator network error' };
	}
}

export async function generateBlogWithGemini(
	topicIdea: string,
	requestedAuthor?: string
): Promise<{ ok: true; post: GeneratedBlogPost } | { ok: false; error: string }> {
	const promptText = topicIdea.trim();
	if (!promptText) {
		return { ok: false, error: 'Enter a topic, idea, or outline for the blog post.' };
	}

	const userInstruction = `Write a comprehensive, human-grade blog post about the following topic or outline:
"${promptText}"

Requirements:
- Target audience: Founders, CTOs, product managers, and startups looking to hire mobile & web engineers.
- Tone: Hands-on, practical, experienced engineer. Completely free of AI clichés.
- Return ONLY a valid JSON object with:
  "title": Catchy, search-friendly title (max 70 chars)
  "slug": URL slug (lowercase letters and dashes)
  "excerpt": 40-60 words answering the main question directly
  "body": Comprehensive article in Markdown (headings with ## phrased as questions, paragraphs, lists, comparison tables, code blocks if technical, links to /contact and /projects)
  "tags": Array of 3-5 relevant tags
  "seoTitle": Search title (within 60 chars)
  "seoDescription": Search meta description (within 160 chars)
  "imagePrompt": A descriptive prompt for a realistic 1200x630 photograph representing the article topic`;

	const apiKey = geminiApiKey();

	// Models to try in cascade order: fastest & most available first
	const modelsToTry = [
		env('GEMINI_MODEL'),
		'gemini-2.5-flash',
		'gemini-2.0-flash',
		'gemini-1.5-flash',
		'gemini-2.0-flash-lite',
		'gemini-1.5-pro',
	].filter((m): m is string => Boolean(m));

	const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n---\n\n${userInstruction}`;

	let lastError = '';
	let rawText = '';

	// 1. Try Gemini API models with automatic failover on 503 (high demand), 429 (rate/quota), 500, or timeouts
	if (apiKey) {
		for (let i = 0; i < modelsToTry.length; i++) {
			const model = modelsToTry[i];
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 45000);

			try {
				const res = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ parts: [{ text: fullPrompt }] }],
							generationConfig: {
								responseMimeType: 'application/json',
								temperature: 0.7,
							},
						}),
						signal: controller.signal,
						cache: 'no-store',
					}
				);
				clearTimeout(timeout);

				if (!res.ok) {
					const detail = await res.text();
					console.warn(`[Gemini API on ${model}]`, res.status, detail.slice(0, 200));
					let message = `Gemini API returned error ${res.status}.`;
					try {
						const parsedErr = JSON.parse(detail);
						if (parsedErr.error?.message) {
							message = parsedErr.error.message;
						}
					} catch {
						if (detail) message = detail.slice(0, 300);
					}
					lastError = message;

					// If 503 (high demand), 429 (quota/rate limit), 500, 504, or 404, try the next model
					const isRetryable = res.status === 503 || res.status === 429 || res.status === 500 || res.status === 504 || res.status === 404;
					if (isRetryable && i < modelsToTry.length - 1) {
						continue;
					}
					break;
				}

				const data = (await res.json()) as {
					candidates?: { content?: { parts?: { text?: string }[] } }[];
				};
				rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
				if (rawText) break;
			} catch (err) {
				clearTimeout(timeout);
				lastError = err instanceof Error ? err.message : 'Network error calling Gemini API';
				if (i < modelsToTry.length - 1) continue;
			}
		}
	}

	// 2. If Gemini models were exhausted, busy, or no API key was provided, fall back to free AI engine
	if (!rawText) {
		console.log('[Gemini unavailable or high demand, invoking Free AI fallback engine...]');
		const fallback = await generateWithPollinationsFallback(userInstruction);
		if (fallback.ok && fallback.rawText) {
			rawText = fallback.rawText;
		}
	}

	if (!rawText) {
		return {
			ok: false,
			error: lastError || 'AI services are momentarily busy. Please try again in a few seconds.',
		};
	}

	// 3. Parse JSON safely
	let parsed: GeminiRawResponse;
	try {
		parsed = JSON.parse(rawText);
	} catch {
		// Clean up markdown block if present
		const cleaned = rawText
			.replace(/^```json\s*/i, '')
			.replace(/^```\s*/i, '')
			.replace(/```$/i, '')
			.trim();
		try {
			parsed = JSON.parse(cleaned);
		} catch {
			const jsonMatch = rawText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				try {
					parsed = JSON.parse(jsonMatch[0]);
				} catch {
					return { ok: false, error: 'Could not parse response from AI. Please try again.' };
				}
			} else {
				return { ok: false, error: 'Could not parse response from AI. Please try again.' };
			}
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

	// 4. Fetch and save realistic cover photo
	let coverUrl = '';
	let coverAlt = title;
	const imagePromptToUse = parsed.imagePrompt || `${title}, mobile and web software engineering workspace`;
	const cover = await fetchAndSaveCover(imagePromptToUse, title);
	if (cover.coverUrl) {
		coverUrl = cover.coverUrl;
		coverAlt = cover.coverAlt;
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
}
