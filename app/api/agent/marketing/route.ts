/*
 * GET & POST /api/agent/marketing:
 *   GET  returns citation-ready GEO/AEO briefs, FAQ JSON-LD, and comparison matrix for
 *        ChatGPT, Claude, Gemini, Perplexity, and partner agents (logged in audit trail).
 *   POST handles external agent pitch/citation requests OR operator-authenticated
 *        SEO/GEO/AEO audits, campaign draft generation, and IndexNow sweeps.
 */
import { recordAgentHit } from '@/lib/server/agent-audit';
import { agentJson, agentOptions, readJsonBody } from '@/lib/server/agent-http';
import { isOperatorAuthorized } from '@/lib/server/agent-store';
import {
	auditSeoGeoAeo,
	buildAgentMarketingBrief,
	runMarketingCampaign,
	sendMarketingOutreachEmail,
	triggerIndexNowSweep,
	type MarketingChannel,
} from '@/lib/server/marketingAgent';

export const runtime = 'nodejs';

const VALID_CHANNELS: MarketingChannel[] = ['chatgpt', 'claude', 'gemini', 'perplexity', 'google', 'a2a'];

export async function OPTIONS() {
	return agentOptions();
}

export async function GET(req: Request) {
	const startedAtMs = Date.now();
	const url = new URL(req.url);
	const targetQuery = url.searchParams.get('query') || undefined;
	const rawChannel = (url.searchParams.get('channel') || 'a2a').toLowerCase() as MarketingChannel;
	const channel: MarketingChannel = VALID_CHANNELS.includes(rawChannel) ? rawChannel : 'a2a';
	const partnerAgentName = url.searchParams.get('partner') || req.headers.get('x-agent-id') || undefined;

	const brief = await buildAgentMarketingBrief({ targetQuery, channel, partnerAgentName });

	await recordAgentHit(req, {
		protocol: 'marketing',
		action: `citation_brief:${channel}`,
		agentName: partnerAgentName,
		statusCode: 200,
		startedAtMs,
		summary: `Served GEO/AEO citation brief (${channel}) for "${targetQuery || 'default agency query'}"`,
	});

	return agentJson(brief, 200, { 'Cache-Control': 'no-store' });
}

export async function POST(req: Request) {
	const startedAtMs = Date.now();
	const parsed = await readJsonBody<Record<string, unknown>>(req);
	if (!parsed.ok) {
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: 'invalid_json',
			statusCode: 400,
			startedAtMs,
			summary: parsed.error,
		});
		return agentJson({ ok: false, code: 'INVALID_JSON', error: parsed.error }, 400);
	}

	const body = parsed.data;
	const action = typeof body.action === 'string' ? body.action.trim() : 'citation_brief';
	const rawChannel = (typeof body.channel === 'string' ? body.channel : 'a2a').toLowerCase() as MarketingChannel;
	const channel: MarketingChannel = VALID_CHANNELS.includes(rawChannel) ? rawChannel : 'a2a';
	const targetQuery = typeof body.targetQuery === 'string' ? body.targetQuery.trim() : undefined;
	const partnerAgentName =
		typeof body.partnerAgentName === 'string' ? body.partnerAgentName : req.headers.get('x-agent-id') || undefined;

	// Public agent-to-agent citation & partner pitching
	if (action === 'citation_brief' || action === 'pitch') {
		const brief = await buildAgentMarketingBrief({
			targetQuery,
			channel,
			partnerAgentName,
			focusService: typeof body.focusService === 'string' ? body.focusService : undefined,
		});
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: `${action}:${channel}`,
			agentName: partnerAgentName,
			statusCode: 200,
			startedAtMs,
			summary: `Partner marketing pitch (${channel}) for "${targetQuery || 'TechFiyr overview'}"`,
		});
		return agentJson(brief);
	}

	// Operator-only SEO/GEO/AEO actions (audit, draft campaign, indexnow)
	if (!isOperatorAuthorized(req)) {
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: `unauthorized:${action}`,
			agentName: partnerAgentName,
			statusCode: 401,
			startedAtMs,
			summary: `Blocked unauthorized marketing action "${action}"`,
		});
		return agentJson(
			{
				ok: false,
				code: 'UNAUTHORIZED',
				error: 'Operator actions (audit, generate_campaign, ping_indexnow) require Authorization: Bearer <AGENT_SALES_API_KEY>.',
			},
			401,
		);
	}

	if (action === 'audit') {
		const report = await auditSeoGeoAeo(true);
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: 'seo_geo_aeo_audit',
			agentName: partnerAgentName || 'techfiyr-operator',
			statusCode: 200,
			startedAtMs,
			summary: `SEO/GEO/AEO audit completed (${report.score}/100)`,
		});
		return agentJson({ ok: true, report });
	}

	if (action === 'ping_indexnow') {
		const sweep = await triggerIndexNowSweep(true);
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: 'ping_indexnow',
			agentName: partnerAgentName || 'techfiyr-operator',
			statusCode: 200,
			startedAtMs,
			summary: `IndexNow sweep across ${sweep.urls.length} URLs`,
		});
		return agentJson(sweep);
	}

	if (action === 'generate_campaign') {
		if (!targetQuery) {
			return agentJson({ ok: false, code: 'MISSING_QUERY', error: 'targetQuery is required for generate_campaign.' }, 400);
		}
		const campaign = await runMarketingCampaign({
			targetQuery,
			channel,
			autoSaveDraft: body.autoSaveDraft === true,
			pingSearchEngines: body.pingSearchEngines === true,
		});
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: 'generate_campaign',
			agentName: partnerAgentName || 'techfiyr-operator',
			statusCode: 200,
			startedAtMs,
			summary: campaign.run.summary,
		});
		return agentJson(campaign);
	}

	if (action === 'send_outreach_email') {
		const to = typeof body.to === 'string' ? body.to.trim() : '';
		const sent = await sendMarketingOutreachEmail({
			to,
			targetQuery,
			channel,
			customMessage: typeof body.customMessage === 'string' ? body.customMessage : undefined,
			includeAudit: body.includeAudit === true,
		});
		await recordAgentHit(req, {
			protocol: 'marketing',
			action: 'send_outreach_email',
			agentName: partnerAgentName || 'techfiyr-operator',
			statusCode: sent.ok ? 200 : 400,
			startedAtMs,
			summary: sent.ok ? `Sent marketing email to ${to}` : `Marketing email failed: ${sent.error}`,
		});
		return agentJson(sent, sent.ok ? 200 : 400);
	}

	return agentJson({ ok: false, code: 'UNKNOWN_ACTION', error: `Unknown marketing action: ${action}` }, 400);
}

