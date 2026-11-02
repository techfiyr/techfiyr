import { NextResponse } from 'next/server';
import { askTechFiyrAssistant, type ChatMessage } from '@/lib/server/chatbot';

export const runtime = 'nodejs';

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const message = typeof body?.message === 'string' ? body.message.trim() : '';

		if (!message) {
			return NextResponse.json({ ok: false, error: 'Message cannot be empty.' }, { status: 400 });
		}

		if (message.length > 1000) {
			return NextResponse.json({ ok: false, error: 'Message is too long (max 1000 characters).' }, { status: 400 });
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
