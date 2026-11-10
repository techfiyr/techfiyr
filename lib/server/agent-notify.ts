/*
 * Founder notification dispatcher for closed A2A / Email deals (server only).
 * No Twilio or SMS — uses unified Mail SMTP alert (Gmail/Zoho) and/or optional HTTPS webhook.
 */
import type { AgentOrderRecord } from './agent-store';
import { sendAgentEmail } from './emailWorker';
import { env } from './google';

export type NotificationResult = {
	emailAlertSent: boolean;
	webhookSent: boolean;
	detail?: string;
};

function formatAlertText(order: AgentOrderRecord, eventLabel: string): string {
	return [
		eventLabel,
		`Order: ${order.id}`,
		`Client: ${order.client_contact} (${order.clientAgentId})`,
		`Project: ${order.projectTitle}`,
		`Price: $${order.total_price_usd} USD (25% deposit: $${order.payment.upfrontDepositUSD} USD)`,
		`Payment Rail: ${order.payment.rail} (${order.milestone_status})`,
		`Timeline: ${order.timeline_days} Days`,
		`Stack: ${order.techStack.join(', ')}`,
		`Action: Inspect AI-Developer-Ready SRS and Day 1 scaffold in /admin/agent.`,
	].join('\n');
}

export async function notifyFounderOrderEvent(
	order: AgentOrderRecord,
	event: 'deal_closed' | 'payment_confirmed' = 'deal_closed',
): Promise<NotificationResult> {
	const label =
		event === 'payment_confirmed'
			? 'Payment Milestone Confirmed for AI Agent Order'
			: 'Deal Closed by TechFiyr Sales Agent';
	const messageText = formatAlertText(order, label);

	let emailAlertSent = false;
	let webhookSent = false;
	const notes: string[] = [];

	const alertRecipient = env('FOUNDER_ALERT_EMAIL');
	if (alertRecipient) {
		const mailRes = await sendAgentEmail({
			to: alertRecipient,
			fromName: 'TechFiyr Sales Agent',
			subject: `[TechFiyr Agent] ${label}: ${order.projectTitle} ($${order.total_price_usd})`,
			bodyText: `${messageText}\n\n--- SRS SUMMARY ---\n${order.srs_markdown.slice(0, 3000)}`,
		});
		if (mailRes.ok) {
			emailAlertSent = true;
		} else {
			notes.push(`mail_alert:${mailRes.error.slice(0, 80)}`);
		}
	}

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
						inquiry_id: order.inquiry_id,
						sowId: order.sow.sowId,
						client_contact: order.client_contact,
						projectTitle: order.projectTitle,
						total_price_usd: order.total_price_usd,
						timeline_days: order.timeline_days,
						milestone_status: order.milestone_status,
						payment_rail: order.payment.rail,
						srs_json: order.srs_json,
					},
				}),
				cache: 'no-store',
			});
			if (res.ok) webhookSent = true;
			else notes.push(`webhook:${res.status}`);
		} catch (err) {
			notes.push(`webhook_err:${err instanceof Error ? err.message.slice(0, 80) : 'err'}`);
		}
	}

	if (!emailAlertSent && !webhookSent && notes.length === 0) {
		notes.push('no_alert_channel_configured');
	}

	return {
		emailAlertSent,
		webhookSent,
		detail: notes.length ? notes.join(', ') : undefined,
	};
}
