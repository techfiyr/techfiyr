import { NextResponse } from 'next/server';
import { inspectAgentInteraction, sanitizeAgentText } from '@/lib/agent/security';
import { askTechFiyrAssistant, type ChatMessage } from '@/lib/server/chatbot';
import { checkRateLimit, isPayloadWithinLimit, rateLimitResponse } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
	if (!isPayloadWithinLimit(req, 65_536)) {
		return NextResponse.json({ ok: false, error: 'Payload too large (max 64 KB).' }, { status: 413 });
	}

	const rl = checkRateLimit(req, { limit: 20, windowMs: 60_000, keyPrefix: 'chat' });
	if (!rl.allowed) {
		return rateLimitResponse(rl);
	}

	try {
		const body = await req.json();
		const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
		const message = sanitizeAgentText(rawMessage, 1000);

		if (!message) {
			return NextResponse.json({ ok: false, error: 'Message cannot be empty.' }, { status: 400 });
		}

		// Anti-injection and prompt-injection check
		const security = inspectAgentInteraction(message);
		if (!security.safe) {
			return NextResponse.json({
				ok: true,
				reply: security.refusalMessage || 'Your message contains disallowed instructions, links, or injection patterns. Please ask about our services or email info@techfiyr.com.',
			});
		}

		const history: ChatMessage[] = Array.isArray(body?.history)
			? body.history
					.filter((h: unknown): h is ChatMessage => {
						const msg = h as ChatMessage;
						return (
							(msg?.role === 'user' || msg?.role === 'assistant') &&
							typeof msg?.content === 'string' &&
							msg.content.trim().length > 0
						);
					})
					.slice(-8)
					.map((h: ChatMessage) => ({
						role: h.role,
						content: sanitizeAgentText(h.content, 1000),
					}))
			: [];

		const conversation: ChatMessage[] = [...history, { role: 'user', content: message }];
		const reply = await askTechFiyrAssistant(conversation);

		return NextResponse.json({ ok: true, reply });
	} catch (err) {
		console.error('[API /api/chat error]:', err);
		return NextResponse.json(
			{
				ok: false,
				error: 'Failed to generate response. Please try contacting us on WhatsApp directly.',
			},
			{ status: 500 }
		);
	}
}
