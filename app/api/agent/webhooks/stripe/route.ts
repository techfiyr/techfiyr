/*
 * POST /api/agent/webhooks/stripe: verifies Stripe webhook signatures and marks A2A orders
 * as paid / escrow_locked when checkout completes, notifying the engineering lead.
 */
import { NextResponse } from 'next/server';
import { notifyFounderOrderEvent } from '@/lib/server/agent-notify';
import { updateOrderFulfillment } from '@/lib/server/agent-orders';
import { verifyStripeSignature } from '@/lib/server/agent-payments';
import { env } from '@/lib/server/google';

export const runtime = 'nodejs';

export async function POST(req: Request) {
	const secret = env('STRIPE_WEBHOOK_SECRET');
	if (!secret) {
		return NextResponse.json({ ok: false, error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 503 });
	}

	const rawBody = await req.text();
	const sig = req.headers.get('stripe-signature') || '';
	if (!verifyStripeSignature(rawBody, sig, secret)) {
		return NextResponse.json({ ok: false, error: 'Invalid Stripe signature' }, { status: 400 });
	}

	let event: {
		type?: string;
		data?: {
			object?: {
				client_reference_id?: string;
				metadata?: { orderId?: string };
				payment_status?: string;
			};
		};
	};
	try {
		event = JSON.parse(rawBody);
	} catch {
		return NextResponse.json({ ok: false, error: 'Invalid webhook payload' }, { status: 400 });
	}

	if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
		const obj = event.data?.object;
		const orderId = obj?.metadata?.orderId || obj?.client_reference_id || '';
		if (orderId) {
			const updated = await updateOrderFulfillment(orderId, { paymentStatus: 'paid' });
			if (updated) {
				await notifyFounderOrderEvent(updated, 'payment_confirmed');
			}
		}
	}

	return NextResponse.json({ ok: true, received: true });
}

