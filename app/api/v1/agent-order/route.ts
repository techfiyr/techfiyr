/*
 * POST /api/v1/agent-order: public machine-readable order intake endpoint advertised in
 * llms.txt, openapi.json, and /.well-known/agent.json for autonomous buyer agents.
 */
import { handleCreateOrderRequest } from '@/app/api/agent/orders/route';
import { agentOptions } from '@/lib/server/agent-http';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function POST(req: Request) {
	return handleCreateOrderRequest(req);
}

