/*
 * /admin/agent: Real-time A2A Commerce, Zoho Mail Sales Closer & AI-Ready SRS Dashboard.
 * Displays live inquiry threads, 25%/50%/25% milestone orders, and AI-Developer-Ready SRS specs.
 */
import type { Metadata } from 'next';
import { syncZohoNow } from '@/app/admin/actions';
import AgentDashboard from '@/components/admin/AgentDashboard';
import SubmitButton from '@/components/admin/SubmitButton';
import { Chip, PageHead, Stat, timeAgo } from '@/components/admin/ui';
import { SALES_AGENT_EMAIL } from '@/lib/agent/catalog';
import { lastEmailSyncRun, listInquiries, listOrders, publicOrderView } from '@/lib/server/agent-store';
import { getZohoConfig, isZohoConfigured } from '@/lib/server/emailWorker';

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
		err?: string;
	}>;
}) {
	const params = await searchParams;
	const [inquiries, rawOrders, syncRun] = await Promise.all([listInquiries(), listOrders(), lastEmailSyncRun()]);
	const orders = rawOrders.map(publicOrderView);
	const zohoReady = isZohoConfigured();
	const zohoCfg = getZohoConfig();

	const initialTab =
		params.tab === 'orders' ? 'orders' : params.tab === 'specs' ? 'specs' : 'inquiries';

	const openCount = inquiries.filter((i) => i.status === 'PENDING' || i.status === 'NEGOTIATING').length;
	const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price_usd || o.agreedPriceUSD), 0);

	return (
		<>
			<PageHead
				title="Agent Sales & SRS Hub"
				intro={
					<>
						Autonomous Zoho Mail closer (<code>{zohoCfg.email || SALES_AGENT_EMAIL}</code>) and A2A / MCP endpoints.
						No Stripe or Twilio; payments settle via Solana/Base USDC, USDT (TRC20/Polygon), or Payoneer (25% / 50% / 25%).
					</>
				}
				actions={
					<form action={syncZohoNow}>
						<SubmitButton className="admin-btn is-primary" pending="Syncing Zoho IMAP...">
							<i className="fa-solid fa-envelope" aria-hidden="true"></i> Sync Zoho Inbox
						</SubmitButton>
					</form>
				}
			/>

			{params.synced !== undefined && (
				<p className={params.syncErr ? 'admin-alert is-error' : 'admin-alert is-good'} role="status">
					<i className={params.syncErr ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'} aria-hidden="true"></i>{' '}
					Zoho Inbox checked: processed {params.synced} message(s), sent {params.replied || 0} threaded reply(ies).
					{syncRun?.errors?.length ? ` (${syncRun.errors[0]})` : ''}
				</p>
			)}
			{params.sent && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Threaded email reply dispatched via Zoho SMTP.
				</p>
			)}
			{params.updated && (
				<p className="admin-alert is-good" role="status">
					<i className="fa-solid fa-circle-check" aria-hidden="true"></i> Order milestone &amp; payment proof updated.
				</p>
			)}
			{params.err && (
				<p className="admin-alert is-error" role="status">
					<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> {params.err}
				</p>
			)}

			<div className="admin-panel agent-summary-bar">
				<dl className="admin-stats agent-stats">
					<Stat label="Open Negotiations" value={openCount} note={`${inquiries.length} total threads`} />
					<Stat label="Closed Orders" value={orders.length} note={`$${totalRevenue.toLocaleString('en-US')} total value`} />
					<Stat
						label="Zoho IMAP / SMTP"
						value={<Chip tone={zohoReady ? 'good' : 'warn'}>{zohoReady ? 'Connected' : 'Configure Env'}</Chip>}
						note={syncRun ? `Last sync ${timeAgo(syncRun.ranAt)}` : zohoCfg.imapHost}
					/>
				</dl>
			</div>

			<AgentDashboard
				inquiries={inquiries}
				orders={orders}
				initialTab={initialTab}
				initialInquiryId={params.inquiry}
				initialOrderId={params.order}
				zohoConfigured={zohoReady}
			/>
		</>
	);
}

