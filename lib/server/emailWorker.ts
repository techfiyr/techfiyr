/*
 * Zoho Mail Worker (emailWorker.ts) — server only.
 * Polls unread emails from Zoho IMAP (imapflow + mailparser), threads inquiries by
 * Message-ID / In-Reply-To / References, passes conversation history into Gemini Sales Agent
 * (lib/server/salesAgent.ts), and sends threaded replies via Zoho SMTP (nodemailer).
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

export type ZohoConfig = {
	email: string;
	password: string;
	imapHost: string;
	imapPort: number;
	smtpHost: string;
	smtpPort: number;
};

export function getZohoConfig(): ZohoConfig {
	return {
		email: env('ZOHO_EMAIL') || SALES_AGENT_EMAIL,
		password: env('ZOHO_APP_PASSWORD'),
		imapHost: env('ZOHO_IMAP_HOST') || 'imap.zoho.com',
		imapPort: Number(env('ZOHO_IMAP_PORT') || '993'),
		smtpHost: env('ZOHO_SMTP_HOST') || 'smtp.zoho.com',
		smtpPort: Number(env('ZOHO_SMTP_PORT') || '465'),
	};
}

export function isZohoConfigured(): boolean {
	const cfg = getZohoConfig();
	return Boolean(cfg.email && cfg.password);
}

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

function createSmtpTransport(cfg: ZohoConfig) {
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

	const solOrTronMatch = text.match(/(?:tx|hash|signature|trc20|solana|base|polygon)[:#\s]+([1-9A-HJ-NP-Za-km-z]{43,88}|[a-fA-F0-9]{64})/i);
	if (solOrTronMatch) return { txHash: solOrTronMatch[1] };

	const payoneerMatch = text.match(/payoneer(?:\s+ref(?:erence)?|\s+id|\s+tx)?[:#\s]+([A-Z0-9-]{6,32})/i);
	if (payoneerMatch) return { payoneerRef: payoneerMatch[1] };

	return {};
}

export async function sendZohoThreadedReply(params: {
	to: string;
	subject: string;
	bodyText: string;
	inReplyTo?: string;
	references?: string[];
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
	const cfg = getZohoConfig();
	if (!cfg.email || !cfg.password) {
		return { ok: false, error: 'Zoho Mail credentials (ZOHO_EMAIL, ZOHO_APP_PASSWORD) are not configured.' };
	}

	try {
		const transporter = createSmtpTransport(cfg);
		const refs = Array.from(new Set([...(params.references || []), ...(params.inReplyTo ? [params.inReplyTo] : [])])).filter(
			Boolean,
		);
		const info = await transporter.sendMail({
			from: `"Saurav Wahid · TechFiyr" <${cfg.email}>`,
			to: params.to,
			subject: formatReplySubject(params.subject),
			text: params.bodyText,
			...(params.inReplyTo ? { inReplyTo: params.inReplyTo } : {}),
			...(refs.length ? { references: refs.join(' ') } : {}),
		});
		return { ok: true, messageId: info.messageId || `<${Date.now()}@techfiyr.com>` };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'SMTP send failed' };
	}
}

export async function syncZohoInbox(maxMessages = 10): Promise<EmailSyncRun> {
	const ranAt = new Date().toISOString();
	const errors: string[] = [];
	let checked = 0;
	let processed = 0;
	let replied = 0;
	let closedDeals = 0;

	if (!canPersistAgentStore()) {
		const run: EmailSyncRun = {
			ranAt,
			ok: false,
			checked: 0,
			processed: 0,
			replied: 0,
			closedDeals: 0,
			errors: ['Document store is unavailable in this environment.'],
		};
		return run;
	}

	const cfg = getZohoConfig();
	if (!cfg.email || !cfg.password) {
		const run: EmailSyncRun = {
			ranAt,
			ok: false,
			checked: 0,
			processed: 0,
			replied: 0,
			closedDeals: 0,
			errors: ['Missing ZOHO_EMAIL or ZOHO_APP_PASSWORD environment variables.'],
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
						const messageId = (parsed.messageId || `zoho_${msg.uid}_${Date.now()}`).trim();
						const inReplyTo = typeof parsed.inReplyTo === 'string' ? parsed.inReplyTo.trim() : '';
						const references = Array.isArray(parsed.references)
							? parsed.references.map((r) => String(r).trim())
							: typeof parsed.references === 'string'
								? parsed.references.split(/\s+/).filter(Boolean)
								: [];

						// Skip automated bounces, daemon alerts, and self-originated mail
						const autoSubmitted = String(parsed.headers.get('auto-submitted') || '').toLowerCase();
						const precedence = String(parsed.headers.get('precedence') || '').toLowerCase();
						if (
							!fromAddr ||
							fromAddr.toLowerCase() === cfg.email.toLowerCase() ||
							/(mailer-daemon|postmaster|no-?reply)/i.test(fromAddr) ||
							(autoSubmitted && autoSubmitted !== 'no') ||
							/(bulk|junk|auto_reply)/.test(precedence)
						) {
							await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
							continue;
						}

						const rawBody = parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, ' ') : '');
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
								channel: 'zoho_email',
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

						// If order already exists for this inquiry and client sent payment tx/Payoneer ref, update order proof
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
								const sent = await sendZohoThreadedReply({
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

						// Run Gemini Sales Agent over the inquiry thread
						const agentResult = await runSalesAgent({
							inquiryId: inquiry.id,
							threadId: inquiry.thread_id,
							subject,
							channel: 'zoho_email',
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

						const sent = await sendZohoThreadedReply({
							to: fromAddr,
							subject,
							bodyText: agentResult.reply,
							inReplyTo: messageId,
							references: [...references, messageId],
						});

						// Reload inquiry after runSalesAgent updated it, and attach outgoing SMTP Message-ID
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
		errors.push(err instanceof Error ? err.message : 'Zoho IMAP connection failed');
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

/** Sends a manual admin reply on an Inquiry thread via Zoho SMTP and logs it in Firestore/.data. */
export async function sendManualInquiryReply(inquiryId: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
	const inquiry = await getInquiry(inquiryId);
	if (!inquiry) return { ok: false, error: 'Inquiry not found.' };

	const body = text.trim();
	if (!body) return { ok: false, error: 'Reply text cannot be empty.' };

	const msgIds = inquiry.messages.map((m) => m.messageId).filter((m): m is string => Boolean(m));
	const lastMsgId = msgIds[msgIds.length - 1];
	const sent = await sendZohoThreadedReply({
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

