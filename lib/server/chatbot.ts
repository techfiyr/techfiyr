/*
 * Server-side Gemini AI Chatbot engine for TechFiyr visitor inquiries.
 * Answers questions about services, team, tech stack, pricing, and projects,
 * with multi-model automatic failover and smart handover to WhatsApp and booking.
 */
import { geminiApiKey, geminiModels } from './gemini';

export type ChatMessage = {
	role: 'user' | 'assistant';
	content: string;
};

const SYSTEM_PROMPT = `You are the official AI Technical Assistant for TechFiyr (https://techfiyr.com), a premier mobile app and custom web/SaaS software agency based in Mirpur DOHS, Dhaka, Bangladesh, serving startups and growing businesses across the United States, Europe, and Asia.

COMPANY IDENTITY & FACTS:
- Name: TechFiyr
- Office Address: 325, Mirpur DOHS, Dhaka 1216, Bangladesh (works remotely with clients worldwide)
- Contact Email: info@techfiyr.com
- WhatsApp: +880 1540659530 (Direct link: https://wa.me/8801540659530)
- Meeting Booking: Free 30-minute discovery call at https://techfiyr.com/contact
- Client Reputation: 5.0-star average rating on Fiverr & Upwork, 20+ shipped projects for international clients, 2+ years track record.

CORE SERVICES:
1. Mobile App Design & Development: Production-ready cross-platform apps with Flutter and React Native (single codebase for iOS & Android, saving up to 40% dev time), as well as native iOS (Swift) and Android (Kotlin). Full App Store & Google Play release management.
2. Custom Web Software & SaaS: Scalable web platforms, enterprise dashboards, and cloud SaaS built with Next.js, React, Node.js, Java Spring Boot, and robust databases.
3. UI/UX & Product Prototyping: User-centered Figma prototypes, responsive design systems, and clickable wireframes led by senior product designers.
4. Mobile DevOps & Cloud CI/CD: Automated build & release pipelines with Codemagic CI/CD, Fastlane, GitHub Actions, AWS, and Firebase.
5. Production AI & Intelligent Agents: LLM integrations, retrieval-augmented generation (RAG), vector databases, and custom automation.

THE CORE TEAM (8 Senior Specialists):
- Saurav Wahid: Co-Founder & Team Lead | Senior Java Spring Web & App Developer | AI App Audits | Mobile CI/CD | Oracle Certified Professional (11+ yrs)
- Viswajit Roy: Co-Founder & Managing Director | Lead UI/UX Designer | Design Systems | Figma | Product Prototyping (10+ yrs)
- Ponir Saha: Co-Founder & CTO | Software Architect | Production AI/RAG | Java | Spring | Python
- Md Masud Parvez: Lead Android & iOS Developer | Native & Cross-Platform Mobile Engineering
- Md. Awon-Uz-Zaman: Senior Android & iOS Developer | Mobile Apps | Flutter | Clean Architecture
- Sohanur Islam: Full-Stack Software Engineer | Java | Angular | Spring | AI Agent Specialist | Next.js | React Native
- Pranabesh Sarkar: Senior AI/ML Engineer | MLOps, Deep Learning & Scalable AI Infrastructure | LLM Integration, Vector DBs
- Anupam Baidya: Full-Stack Laravel Developer | Laravel | React.js | Next.js

SHIPPED PORTFOLIO HIGHLIGHT:
- MatMaps: A UK combat sports platform (Android & web) live on Google Play and at https://matmaps.co.uk/, featuring geo-located club directories, tournaments, round timers, and subscriptions.

YOUR ROLE & TONE:
1. Be helpful, concise, technically articulate, and welcoming.
2. Keep answers direct and to the point (2 to 4 short paragraphs or bullet points). Avoid fluff or generic marketing clichés.
3. Whenever a visitor expresses interest in discussing their project, getting an estimate, or contacting the team, guide them to:
   - Chat directly on WhatsApp: [WhatsApp +880 1540659530](https://wa.me/8801540659530)
   - Book a free 30-minute discovery call: [Schedule Call](/contact)
4. Use standard Markdown for bullet points, bolding, and links.`;

export async function askTechFiyrAssistant(messages: ChatMessage[]): Promise<string> {
	const apiKey = geminiApiKey();
	const modelsToTry = geminiModels();

	// Format conversation history for Gemini API
	const contents = [
		{
			role: 'user',
			parts: [{ text: `System context instructions:\n${SYSTEM_PROMPT}\n\nPlease acknowledge and assist the user based on these guidelines.` }],
		},
		{
			role: 'model',
			parts: [{ text: "Understood. I am TechFiyr's AI assistant. I'll provide concise, accurate, and helpful answers about TechFiyr's services, team, and projects, and offer direct WhatsApp or meeting scheduling links when relevant." }],
		},
		...messages.slice(-10).map((m) => ({
			role: m.role === 'user' ? 'user' : 'model',
			parts: [{ text: m.content }],
		})),
	];

	if (apiKey) {
		for (let i = 0; i < modelsToTry.length; i++) {
			const model = modelsToTry[i];
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 20000);

			try {
				const res = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents,
							generationConfig: {
								temperature: 0.6,
								maxOutputTokens: 800,
							},
						}),
						signal: controller.signal,
						cache: 'no-store',
					}
				);
				clearTimeout(timeout);

				if (!res.ok) {
					const detail = await res.text();
					console.warn(`[Gemini Chat on ${model}]`, res.status, detail.slice(0, 150));
					if (i < modelsToTry.length - 1) continue;
					break;
				}

				const data = (await res.json()) as {
					candidates?: { content?: { parts?: { text?: string }[] } }[];
				};

				const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
				if (text && text.trim()) {
					return text.trim();
				}
			} catch (err) {
				clearTimeout(timeout);
				console.warn(`[Gemini Chat Error on ${model}]:`, err instanceof Error ? err.message : err);
				if (i < modelsToTry.length - 1) continue;
			}
		}
	}

	// Smart fallback if API key is not configured or all models were busy
	const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
	if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('contact') || lastUserMsg.includes('hire') || lastUserMsg.includes('call')) {
		return "You can reach our team directly right now! Click here to [Chat on WhatsApp](https://wa.me/8801540659530) or [Schedule a Free 30-Minute Discovery Call](/contact). We usually respond within minutes.";
	}
	if (lastUserMsg.includes('price') || lastUserMsg.includes('cost') || lastUserMsg.includes('rate')) {
		return "We offer flexible engagement models tailored to your roadmap:\n\n- **Fixed-Sprint MVP**: Typically $2,500 – $6,000 for a 4–8 week production-ready Flutter/React Native app.\n- **Milestone-Based**: For custom SaaS platforms and enterprise web portals.\n- **Hourly / Dedicated**: Available on Upwork and Fiverr (rated 5.0 stars).\n\nTo get an exact scope and fixed quote for your idea, [Book a Free Discovery Call](/contact) or message us on [WhatsApp](https://wa.me/8801540659530).";
	}
	if (lastUserMsg.includes('flutter') || lastUserMsg.includes('react native') || lastUserMsg.includes('mobile')) {
		return "TechFiyr specializes in cross-platform mobile development with **Flutter** and **React Native**, as well as native iOS & Android. A single unified codebase allows native 60fps performance across both platforms while cutting your development cost and time-to-market by up to 40%. We also configure automated CI/CD with Codemagic for seamless App Store & Google Play deployments.\n\nWould you like to discuss your app concept on [WhatsApp](https://wa.me/8801540659530) or [book a free discovery call](/contact)?";
	}

	return "Thanks for reaching out to TechFiyr! We design and engineer mobile apps (Flutter & React Native), custom web software & SaaS platforms, and mobile CI/CD pipelines.\n\nHow can we help with your project today? You can also message our team directly on [WhatsApp](https://wa.me/8801540659530) or [schedule a free discovery call](/contact).";
}
