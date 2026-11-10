/*
 * GET /api/agent/audit: operator-authenticated JSON report of MCP/A2A/REST/Marketing agent
 * hit audit logs, unique agents reached, MCP tool counts, and sales agent inquiry totals.
 */
import { getAgentReachSummary } from '@/lib/server/agent-audit';
import { agentJson, agentOptions } from '@/lib/server/agent-http';
import { isOperatorAuthorized } from '@/lib/server/agent-store';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function GET(req: Request) {
	if (!isOperatorAuthorized(req)) {
		return agentJson(
			{
				ok: false,
				code: 'UNAUTHORIZED',
				error: 'Reading audit logs requires Authorization: Bearer <AGENT_SALES_API_KEY>.',
			},
			401,
		);
	}

	const limitParam = Number(new URL(req.url).searchParams.get('limit') || '100');
	const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(250, Math.round(limitParam))) : 100;
	const summary = await getAgentReachSummary(limit);
	return agentJson({ ok: true, ...summary });
}

