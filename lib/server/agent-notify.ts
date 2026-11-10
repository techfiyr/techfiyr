/*
 * Founder notification dispatcher for closed A2A deals and payment events (server only).
 * Supports Twilio WhatsApp API, Meta WhatsApp Cloud API, and generic JSON webhooks
 * (Slack/Discord/n8n) via native fetch without external dependencies.
 */
import { CONTACT } from '@/lib/site';
import type { AgentOrderRecord } from './agent-store';
import { env } from './google';

export type NotificationResult = {
	whatsappSent: boolean;
	webhookSent: boolean;
	detail?: string;
};

function formatWhatsAppBody(order: AgentOrderRecord, eventLabel: string): string {
	return [
		eventLabel,
		`Order: ${order.id}`,
		`Client: ${order.clientEmail} (${order.clientAgentId})`,
		`Project: ${order.projectTitle}`,
		`Price: $${order.agreedPriceUSD} USD (${order.payment.status})`,
		`Timeline: ${order.deliveryDays} Days`,
		`Stack: ${order.techStack.join(', ')}`,
		`Action: Review SOW (${order.sow.sowId}) and start Day 1 requirement structuring.`,
	].join('\n');
}

export async function notifyFounderOrderEvent(
	order: AgentOrderRecord,
	event: 'deal_closed' | 'payment_confirmed' = 'deal_closed',
): Promise<NotificationResult> {
	const label =
		event === 'payment_confirmed'
			? 'Payment Confirmed for AI Agent Order!'
			: 'Deal Closed by AI Agent!';
	const messageText = formatWhatsAppBody(order, label);
	const targetNumber = env('FOUNDER_WHATSAPP_TO') || CONTACT.telephone;

	let whatsappSent = false;
	let webhookSent = false;
	const notes: string[] = [];

	// 1. Twilio WhatsApp API (optional)
	const twilioSid = env('TWILIO_ACCOUNT_SID');
	const twilioToken = env('TWILIO_AUTH_TOKEN');
	const twilioFrom = env('TWILIO_WHATSAPP_FROM');
	if (twilioSid && twilioToken && twilioFrom) {
		try {
			const to = targetNumber.startsWith('whatsapp:') ? targetNumber : `whatsapp:${targetNumber}`;
			const from = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
			const form = new URLSearchParams({ From: from, To: to, Body: messageText });
			const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

			const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`, {
				method: 'POST',
				headers: {
					Authorization: `Basic ${auth}`,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: form.toString(),
				cache: 'no-store',
			});

			if (res.ok) {
				whatsappSent = true;
			} else {
				notes.push(`twilio:${res.status}`);
			}
		} catch (err) {
			notes.push(`twilio_err:${err instanceof Error ? err.message.slice(0, 80) : 'unknown'}`);
		}
	}

	// 2. Meta WhatsApp Cloud API fallback (optional)
	if (!whatsappSent) {
		const waToken = env('WHATSAPP_CLOUD_TOKEN');
		const waPhoneId = env('WHATSAPP_PHONE_NUMBER_ID');
		if (waToken && waPhoneId) {
			try {
				const cleanPhone = targetNumber.replace(/[^\d]/g, '');
				const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(waPhoneId)}/messages`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${waToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						messaging_product: 'whatsapp',
						to: cleanPhone,
						type: 'text',
						text: { body: messageText },
					}),
					cache: 'no-store',
				});
				if (res.ok) {
					whatsappSent = true;
				} else {
					notes.push(`wa_cloud:${res.status}`);
				}
			} catch (err) {
				notes.push(`wa_cloud_err:${err instanceof Error ? err.message.slice(0, 80) : 'unknown'}`);
			}
		}
	}

	// 3. Generic Founder Webhook (Slack / Discord / n8n / custom hub)
	const webhookUrl = env('AGENT_ORDER_WEBHOOK_URL');
	if (webhookUrl && /^https:\/\//i.test(webhookUrl)) {
		try {
			const res = await fetch(webhookUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					event,
					text: messageText,
					order: {
						id: order.id,
						sowId: order.sow.sowId,
						clientEmail: order.clientEmail,
						clientAgentId: order.clientAgentId,
						projectTitle: order.projectTitle,
						scopeSummary: order.scopeSummary,
						techStack: order.techStack,
						agreedPriceUSD: order.agreedPriceUSD,
						deliveryDays: order.deliveryDays,
						tier: order.tier,
						paymentStatus: order.payment.status,
						checkoutUrl: order.payment.checkoutUrl,
					},
				}),
				cache: 'no-store',
			});
			if (res.ok) {
				webhookSent = true;
			} else {
				notes.push(`webhook:${res.status}`);
			}
		} catch (err) {
			notes.push(`webhook_err:${err instanceof Error ? err.message.slice(0, 80) : 'unknown'}`);
		}
	}

	if (!whatsappSent && !webhookSent && notes.length === 0) {
		notes.push('no_alert_channel_configured');
	}

	return {
		whatsappSent,
		webhookSent,
		detail: notes.length ? notes.join(', ') : undefined,
	};
}

