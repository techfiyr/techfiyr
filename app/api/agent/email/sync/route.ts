/*
 * POST /api/agent/email/sync: polls Zoho Mail IMAP for unread client inquiries,
 * passes threads through the Gemini Sales Agent, and replies via Zoho SMTP.
 * Protected by Authorization: Bearer <CRON_SECRET> or <AGENT_API_KEY>.
 */
import { agentJson, agentOptions } from '@/lib/server/agent-http';
import { isOperatorAuthorized } from '@/lib/server/agent-store';
import { syncZohoInbox } from '@/lib/server/emailWorker';

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
				error: 'Authorization: Bearer <CRON_SECRET or AGENT_API_KEY> required.',
			},
			401,
		);
	}

	const run = await syncZohoInbox(10);
	return agentJson(run, run.ok ? 200 : 502);
}

