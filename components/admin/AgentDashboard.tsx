'use client';

/*
 * Interactive 3-tab Agent Sales & Engineering Handoff workspace (/admin/agent).
 * Tab 1: Live Inquiries Monitor (Zoho Mail & A2A threads)
 * Tab 2: Orders & Pipeline (25% / 50% / 25% milestones, Crypto/Payoneer tx, 7-day countdown)
 * Tab 3: AI-Ready Specs & Handoff (SRS viewer, Copy Prompt for Dev Agent, Export JSON Spec)
 */
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { replyToInquiryAction, updateOrderMilestoneAction } from '@/app/admin/actions';
import SubmitButton from '@/components/admin/SubmitButton';
import type { AgentOrderRecord, InquiryRecord, MilestoneStatus } from '@/lib/server/agent-store';
import { srsToDevAgentPrompt } from '@/types/srs';

type PublicOrder = Omit<AgentOrderRecord, 'orderTokenHash'>;

type TabId = 'inquiries' | 'orders' | 'specs';

function formatCountdown(createdAt: string, timelineDays: number): { label: string; tone: 'good' | 'warn' | 'neutral' } {
	const createdMs = new Date(createdAt).getTime();
	if (!Number.isFinite(createdMs)) return { label: `${timelineDays}d SLA`, tone: 'neutral' };
	const deadlineMs = createdMs + timelineDays * 86_400_000;
	const diffMs = deadlineMs - Date.now();
	if (diffMs <= 0) {
		const overdueH = Math.abs(Math.round(diffMs / 3_600_000));
		return { label: `Due (${overdueH}h past)`, tone: 'warn' };
	}
	const daysLeft = Math.floor(diffMs / 86_400_000);
	const hoursLeft = Math.floor((diffMs % 86_400_000) / 3_600_000);
	return {
		label: `${daysLeft}d ${hoursLeft}h left of ${timelineDays}d`,
		tone: daysLeft >= 2 ? 'good' : 'warn',
	};
}

function milestoneProgress(status: MilestoneStatus): { percent: number; label: string; tone: 'good' | 'warn' | 'neutral' } {
	switch (status) {
		case 'UPFRONT_PAID':
			return { percent: 25, label: '25% Upfront Paid', tone: 'good' };
		case 'MVP_DELIVERED':
			return { percent: 75, label: '75% (Upfront + 50% Staging)', tone: 'good' };
		case 'FULLY_PAID':
			return { percent: 100, label: '100% Fully Settled', tone: 'good' };
		default:
			return { percent: 0, label: 'Awaiting 25% Deposit', tone: 'warn' };
	}
}

function inquiryTone(status: InquiryRecord['status']): 'good' | 'warn' | 'neutral' | 'draft' {
	if (status === 'CLOSED') return 'good';
	if (status === 'NEGOTIATING') return 'warn';
	if (status === 'REJECTED') return 'draft';
	return 'neutral';
}

function formatTs(iso: string): string {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Asia/Dhaka',
		});
	} catch {
		return iso;
	}
}

export default function AgentDashboard({
	inquiries,
	orders,
	initialTab = 'inquiries',
	initialInquiryId,
	initialOrderId,
	zohoConfigured,
}: {
	inquiries: InquiryRecord[];
	orders: PublicOrder[];
	initialTab?: TabId;
	initialInquiryId?: string;
	initialOrderId?: string;
	zohoConfigured: boolean;
}) {
	const router = useRouter();
	const [tab, setTab] = useState<TabId>(initialTab);
	const [livePolling, setLivePolling] = useState(true);
	const [selectedInquiryId, setSelectedInquiryId] = useState<string>(initialInquiryId || inquiries[0]?.id || '');
	const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || orders[0]?.id || '');
	const [specViewMode, setSpecViewMode] = useState<'structured' | 'markdown' | 'json'>('structured');
	const [copiedOrderId, setCopiedOrderId] = useState<string>('');

	useEffect(() => {
		if (!livePolling) return;
		const timer = setInterval(() => {
			router.refresh();
		}, 15000);
		return () => clearInterval(timer);
	}, [livePolling, router]);

	const selectedInquiry = inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0] || null;
	const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;

	async function copyDevPrompt(order: PublicOrder) {
		const prompt = srsToDevAgentPrompt(order.srs_json);
		try {
			await navigator.clipboard.writeText(prompt);
			setCopiedOrderId(order.id);
			setTimeout(() => setCopiedOrderId(''), 2500);
		} catch {
			// Ignore clipboard permission denials
		}
	}

	function downloadJsonSpec(order: PublicOrder) {
		const blob = new Blob([JSON.stringify(order.srs_json, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${order.id}-srs.json`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="agent-workspace">
			<div className="agent-toolbar">
				<div className="admin-tabs agent-tabs" role="tablist" aria-label="Agent sales workspace">
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'inquiries'}
						className={tab === 'inquiries' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('inquiries')}
					>
						<i className="fa-solid fa-comments" aria-hidden="true"></i> Live Inquiries
						<span>{inquiries.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'orders'}
						className={tab === 'orders' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('orders')}
					>
						<i className="fa-solid fa-coins" aria-hidden="true"></i> Orders &amp; Pipeline
						<span>{orders.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'specs'}
						className={tab === 'specs' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('specs')}
					>
						<i className="fa-solid fa-clipboard-check" aria-hidden="true"></i> AI-Ready Specs &amp; Handoff
						<span>{orders.length}</span>
					</button>
				</div>

				<div className="agent-live-controls">
					<button
						type="button"
						className={livePolling ? 'admin-btn is-small is-primary' : 'admin-btn is-small is-quiet'}
						onClick={() => setLivePolling((v) => !v)}
					>
						<i className="fa-solid fa-bolt" aria-hidden="true"></i>
						{livePolling ? 'Live sync: 15s' : 'Live sync: Off'}
					</button>
					<button type="button" className="admin-btn is-small is-quiet" onClick={() => router.refresh()}>
						<i className="fa-solid fa-rotate" aria-hidden="true"></i> Refresh
					</button>
				</div>
			</div>

			{/* TAB 1: LIVE INQUIRIES MONITOR */}
			{tab === 'inquiries' && (
				<div className="agent-split">
					<section className="admin-panel agent-thread-list" aria-label="Inquiry threads">
						<div className="admin-panel_head">
							<h2>Inquiry Threads</h2>
							<span className="admin-panel_meta">{inquiries.length} total</span>
						</div>
						{inquiries.length === 0 ? (
							<div className="admin-empty is-compact">
								<p className="admin-empty_title">No agent inquiries yet</p>
								<p className="admin-muted">
									Threads appear here as soon as a client emails Zoho Mail or queries /api/agent/negotiate or /api/mcp.
								</p>
							</div>
						) : (
							<ul className="agent-threads">
								{inquiries.map((inq) => {
									const active = selectedInquiry?.id === inq.id;
									const lastMsg = inq.messages[inq.messages.length - 1];
									return (
										<li key={inq.id}>
											<button
												type="button"
												className={active ? 'agent-thread-btn is-active' : 'agent-thread-btn'}
												onClick={() => setSelectedInquiryId(inq.id)}
											>
												<div className="agent-thread-top">
													<strong>{inq.sender_name || inq.sender_email}</strong>
													<span className={`admin-chip is-${inquiryTone(inq.status)}`}>{inq.status}</span>
												</div>
												<p className="agent-thread-subject">{inq.subject || 'Project Inquiry'}</p>
												<p className="agent-thread-preview">{lastMsg?.text.slice(0, 95) || 'No messages'}</p>
												<div className="agent-thread-meta">
													<span>{inq.channel === 'zoho_email' ? 'Zoho Mail' : inq.channel.toUpperCase()}</span>
													<span>{inq.messages.length} msgs · {formatTs(inq.updated_at)}</span>
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</section>

					<section className="admin-panel agent-thread-detail" aria-label="Conversation log">
						{!selectedInquiry ? (
							<div className="admin-empty is-compact">
								<p className="admin-empty_title">Select a thread</p>
								<p className="admin-muted">Choose an inquiry on the left to inspect the full client-agent exchange.</p>
							</div>
						) : (
							<>
								<div className="admin-panel_head">
									<div>
										<h2>{selectedInquiry.subject || 'Project Negotiation'}</h2>
										<p className="admin-muted">
											From <strong>{selectedInquiry.sender_email}</strong> · Thread <code>{selectedInquiry.thread_id}</code>
										</p>
									</div>
									<div className="agent-detail-chips">
										<span className={`admin-chip is-${inquiryTone(selectedInquiry.status)}`}>{selectedInquiry.status}</span>
										{selectedInquiry.order_id && (
											<button
												type="button"
												className="admin-btn is-small is-quiet"
												onClick={() => {
													setSelectedOrderId(selectedInquiry.order_id || '');
													setTab('orders');
												}}
											>
												View Order {selectedInquiry.order_id}
											</button>
										)}
									</div>
								</div>

								<ol className="agent-chat-log">
									{selectedInquiry.messages.map((m, idx) => (
										<li key={`${idx}-${m.timestamp}`} className={m.role === 'client' ? 'agent-msg is-client' : 'agent-msg is-agent'}>
											<div className="agent-msg-head">
												<strong>{m.role === 'client' ? selectedInquiry.sender_email : 'TechFiyr Sales Agent'}</strong>
												<span>{formatTs(m.timestamp)}</span>
											</div>
											<pre className="agent-msg-body">{m.text}</pre>
											{m.messageId && <p className="agent-msg-id">Message-ID: {m.messageId}</p>}
										</li>
									))}
								</ol>

								{selectedInquiry.channel === 'zoho_email' && (
									<form action={replyToInquiryAction} className="agent-reply-form">
										<input type="hidden" name="inquiryId" value={selectedInquiry.id} />
										<label htmlFor="manual-zoho-reply" className="admin-subhead">
											Send manual Zoho SMTP reply
										</label>
										<textarea
											id="manual-zoho-reply"
											name="message"
											rows={4}
											placeholder={
												zohoConfigured
													? 'Write a threaded reply to send from saurav.wahid@techfiyr.com...'
													: 'Configure ZOHO_EMAIL and ZOHO_APP_PASSWORD to send SMTP replies...'
											}
											required
										/>
										<div className="agent-reply-actions">
											<SubmitButton className="admin-btn is-primary" pending="Sending via Zoho...">
												<i className="fa-solid fa-paper-plane" aria-hidden="true"></i> Send Threaded Email
											</SubmitButton>
										</div>
									</form>
								)}
							</>
						)}
					</section>
				</div>
			)}

			{/* TAB 2: ORDERS & PIPELINE */}
			{tab === 'orders' && (
				<div className="agent-orders-wrap">
					{orders.length === 0 ? (
						<div className="admin-empty is-wide">
							<p className="admin-empty_title">No orders closed yet</p>
							<p className="admin-muted">
								When the Gemini Sales Agent calls closeDealAndGenerateOrder or a buyer calls /api/v1/agent-order, orders appear here with their 25% / 50% / 25% milestones.
							</p>
						</div>
					) : (
						<>
							<div className="agent-order-cards">
								{orders.map((order) => {
									const prog = milestoneProgress(order.milestone_status);
									const countdown = formatCountdown(order.created_at || order.createdAt, order.timeline_days || order.deliveryDays || 7);
									const verified = Boolean(order.crypto_tx_hash || order.payoneer_reference || order.milestone_status !== 'AWAITING_DEPOSIT');
									const isSelected = selectedOrder?.id === order.id;

									return (
										<article key={order.id} className={isSelected ? 'admin-panel agent-order-card is-selected' : 'admin-panel agent-order-card'}>
											<div className="agent-order-top">
												<div>
													<span className="agent-order-id">{order.id}</span>
													<h3>{order.projectTitle}</h3>
													<p className="admin-muted">{order.client_contact || order.clientEmail}</p>
												</div>
												<div className="agent-order-price">
													<strong>${(order.total_price_usd || order.agreedPriceUSD).toLocaleString('en-US')}</strong>
													<span>25/50/25 USD</span>
												</div>
											</div>

											<div className="agent-order-chips">
												<span className={`admin-chip is-${prog.tone}`}>{prog.label}</span>
												<span className={`admin-chip is-${countdown.tone}`}>
													<i className="fa-solid fa-clock" aria-hidden="true"></i> {countdown.label}
												</span>
												<span className={`admin-chip is-${verified ? 'good' : 'neutral'}`}>
													{verified ? 'Payment Ref Logged' : 'Deposit Pending'}
												</span>
											</div>

											<div className="agent-progress" aria-label={`Milestone completion ${prog.percent}%`}>
												<span className="agent-progress-bar" style={{ width: `${Math.max(6, prog.percent)}%` }}></span>
											</div>

											<dl className="agent-order-meta">
												<div>
													<dt>Rail / Chain</dt>
													<dd>{order.crypto_chain || order.payment.rail}</dd>
												</div>
												<div>
													<dt>Tx Hash / Payoneer Ref</dt>
													<dd>{order.crypto_tx_hash || order.payoneer_reference || 'Pending client deposit'}</dd>
												</div>
												<div>
													<dt>Stack</dt>
													<dd>{order.techStack.join(', ')}</dd>
												</div>
											</dl>

											<div className="agent-order-actions">
												<button
													type="button"
													className="admin-btn is-small is-quiet"
													onClick={() => setSelectedOrderId(order.id)}
												>
													Manage Payment &amp; Phase
												</button>
												<button
													type="button"
													className="admin-btn is-small is-primary"
													onClick={() => {
														setSelectedOrderId(order.id);
														setTab('specs');
													}}
												>
													Open AI-Ready SRS
												</button>
											</div>
										</article>
									);
								})}
							</div>

							{selectedOrder && (
								<section className="admin-panel is-wide" aria-label="Update selected order milestone">
									<div className="admin-panel_head">
										<h2>Update Order {selectedOrder.id} · {selectedOrder.projectTitle}</h2>
										<span className="admin-panel_meta">SOW {selectedOrder.sow.sowId}</span>
									</div>
									<form action={updateOrderMilestoneAction} className="agent-milestone-form">
										<input type="hidden" name="orderId" value={selectedOrder.id} />
										<div className="agent-form-grid">
											<div>
												<label htmlFor="ms-status">Milestone Status</label>
												<select id="ms-status" name="milestoneStatus" defaultValue={selectedOrder.milestone_status}>
													<option value="AWAITING_DEPOSIT">AWAITING_DEPOSIT (0%)</option>
													<option value="UPFRONT_PAID">UPFRONT_PAID (25% Deposit)</option>
													<option value="MVP_DELIVERED">MVP_DELIVERED (50% Staging Paid)</option>
													<option value="FULLY_PAID">FULLY_PAID (100% Handover Complete)</option>
												</select>
											</div>
											<div>
												<label htmlFor="ms-chain">Crypto Chain / Fiat Channel</label>
												<input
													id="ms-chain"
													type="text"
													name="cryptoChain"
													defaultValue={selectedOrder.crypto_chain || selectedOrder.payment.rail}
													placeholder="Solana (SPL) / Base (EVM) / Payoneer"
												/>
											</div>
											<div>
												<label htmlFor="ms-tx">Crypto Tx Hash</label>
												<input
													id="ms-tx"
													type="text"
													name="cryptoTxHash"
													defaultValue={selectedOrder.crypto_tx_hash}
													placeholder="0x... or Solana tx signature"
												/>
											</div>
											<div>
												<label htmlFor="ms-payoneer">Payoneer / Wire Reference</label>
												<input
													id="ms-payoneer"
													type="text"
													name="payoneerReference"
													defaultValue={selectedOrder.payoneer_reference}
													placeholder="Payoneer transaction ID"
												/>
											</div>
											<div>
												<label htmlFor="ms-staging">Day 4 Staging URL</label>
												<input
													id="ms-staging"
													type="url"
													name="stagingUrl"
													defaultValue={selectedOrder.deliverables.stagingUrl || ''}
													placeholder="https://staging.example.com"
												/>
											</div>
											<div>
												<label htmlFor="ms-repo">Day 7 GitHub Repo URL</label>
												<input
													id="ms-repo"
													type="url"
													name="repoUrl"
													defaultValue={selectedOrder.deliverables.repoUrl || ''}
													placeholder="https://github.com/techfiyr/..."
												/>
											</div>
										</div>
										<div className="agent-reply-actions">
											<SubmitButton className="admin-btn is-primary" pending="Updating order...">
												Save Milestone &amp; Payment Proof
											</SubmitButton>
										</div>
									</form>
								</section>
							)}

							<section className="admin-panel is-wide" aria-label="Orders table">
								<div className="admin-panel_head">
									<h2>All Orders Table</h2>
									<span className="admin-panel_meta">25% Upfront · 50% Staging · 25% Handover</span>
								</div>
								<div className="admin-table_wrap">
									<table className="admin-table">
										<thead>
											<tr>
												<th scope="col">Order</th>
												<th scope="col">Client</th>
												<th scope="col">Total</th>
												<th scope="col">Milestone</th>
												<th scope="col" className="is-hide-m">Payment Ref</th>
												<th scope="col">Countdown</th>
											</tr>
										</thead>
										<tbody>
											{orders.map((order) => {
												const prog = milestoneProgress(order.milestone_status);
												const cd = formatCountdown(order.created_at || order.createdAt, order.timeline_days || 7);
												return (
													<tr key={order.id}>
														<td>
															<strong>{order.projectTitle}</strong>
															<span className="admin-table_sub">{order.id}</span>
														</td>
														<td>{order.client_contact || order.clientEmail}</td>
														<td>${(order.total_price_usd || order.agreedPriceUSD).toLocaleString('en-US')}</td>
														<td><span className={`admin-chip is-${prog.tone}`}>{order.milestone_status}</span></td>
														<td className="is-hide-m">{order.crypto_tx_hash || order.payoneer_reference || order.crypto_chain}</td>
														<td><span className={`admin-chip is-${cd.tone}`}>{cd.label}</span></td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</section>
						</>
					)}
				</div>
			)}

			{/* TAB 3: AI-READY SPECS & HANDOFF */}
			{tab === 'specs' && (
				<div className="agent-specs-wrap">
					{orders.length === 0 || !selectedOrder ? (
						<div className="admin-empty is-wide">
							<p className="admin-empty_title">No AI-Developer-Ready SRS specs generated yet</p>
							<p className="admin-muted">
								Once a deal closes, its structured JSON &amp; Markdown SRS appears here ready to copy to your coding agent or export for CI/CD.
							</p>
						</div>
					) : (
						<section className="admin-panel is-wide">
							<div className="agent-spec-header">
								<div>
									<label htmlFor="srs-order-select" className="admin-subhead">Select Order Spec</label>
									<select
										id="srs-order-select"
										className="agent-spec-select"
										value={selectedOrder.id}
										onChange={(e) => setSelectedOrderId(e.target.value)}
									>
										{orders.map((o) => (
											<option key={o.id} value={o.id}>
												{o.id} — {o.projectTitle} (${o.total_price_usd || o.agreedPriceUSD})
											</option>
										))}
									</select>
								</div>

								<div className="agent-spec-actions">
									<button
										type="button"
										className="admin-btn is-primary"
										onClick={() => copyDevPrompt(selectedOrder)}
									>
										<i className={copiedOrderId === selectedOrder.id ? 'fa-solid fa-check' : 'fa-solid fa-copy'} aria-hidden="true"></i>
										{copiedOrderId === selectedOrder.id ? 'Copied Dev Agent Prompt!' : 'Copy Prompt for Dev Agent'}
									</button>
									<button
										type="button"
										className="admin-btn is-quiet"
										onClick={() => downloadJsonSpec(selectedOrder)}
									>
										<i className="fa-solid fa-download" aria-hidden="true"></i> Export JSON Spec
									</button>
								</div>
							</div>

							<div className="agent-spec-modes">
								<button
									type="button"
									className={specViewMode === 'structured' ? 'admin-btn is-small is-primary' : 'admin-btn is-small is-quiet'}
									onClick={() => setSpecViewMode('structured')}
								>
									Structured Blueprint
								</button>
								<button
									type="button"
									className={specViewMode === 'markdown' ? 'admin-btn is-small is-primary' : 'admin-btn is-small is-quiet'}
									onClick={() => setSpecViewMode('markdown')}
								>
									Markdown SRS
								</button>
								<button
									type="button"
									className={specViewMode === 'json' ? 'admin-btn is-small is-primary' : 'admin-btn is-small is-quiet'}
									onClick={() => setSpecViewMode('json')}
								>
									Raw JSON Schema
								</button>
							</div>

							{specViewMode === 'structured' && (
								<div className="agent-srs-grid">
									<div className="agent-srs-card is-full">
										<h3>Executive Overview &amp; Architecture ({selectedOrder.srs_json.architecture_pattern})</h3>
										<p>{selectedOrder.srs_json.executive_overview}</p>
										<div className="agent-stack-pills">
											{[
												...selectedOrder.srs_json.tech_stack.frontend,
												...selectedOrder.srs_json.tech_stack.backend,
												...selectedOrder.srs_json.tech_stack.database,
												...(selectedOrder.srs_json.tech_stack.mobile || []),
												...selectedOrder.srs_json.tech_stack.devops,
											].map((t) => (
												<span key={t} className="admin-chip is-good">{t}</span>
											))}
										</div>
									</div>

									<div className="agent-srs-card">
										<h3>Database Models ({selectedOrder.srs_json.database_models.length})</h3>
										{selectedOrder.srs_json.database_models.map((m) => (
											<div key={m.table_name} className="agent-srs-sub">
												<strong>{m.table_name}</strong> — <span className="admin-muted">{m.description}</span>
												<ul>
													{m.columns.map((c) => (
														<li key={c.name}>
															<code>{c.name}</code>: {c.data_type} {c.primary_key ? 'PK' : ''}
														</li>
													))}
												</ul>
											</div>
										))}
									</div>

									<div className="agent-srs-card">
										<h3>API Endpoints ({selectedOrder.srs_json.api_endpoints.length})</h3>
										<ul>
											{selectedOrder.srs_json.api_endpoints.map((ep, i) => (
												<li key={`${ep.route}-${i}`}>
													<code>{ep.method} {ep.route}</code> — {ep.description}
												</li>
											))}
										</ul>
									</div>

									<div className="agent-srs-card">
										<h3>UI Screens &amp; Routing ({selectedOrder.srs_json.ui_screens.length})</h3>
										<ul>
											{selectedOrder.srs_json.ui_screens.map((s) => (
												<li key={s.screen_id}>
													<strong>{s.title}</strong> (<code>{s.route}</code>): {s.components.join(', ')}
												</li>
											))}
										</ul>
									</div>

									<div className="agent-srs-card">
										<h3>Automated Acceptance Criteria ({selectedOrder.srs_json.acceptance_criteria.length})</h3>
										<ul>
											{selectedOrder.srs_json.acceptance_criteria.map((ac) => (
												<li key={ac.id}>
													<strong>[{ac.id}]</strong> ({ac.category}): {ac.assertion}
													{ac.verification_command && <> · <code>{ac.verification_command}</code></>}
												</li>
											))}
										</ul>
									</div>
								</div>
							)}

							{specViewMode === 'markdown' && (
								<pre className="agent-code-block">{selectedOrder.srs_markdown}</pre>
							)}

							{specViewMode === 'json' && (
								<pre className="agent-code-block">{JSON.stringify(selectedOrder.srs_json, null, 2)}</pre>
							)}
						</section>
					)}
				</div>
			)}
		</div>
	);
}

