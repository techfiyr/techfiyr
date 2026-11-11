/*
 * /admin/agent: Real-time A2A Commerce, Zoho Mail Sales Closer, Agent Hit Audit Trail,
 * Inquiry Reach Counter, AI-Ready SRS Handoff, and SEO/GEO/AEO Marketing Agent Dashboard.
 */
import type { Metadata } from 'next';
import { syncZohoNow } from '@/app/admin/actions';
import AgentDashboard from '@/components/admin/AgentDashboard';
import SubmitButton from '@/components/admin/SubmitButton';
import { Chip, PageHead, Stat, timeAgo } from '@/components/admin/ui';
import { SALES_AGENT_EMAIL } from '@/lib/agent/catalog';
import { getAgentReachSummary } from '@/lib/server/agent-audit';
import {
	lastEmailSyncRun,
	listInquiries,
	listMarketingRuns,
	listOrders,
	publicOrderView,
} from '@/lib/server/agent-store';
import { getMailConfig, isMailConfigured } from '@/lib/server/emailWorker';
import { auditSeoGeoAeo } from '@/lib/server/marketingAgent';

export const metadata: Metadata = { title: 'Agent Sales' };

export default async function AdminAgentPage({
	searchParams,
}: {
	searchParams: Promise<{
		tab?: string;
		inquiry?: string;
		order?: string;
		synced?: string;
		replied?: string;
		syncErr?: string;
		sent?: string;
		updated?: string;
		audited?: string;
		pinged?: string;
		broadcasted?: string;
		campaign?: string;
		draftPost?: string;
		mktSent?: string;
		err?: string;
	}>;
}) {
	const params = await searchParams;
	const [inquiries, rawOrders, syncRun, reachSummary, seoAudit, marketingRuns] = await Promise.all([
		listInquiries(),
		listOrders(),
		lastEmailSyncRun(),
		getAgentReachSummary(120),
		auditSeoGeoAeo(false),
		listMarketingRuns(20),
	]);
	const orders = rawOrders.map(publicOrderView);
	const mailReady = isMailConfigured();
	const mailCfg = getMailConfig();

	const initialTab =
		params.tab === 'orders'
			? 'orders'
			: params.tab === 'specs'
				? 'specs'
				: params.tab === 'audit'
					? 'audit'
					: params.tab === 'marketing'
						? 'marketing'
						: 'inquiries';

	const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price_usd || o.agreedPriceUSD), 0);

	return (
		<>
			<PageHead
				title="Agent Sales, Audit & SEO/GEO Hub"
				intro={
					<>
						{mailCfg.provider === 'gmail' ? 'Gmail' : 'Zoho Mail'} closer (<code>{mailCfg.email || SALES_AGENT_EMAIL}</code>), MCP/A2A hit audit trail,
						Crypto/Payoneer orders (25% / 50% / 25%), and SEO/GEO/AEO Marketing Agent.
					</>
				}
				actions={
					<form action={syncZohoNow}>
						<SubmitButton className="admin-btn is-primary" pending="Syncing Mail Inbox...">
							<i className="fa-solid fa-envelope" aria-hidden="true"></i> Sync {mailCfg.provider === 'gmail' ? 'Gmail' : 'Mail'} Inbox
						</SubmitButton>
					</form>
				}
			/>

			{params.synced !== undefined && (
				<p className={params.syncErr ? 'admin-alert is-error' : 'admin-alert is-good'} role="status">
					<i className={params.syncErr ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'} aria-hidden="true"></i>{' '}
					Inbox checked: processed {params.synced} message(s), sent {params.replied || 0} threaded reply(ies).
					{syncRun?.errors?.length ? ` (${syncRun.errors[0]})` : ''}
				</p>
			)}
			{params.sent && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Threaded email reply dispatched via {mailCfg.smtpHost}.
				</p>
			)}
			{params.mktSent && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Marketing Agent email sent to {params.mktSent} via {mailCfg.smtpHost}.
				</p>
			)}
			{params.updated && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Order milestone &amp; payment proof updated.
				</p>
			)}
			{params.audited !== undefined && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> SEO/GEO/AEO audit completed: {params.audited}/100.
				</p>
			)}
			{params.pinged !== undefined && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> IndexNow sweep executed across {params.pinged} public URLs.
				</p>
			)}
			{params.broadcasted !== undefined && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Agent network broadcast completed ({params.broadcasted} live discovery endpoints reachable).
				</p>
			)}
			{params.campaign && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Marketing Agent generated GEO/AEO brief
					{params.draftPost ? (
						<>
							{' '}and saved a blog draft (<a href={`/admin/blog/${params.draftPost}`}>Edit draft</a>)
						</>
					) : (
						''
					)}.
				</p>
			)}
			{params.err && (
				<p className="admin-alert is-error" role="status">
					<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> {params.err}
				</p>
			)}

			<div className="admin-panel agent-summary-bar">
				<dl className="admin-stats agent-stats-four">
					<Stat
						label="Agents Reached (Audit)"
						value={reachSummary.metrics.totalHits}
						note={`${reachSummary.metrics.uniqueAgents.length} unique agents · MCP ${reachSummary.metrics.mcpHits} · A2A ${reachSummary.metrics.a2aHits}`}
					/>
					<Stat
						label="Sales Agent Inquiries"
						value={reachSummary.inquiries.total}
						note={`Email ${reachSummary.inquiries.byChannel.email} · MCP ${reachSummary.inquiries.byChannel.mcp} · A2A ${reachSummary.inquiries.byChannel.a2a}`}
					/>
					<Stat
						label="Closed Orders"
						value={orders.length}
						note={`$${totalRevenue.toLocaleString('en-US')} total value`}
					/>
					<Stat
						label="SEO / GEO / AEO"
						value={<Chip tone={seoAudit.score >= 80 ? 'good' : 'warn'}>{seoAudit.score}/100</Chip>}
						note={
							mailReady
								? syncRun
									? `${mailCfg.provider} sync ${timeAgo(syncRun.ranAt)}`
									: `${mailCfg.provider} ready`
								: `${mailCfg.provider} IMAP waiting`
						}
					/>
				</dl>
			</div>

			<AgentDashboard
				inquiries={inquiries}
				orders={orders}
				reachSummary={reachSummary}
				seoAudit={seoAudit}
				marketingRuns={marketingRuns}
				initialTab={initialTab}
				initialInquiryId={params.inquiry}
				initialOrderId={params.order}
				mailConfigured={mailReady}
				mailAddress={mailCfg.email}
			/>
		</>
	);
}
