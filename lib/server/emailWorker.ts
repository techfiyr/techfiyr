/*
 * Unified Mail Worker (emailWorker.ts) for Gmail (IMAP/SMTP with App Password) & Zoho fallback.
 * - Polls unread INBOX messages via imapflow + mailparser (skipping newsletters/no-reply/bounces).
 * - Threads client conversations into Inquiries and invokes Gemini Sales Agent (salesAgent.ts).
 * - Sends threaded Sales replies and Marketing Agent outreach/reports via nodemailer SMTP.
 */
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { SALES_AGENT_EMAIL } from '@/lib/agent/catalog';
import { updateOrderFulfillment } from './agent-orders';
import {
	canPersistAgentStore,
	findInquiryByThread,
	generateId,
	getInquiry,
	getOrder,
	saveEmailSyncRun,
	saveInquiry,
	type EmailSyncRun,
	type InquiryRecord,
} from './agent-store';
import { env } from './google';
import { runSalesAgent } from './salesAgent';

export type MailProvider = 'gmail' | 'zoho' | 'custom';

export type MailConfig = {
	provider: MailProvider;
	email: string;
	password: string;
	imapHost: string;
	imapPort: number;
	smtpHost: string;
	smtpPort: number;
};

export function getMailConfig(): MailConfig {
	const gmailEmail = env('GMAIL_EMAIL') || env('MAIL_EMAIL');
	const gmailPass = env('GMAIL_APP_PASSWORD') || env('MAIL_APP_PASSWORD');
	const zohoEmail = env('ZOHO_EMAIL');
	const zohoPass = env('ZOHO_APP_PASSWORD');

	const usingGmail = Boolean(gmailEmail) || (!zohoEmail && Boolean(gmailPass));
	const email = gmailEmail || zohoEmail || SALES_AGENT_EMAIL;
	const isGmailAddr = /@(gmail|googlemail)\.com$/i.test(email) || usingGmail;

	if (isGmailAddr) {
		return {
			provider: 'gmail',
			email,
			password: (gmailPass || zohoPass).replace(/\s+/g, ''),
			imapHost: env('GMAIL_IMAP_HOST') || env('MAIL_IMAP_HOST') || 'imap.gmail.com',
			imapPort: Number(env('GMAIL_IMAP_PORT') || env('MAIL_IMAP_PORT') || '993'),
			smtpHost: env('GMAIL_SMTP_HOST') || env('MAIL_SMTP_HOST') || 'smtp.gmail.com',
			smtpPort: Number(env('GMAIL_SMTP_PORT') || env('MAIL_SMTP_PORT') || '465'),
		};
	}

	return {
		provider: 'zoho',
		email,
		password: zohoPass || gmailPass,
		imapHost: env('ZOHO_IMAP_HOST') || env('MAIL_IMAP_HOST') || 'imap.zoho.com',
		imapPort: Number(env('ZOHO_IMAP_PORT') || env('MAIL_IMAP_PORT') || '993'),
		smtpHost: env('ZOHO_SMTP_HOST') || env('MAIL_SMTP_HOST') || 'smtp.zoho.com',
		smtpPort: Number(env('ZOHO_SMTP_PORT') || env('MAIL_SMTP_PORT') || '465'),
	};
}

export function isMailConfigured(): boolean {
	const cfg = getMailConfig();
	return Boolean(cfg.email && cfg.password);
}

// Backwards-compatible aliases
export const getZohoConfig = getMailConfig;
export const isZohoConfigured = isMailConfigured;

function stripQuotedReply(text: string): string {
	const lines = text.replace(/\r\n/g, '\n').split('\n');
	const out: string[] = [];
	for (const line of lines) {
		if (/^On .+wrote:\s*$/i.test(line.trim())) break;
		if (/^-{2,}\s*Original Message\s*-{2,}$/i.test(line.trim())) break;
		if (line.trim().startsWith('>')) continue;
		out.push(line);
	}
	return out.join('\n').trim().slice(0, 6000) || text.trim().slice(0, 6000);
}

function createSmtpTransport(cfg: MailConfig) {
	return nodemailer.createTransport({
		host: cfg.smtpHost,
		port: cfg.smtpPort,
		secure: cfg.smtpPort === 465,
		auth: {
			user: cfg.email,
			pass: cfg.password,
		},
	});
}

function formatReplySubject(subject: string): string {
	const clean = subject.trim() || 'TechFiyr Project Inquiry';
	return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

function detectPaymentProof(text: string): { txHash?: string; payoneerRef?: string } {
	const evmMatch = text.match(/\b0x[a-fA-F0-9]{64}\b/);
	if (evmMatch) return { txHash: evmMatch[0] };

	const solOrTronMatch = text.match(
		/(?:tx|hash|signature|trc20|solana|base|polygon)[:#\s]+([1-9A-HJ-NP-Za-km-z]{43,88}|[a-fA-F0-9]{64})/i,
	);
	if (solOrTronMatch) return { txHash: solOrTronMatch[1] };

	const payoneerMatch = text.match(/payoneer(?:\s+ref(?:erence)?|\s+id|\s+tx)?[:#\s]+([A-Z0-9-]{6,32})/i);
	if (payoneerMatch) return { payoneerRef: payoneerMatch[1] };

	return {};
}

/** Shared SMTP sender for Sales Agent threaded replies, Marketing outreach, and Founder alerts. */
export async function sendAgentEmail(params: {
	to: string;
	subject: string;
	bodyText: string;
	fromName?: string;
	inReplyTo?: string;
	references?: string[];
	replyTo?: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
	const cfg = getMailConfig();
	if (!cfg.email || !cfg.password) {
		const hint =
			cfg.provider === 'gmail'
				? 'GMAIL_EMAIL and GMAIL_APP_PASSWORD'
				: 'ZOHO_EMAIL and ZOHO_APP_PASSWORD';
		return { ok: false, error: `Mail credentials (${hint}) are not configured.` };
	}

	try {
		const transporter = createSmtpTransport(cfg);
		const refs = Array.from(
			new Set([...(params.references || []), ...(params.inReplyTo ? [params.inReplyTo] : [])]),
		).filter(Boolean);
		const senderLabel = params.fromName || 'TechFiyr Agent';
		const info = await transporter.sendMail({
			from: `"${senderLabel}" <${cfg.email}>`,
			to: params.to,
			subject: params.subject,
			text: params.bodyText,
			...(params.replyTo ? { replyTo: params.replyTo } : {}),
			...(params.inReplyTo ? { inReplyTo: params.inReplyTo } : {}),
			...(refs.length ? { references: refs.join(' ') } : {}),
		});
		return { ok: true, messageId: info.messageId || `<${Date.now()}@techfiyr.com>` };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'SMTP send failed' };
	}
}

export async function sendThreadedReply(params: {
	to: string;
	subject: string;
	bodyText: string;
	inReplyTo?: string;
	references?: string[];
}) {
	return sendAgentEmail({
		to: params.to,
		subject: formatReplySubject(params.subject),
		bodyText: params.bodyText,
		fromName: 'Saurav Wahid · TechFiyr',
		inReplyTo: params.inReplyTo,
		references: params.references,
	});
}

export const sendZohoThreadedReply = sendThreadedReply;

export async function syncMailInbox(maxMessages = 10): Promise<EmailSyncRun> {
	const ranAt = new Date().toISOString();
	const errors: string[] = [];
	let checked = 0;
	let processed = 0;
	let replied = 0;
	let closedDeals = 0;

	if (!canPersistAgentStore()) {
		return {
			ranAt,
			ok: false,
			checked: 0,
			processed: 0,
			replied: 0,
			closedDeals: 0,
			errors: ['Document store is unavailable in this environment.'],
		};
	}

	const cfg = getMailConfig();
	if (!cfg.email || !cfg.password) {
		const hint =
			cfg.provider === 'gmail'
				? 'Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD environment variables.'
				: 'Missing ZOHO_EMAIL or ZOHO_APP_PASSWORD environment variables.';
		const run: EmailSyncRun = {
			ranAt,
			ok: false,
			checked: 0,
			processed: 0,
			replied: 0,
			closedDeals: 0,
			errors: [hint],
		};
		await saveEmailSyncRun(run);
		return run;
	}

	const client = new ImapFlow({
		host: cfg.imapHost,
		port: cfg.imapPort,
		secure: true,
		auth: { user: cfg.email, pass: cfg.password },
		logger: false,
	});

	const channelName: InquiryRecord['channel'] = cfg.provider === 'gmail' ? 'gmail' : 'zoho_email';

	try {
		await client.connect();
		const lock = await client.getMailboxLock('INBOX');

		try {
			const unseenUids = await client.search({ seen: false }, { uid: true });
			const uidList = Array.isArray(unseenUids) ? unseenUids.slice(-maxMessages) : [];
			checked = uidList.length;

			if (uidList.length > 0) {
				for await (const msg of client.fetch(uidList, { uid: true, source: true, envelope: true })) {
					try {
						if (!msg.source) continue;
						const parsed = await simpleParser(msg.source);

						const fromAddr = parsed.from?.value?.[0]?.address?.trim() || '';
						const fromName = parsed.from?.value?.[0]?.name?.trim() || '';
						const subject = (parsed.subject || 'Project Inquiry').trim();
						const messageId = (parsed.messageId || `mail_${msg.uid}_${Date.now()}`).trim();
						const inReplyTo = typeof parsed.inReplyTo === 'string' ? parsed.inReplyTo.trim() : '';
						const references = Array.isArray(parsed.references)
							? parsed.references.map((r) => String(r).trim())
							: typeof parsed.references === 'string'
								? parsed.references.split(/\s+/).filter(Boolean)
								: [];

						// Skip automated bounces, Google/GitHub notifications, mailing lists, and self-sent mail
						const autoSubmitted = String(parsed.headers.get('auto-submitted') || '').toLowerCase();
						const precedence = String(parsed.headers.get('precedence') || '').toLowerCase();
						const isList = parsed.headers.has('list-unsubscribe') || parsed.headers.has('list-id');
						if (
							!fromAddr ||
							fromAddr.toLowerCase() === cfg.email.toLowerCase() ||
							/(mailer-daemon|postmaster|no-?reply|donotreply|notifications@|alerts@|accounts\.google\.com)/i.test(
								fromAddr,
							) ||
							isList ||
							(autoSubmitted && autoSubmitted !== 'no') ||
							/(bulk|junk|list|auto_reply)/.test(precedence)
						) {
							await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
							continue;
						}

						const rawBody =
							parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, ' ') : '');
						const cleanText = stripQuotedReply(rawBody);
						if (!cleanText) {
							await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
							continue;
						}

						const threadKeys = [inReplyTo, ...references, messageId].filter(Boolean);
						let inquiry = await findInquiryByThread(threadKeys, fromAddr);
						const now = new Date().toISOString();

						if (inquiry && inquiry.messages.some((m) => m.messageId === messageId)) {
							await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
							continue;
						}

						if (!inquiry) {
							inquiry = {
								id: generateId('tf_inq'),
								sender_email: fromAddr,
								sender_name: fromName || undefined,
								subject,
								thread_id: references[0] || inReplyTo || messageId,
								status: 'PENDING',
								channel: channelName,
								messages: [],
								created_at: now,
								updated_at: now,
							};
						}

						inquiry.messages.push({
							timestamp: (parsed.date || new Date()).toISOString(),
							role: 'client',
							text: cleanText,
							messageId,
						});
						inquiry.updated_at = now;
						if (inquiry.status === 'PENDING') inquiry.status = 'NEGOTIATING';
						await saveInquiry(inquiry);

						const proof = detectPaymentProof(cleanText);
						if (inquiry.order_id && (proof.txHash || proof.payoneerRef)) {
							const existingOrder = await getOrder(inquiry.order_id);
							if (existingOrder) {
								await updateOrderFulfillment(existingOrder.id, {
									milestoneStatus: 'UPFRONT_PAID',
									cryptoTxHash: proof.txHash,
									payoneerReference: proof.payoneerRef,
								});
								const ackBody = [
									`Payment reference received for Order ${existingOrder.id} (${proof.txHash || proof.payoneerRef}).`,
									'Status updated to UPFRONT_PAID. Day 1 schema and monorepo boilerplate work is now underway.',
									'',
									'Best,',
									'Saurav Wahid · TechFiyr',
								].join('\n');
								const sent = await sendThreadedReply({
									to: fromAddr,
									subject,
									bodyText: ackBody,
									inReplyTo: messageId,
									references: [...references, messageId],
								});
								if (sent.ok) {
									inquiry.messages.push({
										timestamp: new Date().toISOString(),
										role: 'sales_agent',
										text: ackBody,
										messageId: sent.messageId,
									});
									await saveInquiry(inquiry);
									replied++;
								}
								await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
								processed++;
								continue;
							}
						}

						const agentResult = await runSalesAgent({
							inquiryId: inquiry.id,
							threadId: inquiry.thread_id,
							subject,
							channel: channelName,
							clientEmail: fromAddr,
							clientName: fromName || fromAddr,
							clientAgentId: fromAddr,
							projectTitle: subject.replace(/^re:\s*/i, ''),
							message: cleanText,
							description: inquiry.messages
								.filter((m) => m.role === 'client')
								.map((m) => m.text)
								.join('\n'),
						});

						const sent = await sendThreadedReply({
							to: fromAddr,
							subject,
							bodyText: agentResult.reply,
							inReplyTo: messageId,
							references: [...references, messageId],
						});

						const refreshed = await getInquiry(inquiry.id);
						if (refreshed && sent.ok) {
							const last = refreshed.messages[refreshed.messages.length - 1];
							if (last && last.role === 'sales_agent') last.messageId = sent.messageId;
							await saveInquiry(refreshed);
							replied++;
						} else if (!sent.ok) {
							errors.push(`Reply to ${fromAddr} failed: ${sent.error}`);
						}

						if (agentResult.dealClosed) closedDeals++;
						processed++;
						await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
					} catch (msgErr) {
						errors.push(msgErr instanceof Error ? msgErr.message : 'Message parse failure');
					}
				}
			}
		} finally {
			lock.release();
		}

		await client.logout();
	} catch (err) {
		errors.push(err instanceof Error ? err.message : `${cfg.provider} IMAP connection failed`);
	}

	const run: EmailSyncRun = {
		ranAt,
		ok: errors.length === 0,
		checked,
		processed,
		replied,
		closedDeals,
		errors,
	};
	await saveEmailSyncRun(run);
	return run;
}

export const syncZohoInbox = syncMailInbox;

/** Sends a manual admin reply on an Inquiry thread via SMTP and logs it in Firestore/.data. */
export async function sendManualInquiryReply(
	inquiryId: string,
	text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const inquiry = await getInquiry(inquiryId);
	if (!inquiry) return { ok: false, error: 'Inquiry not found.' };

	const body = text.trim();
	if (!body) return { ok: false, error: 'Reply text cannot be empty.' };

	const msgIds = inquiry.messages.map((m) => m.messageId).filter((m): m is string => Boolean(m));
	const lastMsgId = msgIds[msgIds.length - 1];
	const sent = await sendThreadedReply({
		to: inquiry.sender_email,
		subject: inquiry.subject,
		bodyText: body,
		inReplyTo: lastMsgId,
		references: msgIds,
	});

	if (!sent.ok) return sent;

	const now = new Date().toISOString();
	const updated: InquiryRecord = {
		...inquiry,
		status: inquiry.status === 'PENDING' ? 'NEGOTIATING' : inquiry.status,
		messages: [
			...inquiry.messages,
			{ timestamp: now, role: 'sales_agent', text: body, messageId: sent.messageId },
		],
		updated_at: now,
	};
	await saveInquiry(updated);
	return { ok: true };
}
