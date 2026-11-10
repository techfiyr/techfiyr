/*
 * POST /api/agent/email/sync: polls Mail IMAP (Gmail) for unread client inquiries,
 * passes threads through the Gemini Sales Agent, and replies via SMTP.
 * Protected by Authorization: Bearer <CRON_SECRET or AGENT_SALES_API_KEY>.
 */
import { agentJson, agentOptions } from '@/lib/server/agent-http';
import { isOperatorAuthorized } from '@/lib/server/agent-store';
import { syncMailInbox } from '@/lib/server/emailWorker';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function OPTIONS() {
	return agentOptions();
}

export async function POST(req: Request) {
	if (!isOperatorAuthorized(req)) {
		return agentJson(
			{
				ok: false,
				code: 'UNAUTHORIZED',
				error: 'Authorization: Bearer <CRON_SECRET or AGENT_SALES_API_KEY> required.',
			},
			401,
		);
	}

	// Process up to 4 unseen messages per scheduled run so Netlify's 5-minute cron finishes well inside timeout limits
	const run = await syncMailInbox(4);
	return agentJson(run, run.ok ? 200 : 502);
}

