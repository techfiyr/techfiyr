/*
 * Payment & programmable escrow adapter for TechFiyr A2A orders (server only).
 * Uses native fetch for Stripe Checkout Sessions (zero external SDKs) and
 * optional Base/Solana USDC escrow addresses from environment variables.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentRail } from '@/lib/agent/pricing';
import { CONTACT, SITE_URL } from '@/lib/site';
import type { OrderPaymentState } from './agent-store';
import { env } from './google';

export async function createPaymentForOrder(params: {
	orderId: string;
	projectTitle: string;
	clientEmail: string;
	amountUSD: number;
	deliveryDays: number;
	rail: PaymentRail;
}): Promise<OrderPaymentState> {
	const now = new Date().toISOString();
	const invoiceId = `INV-${params.orderId.replace(/^tf_ord_/, '').toUpperCase()}`;

	if (params.rail === 'stripe') {
		const stripeKey = env('STRIPE_SECRET_KEY');
		if (stripeKey) {
			try {
				const form = new URLSearchParams();
				form.set('mode', 'payment');
				form.set('success_url', `${SITE_URL}/contact?agent_order=${encodeURIComponent(params.orderId)}&payment=success`);
				form.set('cancel_url', `${SITE_URL}/contact?agent_order=${encodeURIComponent(params.orderId)}&payment=canceled`);
				if (params.clientEmail) form.set('customer_email', params.clientEmail);
				form.set('client_reference_id', params.orderId);
				form.set('line_items[0][price_data][currency]', 'usd');
				form.set('line_items[0][price_data][unit_amount]', String(Math.round(params.amountUSD * 100)));
				form.set('line_items[0][price_data][product_data][name]', `TechFiyr ${params.deliveryDays}-Day Build: ${params.projectTitle}`.slice(0, 120));
				form.set(
					'line_items[0][price_data][product_data][description]',
					`Order ${params.orderId} — Autonomous engineering & ${params.deliveryDays}-day delivery SLA`,
				);
				form.set('line_items[0][quantity]', '1');
				form.set('metadata[orderId]', params.orderId);
				form.set('metadata[deliveryDays]', String(params.deliveryDays));

				const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${stripeKey}`,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: form.toString(),
					cache: 'no-store',
				});

				if (res.ok) {
					const session = (await res.json()) as { id?: string; url?: string };
					if (session.url) {
						return {
							rail: 'stripe',
							status: 'pending_payment',
							amountUSD: params.amountUSD,
							currency: 'USD',
							invoiceId,
							checkoutUrl: session.url,
							stripeSessionId: session.id,
							instructions: 'Complete payment via the generated Stripe Checkout URL to lock sprint kickoff.',
							updatedAt: now,
						};
					}
				} else {
					console.warn('[Stripe Checkout Session Error]', res.status, (await res.text()).slice(0, 200));
				}
			} catch (err) {
				console.warn('[Stripe Checkout Request Error]', err instanceof Error ? err.message : err);
			}
		}
	}

	if (params.rail === 'crypto_escrow_base') {
		const baseAddress = env('AGENT_ESCROW_BASE_ADDRESS');
		if (baseAddress) {
			return {
				rail: 'crypto_escrow_base',
				status: 'pending_payment',
				amountUSD: params.amountUSD,
				currency: 'USDC',
				invoiceId,
				escrow: {
					network: 'base-mainnet',
					token: 'USDC',
					address: baseAddress,
					memo: params.orderId,
					releaseCondition: 'Automated CI pass + staging verification on Day 6/7',
				},
				instructions: `Lock ${params.amountUSD} USDC on Base mainnet to ${baseAddress} with order reference ${params.orderId}.`,
				updatedAt: now,
			};
		}
	}

	if (params.rail === 'crypto_escrow_solana') {
		const solanaAddress = env('AGENT_ESCROW_SOLANA_ADDRESS');
		if (solanaAddress) {
			return {
				rail: 'crypto_escrow_solana',
				status: 'pending_payment',
				amountUSD: params.amountUSD,
				currency: 'USDC',
				invoiceId,
				escrow: {
					network: 'solana-mainnet',
					token: 'USDC',
					address: solanaAddress,
					memo: params.orderId,
					releaseCondition: 'Automated CI pass + staging verification on Day 6/7',
				},
				instructions: `Lock ${params.amountUSD} USDC on Solana mainnet to ${solanaAddress} with memo ${params.orderId}.`,
				updatedAt: now,
			};
		}
	}

	return {
		rail: params.rail === 'invoice' ? 'invoice' : params.rail,
		status: 'awaiting_payment_rails',
		amountUSD: params.amountUSD,
		currency: 'USD',
		invoiceId,
		instructions: `Order ${params.orderId} (${invoiceId}) created for $${params.amountUSD} USD. Awaiting automated settlement rail activation or confirmation via ${CONTACT.email} (Fiverr / Upwork / Stripe invoice issued by engineering lead).`,
		updatedAt: now,
	};
}

/** Verifies Stripe webhook Stripe-Signature header (t=...,v1=...). */
export function verifyStripeSignature(rawBody: string, header: string, secret: string): boolean {
	if (!rawBody || !header || !secret) return false;
	const parts = header.split(',').map((p) => p.trim());
	const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
	const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
	if (!timestamp || !signatures.length) return false;

	const tsNum = Number(timestamp);
	if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
		return false;
	}

	const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
	const expectedBuf = Buffer.from(expected, 'hex');

	return signatures.some((sig) => {
		try {
			const sigBuf = Buffer.from(sig, 'hex');
			return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
		} catch {
			return false;
		}
	});
}

