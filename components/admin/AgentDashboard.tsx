'use client';

/*
 * Interactive 5-tab Agent Sales, Audit Trail & Marketing Hub (/admin/agent).
 * Tab 1: Live Inquiries Monitor (Zoho Mail, MCP & A2A threads)
 * Tab 2: Orders & Pipeline (25% / 50% / 25% milestones, Crypto/Payoneer tx, 7-day countdown)
 * Tab 3: AI-Ready Specs & Handoff (SRS viewer, Copy Prompt for Dev Agent, Export JSON Spec)
 * Tab 4: Agent Hit Audit Log (MCP, A2A, REST, Marketing hits + inquiry channel counts)
 * Tab 5: SEO / GEO / AEO Marketing Agent (ChatGPT, Claude, Gemini, Perplexity & Google Rank)
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
	broadcastRegistriesAction,
	pingIndexNowAction,
	replyToInquiryAction,
	runMarketingAuditAction,
	runMarketingCampaignAction,
	sendMarketingEmailAction,
	updateOrderMilestoneAction,
} from '@/app/admin/actions';
import SubmitButton from '@/components/admin/SubmitButton';
import type { AgentReachSummary } from '@/lib/server/agent-audit';
import type {
	AgentOrderRecord,
	InquiryRecord,
	MarketingRunRecord,
	MilestoneStatus,
} from '@/lib/server/agent-store';
import type { SeoGeoAeoAuditReport } from '@/lib/server/marketingAgent';
import { srsToDevAgentPrompt } from '@/types/srs';

type PublicOrder = Omit<AgentOrderRecord, 'orderTokenHash'>;

type TabId = 'inquiries' | 'orders' | 'specs' | 'audit' | 'marketing';

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
			second: '2-digit',
			timeZone: 'Asia/Dhaka',
		});
	} catch {
		return iso;
	}
}

export default function AgentDashboard({
	inquiries,
	orders,
	reachSummary,
	seoAudit,
	marketingRuns,
	initialTab = 'inquiries',
	initialInquiryId,
	initialOrderId,
	mailConfigured,
	mailAddress,
}: {
	inquiries: InquiryRecord[];
	orders: PublicOrder[];
	reachSummary: AgentReachSummary;
	seoAudit: SeoGeoAeoAuditReport;
	marketingRuns: MarketingRunRecord[];
	initialTab?: TabId;
	initialInquiryId?: string;
	initialOrderId?: string;
	mailConfigured: boolean;
	mailAddress: string;
}) {
	const router = useRouter();
	const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
	const safeOrders = Array.isArray(orders) ? orders : [];
	const safeReachSummary = reachSummary || {
		metrics: { totalHits: 0, mcpHits: 0, a2aHits: 0, restHits: 0, marketingHits: 0, toolCalls: {}, uniqueAgents: [], lastHitAt: '' },
		recentHits: [],
		inquiries: { total: 0, openOrNegotiating: 0, closedDeals: 0, rejected: 0, byChannel: { email: 0, mcp: 0, a2a: 0 }, totalMessagesExchanged: 0 },
	};
	const safeSeoAudit = seoAudit || { score: 100, checks: [], recommendedQueries: [] };

	const [tab, setTab] = useState<TabId>(initialTab);
	const [livePolling, setLivePolling] = useState(true);
	const [selectedInquiryId, setSelectedInquiryId] = useState<string>(initialInquiryId || safeInquiries[0]?.id || '');
	const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(Boolean(initialInquiryId));
	const [replyText, setReplyText] = useState<string>('');
	const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || safeOrders[0]?.id || '');
	const [specViewMode, setSpecViewMode] = useState<'structured' | 'markdown' | 'json'>('structured');
	const [copiedOrderId, setCopiedOrderId] = useState<string>('');
	const [auditFilter, setAuditFilter] = useState<'all' | 'mcp' | 'a2a' | 'rest' | 'marketing'>('all');
	const [campaignQuery, setCampaignQuery] = useState<string>(
		safeSeoAudit.recommendedQueries?.[0] || 'How much does a 7-day Flutter or Next.js MVP cost?',
	);

	function insertTemplate(snippet: string) {
		setReplyText((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
	}

	useEffect(() => {
		if (!livePolling) return;
		const timer = setInterval(() => {
			if (typeof document !== 'undefined' && document.hidden) return;
			router.refresh();
		}, 30000);
		return () => clearInterval(timer);
	}, [livePolling, router]);

	const selectedInquiry = safeInquiries.find((i) => i.id === selectedInquiryId) || safeInquiries[0] || null;
	const selectedOrder = safeOrders.find((o) => o.id === selectedOrderId) || safeOrders[0] || null;
	const recentHits = safeReachSummary.recentHits || [];
	const filteredHits =
		auditFilter === 'all'
			? recentHits
			: recentHits.filter((h) => h.protocol === auditFilter);

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
						<i className="fa-solid fa-comments" aria-hidden="true"></i> Inquiries
						<span>{inquiries.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'orders'}
						className={tab === 'orders' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('orders')}
					>
						<i className="fa-solid fa-coins" aria-hidden="true"></i> Orders
						<span>{orders.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'specs'}
						className={tab === 'specs' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('specs')}
					>
						<i className="fa-solid fa-clipboard-check" aria-hidden="true"></i> AI-Ready SRS
						<span>{orders.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'audit'}
						className={tab === 'audit' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('audit')}
					>
						<i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Agent Hit Audit
						<span>{reachSummary.metrics.totalHits}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'marketing'}
						className={tab === 'marketing' ? 'agent-tab is-active' : 'agent-tab'}
						onClick={() => setTab('marketing')}
					>
						<i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i> SEO/GEO/AEO Agent
						<span>{seoAudit.score}%</span>
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
				<div className={mobileChatOpen ? 'agent-split is-mobile-chat-open' : 'agent-split'}>
					<section className="admin-panel agent-thread-list" aria-label="Inquiry threads">
						<div className="admin-panel_head">
							<h2>Inquiry Threads</h2>
							<span className="admin-panel_meta">
								{inquiries.length} total · {reachSummary.inquiries.totalMessagesExchanged} msgs
							</span>
						</div>
						{inquiries.length === 0 ? (
							<div className="admin-empty is-compact">
								<p className="admin-empty_title">No agent inquiries yet</p>
								<p className="admin-muted">
									Threads appear here as soon as a client emails Gmail/Zoho or queries /api/agent/negotiate or /api/mcp.
								</p>
							</div>
						) : (
							<ul className="agent-threads">
								{safeInquiries.map((inq) => {
									const active = selectedInquiry?.id === inq.id;
									const msgs = Array.isArray(inq.messages) ? inq.messages : [];
									const lastMsg = msgs[msgs.length - 1];
									const avatarInitial = (inq.sender_name || inq.sender_email || 'C')[0]?.toUpperCase() || 'C';
									return (
										<li key={inq.id}>
											<button
												type="button"
												className={active ? 'agent-thread-btn is-active' : 'agent-thread-btn'}
												onClick={() => {
													setSelectedInquiryId(inq.id);
													setMobileChatOpen(true);
												}}
											>
												<div className="agent-thread-avatar">
													{avatarInitial}
													<span className="agent-thread-avatar-dot"></span>
												</div>
												<div className="agent-thread-item-content">
													<div className="agent-thread-top">
														<strong>{inq.sender_name || inq.sender_email}</strong>
														<span className={`admin-chip is-${inquiryTone(inq.status)}`}>{inq.status}</span>
													</div>
													<p className="agent-thread-subject">{inq.subject || 'Project Inquiry'}</p>
													<p className="agent-thread-preview">{lastMsg?.text?.slice(0, 85) || 'No messages'}</p>
													<div className="agent-thread-meta">
														<span>
															{inq.channel === 'gmail'
																? 'Gmail'
																: inq.channel === 'zoho_email'
																	? 'Zoho Mail'
																	: inq.channel.toUpperCase()}
														</span>
														<span>{msgs.length} msgs · {formatTs(inq.updated_at)}</span>
													</div>
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</section>

					<section className="agent-thread-detail" aria-label="Conversation window">
						{!selectedInquiry ? (
							<div className="admin-panel admin-empty is-compact">
								<p className="admin-empty_title">Select a thread</p>
								<p className="admin-muted">Choose an inquiry on the left to inspect the WhatsApp-style client exchange.</p>
							</div>
						) : (
							<div className="agent-chat-window">
								<div className="agent-chat-header">
									<div className="agent-chat-header-user">
										<button
											type="button"
											className="agent-chat-back-btn"
											onClick={() => setMobileChatOpen(false)}
											aria-label="Back to threads"
										>
											<i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Back
										</button>
										<div className="agent-chat-avatar">
											{(selectedInquiry.sender_name || selectedInquiry.sender_email || 'C')[0]?.toUpperCase() || 'C'}
											<span className="agent-chat-avatar-status"></span>
										</div>
										<div className="agent-chat-meta-wrap">
											<h3>{selectedInquiry.sender_name || selectedInquiry.sender_email}</h3>
											<div className="agent-chat-submeta">
												<span>{selectedInquiry.sender_email}</span>
												{selectedInquiry.company_name && <span>· <strong>{selectedInquiry.company_name}</strong></span>}
												{selectedInquiry.sender_location && <span>· <i className="fa-solid fa-location-dot" aria-hidden="true"></i> {selectedInquiry.sender_location}</span>}
												<span>· {selectedInquiry.channel.toUpperCase()}</span>
											</div>
										</div>
									</div>

									<div className="agent-chat-actions">
										<span className={`admin-chip is-${inquiryTone(selectedInquiry.status)}`}>{selectedInquiry.status}</span>
										<a
											href="https://wa.me/8801540659530"
											target="_blank"
											rel="noopener noreferrer"
											className="admin-btn is-small is-quiet"
											title="Open TechFiyr WhatsApp Chat"
										>
											<i className="fa-brands fa-whatsapp text-success" aria-hidden="true"></i> WhatsApp
										</a>
										{selectedInquiry.order_id && (
											<button
												type="button"
												className="admin-btn is-small is-primary"
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
									<li className="agent-chat-date-pill">
										<span>
											{selectedInquiry.subject || 'Project Negotiation'} · Thread {selectedInquiry.thread_id.slice(0, 12)}
										</span>
									</li>

									{(Array.isArray(selectedInquiry.messages) ? selectedInquiry.messages : []).map((m, idx) => {
										const isClient = m.role === 'client';
										return (
											<li key={`${idx}-${m.timestamp}`} className={isClient ? 'agent-msg is-client' : 'agent-msg is-agent'}>
												<div className="agent-msg-head">
													<strong>
														<i className={isClient ? 'fa-solid fa-user me-1' : 'fa-solid fa-robot me-1'} aria-hidden="true"></i>
														{isClient
															? selectedInquiry.sender_name || selectedInquiry.sender_email
															: 'TechFiyr Sales Agent'}
													</strong>
													<span>{formatTs(m.timestamp)}</span>
												</div>
												<p className="agent-msg-body">{m.text}</p>
												<div className="agent-msg-footer">
													<span>{formatTs(m.timestamp)}</span>
													<i className={isClient ? 'fa-solid fa-check' : 'fa-solid fa-check-double text-success'} aria-hidden="true"></i>
												</div>
												{m.messageId && <p className="agent-msg-id">ID: {m.messageId}</p>}
											</li>
										);
									})}
								</ol>

								{(selectedInquiry.channel === 'gmail' || selectedInquiry.channel === 'zoho_email' || selectedInquiry.channel === 'email') && (
									<div className="agent-composer">
										<div className="agent-composer-templates">
											<button
												type="button"
												className="agent-template-pill"
												onClick={() =>
													insertTemplate(
														'Please share your WhatsApp number and email address so our technical leads can follow up directly. You can also reach our co-founders on WhatsApp at +880 1540659530 or info@techfiyr.com.',
													)
												}
											>
												<i className="fa-brands fa-whatsapp" aria-hidden="true"></i> Request WhatsApp / Contact
											</button>
											<button
												type="button"
												className="agent-template-pill"
												onClick={() =>
													insertTemplate(
														'We deliver complete production-grade MVPs in 7 business days with a milestone structure of 25% upfront deposit, 50% on Day 4 staging review, and 25% upon final deployment. Full source code, CI/CD, and App Store / Play Store release included.',
													)
												}
											>
												<i className="fa-solid fa-bolt" aria-hidden="true"></i> 7-Day MVP Proposal
											</button>
											<button
												type="button"
												className="agent-template-pill"
												onClick={() =>
													insertTemplate(
														'You can book a direct 15-minute scoping call with our lead developer: https://techfiyr.com/contact#contact',
													)
												}
											>
												<i className="fa-solid fa-calendar-check" aria-hidden="true"></i> Meeting Booking Link
											</button>
										</div>

										<form action={replyToInquiryAction}>
											<input type="hidden" name="inquiryId" value={selectedInquiry.id} />
											<div className="agent-composer-box">
												<textarea
													name="message"
													value={replyText}
													onChange={(e) => setReplyText(e.target.value)}
													className="agent-composer-input"
													placeholder={
														mailConfigured
															? `Type a message to ${selectedInquiry.sender_email} (sends via ${mailAddress})...`
															: 'Configure Gmail/Zoho in env to dispatch threaded replies...'
													}
													rows={2}
													required
												/>
												<SubmitButton
													className="agent-send-btn"
													pending="..."
													aria-label="Send threaded message"
												>
													<i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
												</SubmitButton>
											</div>
											<div className="agent-composer-hint">
												<span>
													<i className="fa-solid fa-envelope me-1" aria-hidden="true"></i>{' '}
													Dispatches threaded SMTP email from {mailAddress}
												</span>
												<span>Shift+Enter for newline</span>
											</div>
										</form>
									</div>
								)}
							</div>
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
						<div className="agent-orders-split">
							<div className="agent-orders-list-col">
								<div className="agent-orders-stack">
									{orders.map((order) => {
										const prog = milestoneProgress(order.milestone_status);
										const countdown = formatCountdown(order.created_at || order.createdAt, order.timeline_days || order.deliveryDays || 7);
										const verified = Boolean(order.crypto_tx_hash || order.payoneer_reference || order.milestone_status !== 'AWAITING_DEPOSIT');
										const isSelected = selectedOrder?.id === order.id;

										return (
											<article
												key={order.id}
												className={isSelected ? 'admin-panel agent-order-card is-selected is-clickable' : 'admin-panel agent-order-card is-clickable'}
												onClick={() => setSelectedOrderId(order.id)}
											>
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
														className={isSelected ? 'admin-btn is-small is-primary' : 'admin-btn is-small is-quiet'}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedOrderId(order.id);
														}}
													>
														Manage Phase &amp; Payment
													</button>
													<button
														type="button"
														className="admin-btn is-small is-quiet"
														onClick={(e) => {
															e.stopPropagation();
															setSelectedOrderId(order.id);
															setTab('specs');
														}}
													>
														Open AI SRS
													</button>
												</div>
											</article>
										);
									})}
								</div>
							</div>

							{selectedOrder && (
								<div className="agent-order-manage-col">
									<section className="admin-panel" aria-label="Update selected order milestone">
										<div className="admin-panel_head">
											<div>
												<h2>Manage Order {selectedOrder.id}</h2>
												<p className="admin-muted">{selectedOrder.projectTitle} · SOW {selectedOrder.sow.sowId}</p>
											</div>
											<span className="admin-panel_meta">${(selectedOrder.total_price_usd || selectedOrder.agreedPriceUSD).toLocaleString('en-US')}</span>
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
								</div>
							)}
						</div>
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
								<div className="agent-srs-columns">
									<div className="agent-srs-card is-full" style={{ gridColumn: '1 / -1' }}>
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

									<div className="agent-srs-column">
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

									<div className="agent-srs-column">
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

			{/* TAB 4: AGENT HIT AUDIT LOG & INQUIRY REACH */}
			{tab === 'audit' && (
				<div className="agent-orders-wrap">
					<div className="admin-grid">
						<section className="admin-panel">
							<div className="admin-panel_head">
								<h2>Agent Reach by Protocol</h2>
								<span className="admin-panel_meta">
									Last hit: {reachSummary.metrics.lastHitAt ? formatTs(reachSummary.metrics.lastHitAt) : 'None yet'}
								</span>
							</div>
							<dl className="admin-stats agent-stats-two-by-two">
								<div className="admin-stat">
									<dt>MCP Server</dt>
									<dd><span className="admin-stat_value">{reachSummary.metrics.mcpHits}</span></dd>
								</div>
								<div className="admin-stat">
									<dt>Google A2A</dt>
									<dd><span className="admin-stat_value">{reachSummary.metrics.a2aHits}</span></dd>
								</div>
								<div className="admin-stat">
									<dt>REST API</dt>
									<dd><span className="admin-stat_value">{reachSummary.metrics.restHits}</span></dd>
								</div>
								<div className="admin-stat">
									<dt>Marketing API</dt>
									<dd><span className="admin-stat_value">{reachSummary.metrics.marketingHits}</span></dd>
								</div>
							</dl>

							<h3 className="admin-subhead">Unique Agents &amp; Clients Reached ({reachSummary.metrics.uniqueAgents.length})</h3>
							{reachSummary.metrics.uniqueAgents.length === 0 ? (
								<p className="admin-muted">No external agents recorded yet.</p>
							) : (
								<div className="agent-stack-pills">
									{reachSummary.metrics.uniqueAgents.map((name) => (
										<span key={name} className="admin-chip is-good">{name}</span>
									))}
								</div>
							)}
						</section>

						<section className="admin-panel">
							<div className="admin-panel_head">
								<h2>Sales Agent Inquiry &amp; MCP Tool Counts</h2>
								<span className="admin-panel_meta">{reachSummary.inquiries.total} total inquiries</span>
							</div>
							<dl className="admin-stats agent-stats-two-by-two">
								<div className="admin-stat">
									<dt>Email Inbox</dt>
									<dd><span className="admin-stat_value">{reachSummary.inquiries.byChannel.email}</span></dd>
								</div>
								<div className="admin-stat">
									<dt>MCP Inquiries</dt>
									<dd><span className="admin-stat_value">{reachSummary.inquiries.byChannel.mcp}</span></dd>
								</div>
								<div className="admin-stat">
									<dt>A2A Inquiries</dt>
									<dd><span className="admin-stat_value">{reachSummary.inquiries.byChannel.a2a}</span></dd>
								</div>
								<div className="admin-stat">
									<dt>Total Msgs</dt>
									<dd><span className="admin-stat_value">{reachSummary.inquiries.totalMessagesExchanged}</span></dd>
								</div>
							</dl>

							<h3 className="admin-subhead">MCP &amp; Agent Tool Invocations</h3>
							{Object.keys(reachSummary.metrics.toolCalls).length === 0 ? (
								<p className="admin-muted">No tool invocations recorded yet.</p>
							) : (
								<ul className="admin-checks">
									{Object.entries(reachSummary.metrics.toolCalls)
										.sort((a, b) => b[1] - a[1])
										.map(([tool, count]) => (
											<li key={tool}>
												<span className="admin-chip is-good">{count}x</span>
												<span><code>{tool}</code></span>
											</li>
										))}
								</ul>
							)}
						</section>
					</div>

					<section className="admin-panel is-wide" aria-label="Agent hit log audit trail">
						<div className="admin-panel_head">
							<h2>MCP &amp; Agent Hit Log Audit Trail</h2>
							<div className="agent-spec-modes">
								{(['all', 'mcp', 'a2a', 'rest', 'marketing'] as const).map((f) => (
									<button
										key={f}
										type="button"
										className={auditFilter === f ? 'admin-btn is-small is-primary' : 'admin-btn is-small is-quiet'}
										onClick={() => setAuditFilter(f)}
									>
										{f.toUpperCase()}
									</button>
								))}
							</div>
						</div>

						{filteredHits.length === 0 ? (
							<div className="admin-empty is-compact">
								<p className="admin-empty_title">No audit hits in this filter yet</p>
								<p className="admin-muted">
									Every request to /api/mcp, /api/agent/a2a, /api/agent/marketing, /api/agent/quote, /api/agent/negotiate, and /api/v1/agent-order is logged here automatically.
								</p>
							</div>
						) : (
							<div className="admin-table_wrap">
								<table className="admin-table">
									<thead>
										<tr>
											<th scope="col">Time</th>
											<th scope="col">Agent / Platform</th>
											<th scope="col">Protocol</th>
											<th scope="col">Action &amp; Endpoint</th>
											<th scope="col">Summary</th>
											<th scope="col" className="is-hide-m">Status / ms</th>
										</tr>
									</thead>
									<tbody>
										{filteredHits.map((hit) => (
											<tr key={hit.id}>
												<td>{formatTs(hit.timestamp)}</td>
												<td>
													<strong>{hit.agent_name}</strong>
													<span className="admin-table_sub">#{hit.client_hash}</span>
												</td>
												<td><span className="admin-chip is-neutral">{hit.protocol.toUpperCase()}</span></td>
												<td>
													<code>{hit.action}</code>
													<span className="admin-table_sub">{hit.method} {hit.endpoint}</span>
												</td>
												<td>{hit.summary}</td>
												<td className="is-hide-m">
													<span className={`admin-chip is-${hit.status_code < 400 ? 'good' : 'warn'}`}>
														{hit.status_code} · {hit.duration_ms}ms
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</section>
				</div>
			)}

			{/* TAB 5: SEO / GEO / AEO MARKETING AGENT */}
			{tab === 'marketing' && (
				<div className="agent-orders-wrap">
					<div className="admin-grid">
						<section className="admin-panel agent-readiness-panel">
							<div className="admin-panel_head">
								<h2>SEO / GEO / AEO Readiness ({seoAudit.score}/100)</h2>
								<form action={runMarketingAuditAction}>
									<SubmitButton className="admin-btn is-small is-quiet" pending="Auditing...">
										<i className="fa-solid fa-rotate" aria-hidden="true"></i> Re-run Audit
									</SubmitButton>
								</form>
							</div>
							<ul className="admin-checks">
								{seoAudit.checks.map((chk) => (
									<li key={chk.id}>
										<span className={`admin-chip is-${chk.passed ? 'good' : 'warn'}`}>{chk.area}</span>
										<span>
											<strong>{chk.label}</strong>
											<span className="admin-muted"> — {chk.detail}</span>
										</span>
									</li>
								))}
							</ul>
							<div className="agent-reply-actions" style={{ gap: '8px', flexWrap: 'wrap' }}>
								<form action={pingIndexNowAction}>
									<SubmitButton className="admin-btn is-small is-primary" pending="Pinging IndexNow...">
										<i className="fa-solid fa-bolt" aria-hidden="true"></i> Ping IndexNow
									</SubmitButton>
								</form>
								<form action={broadcastRegistriesAction}>
									<SubmitButton className="admin-btn is-small is-quiet" pending="Broadcasting...">
										<i className="fa-solid fa-tower-broadcast" aria-hidden="true"></i> Broadcast Networks
									</SubmitButton>
								</form>
							</div>
						</section>

						<div className="agent-column-stack">
							<section className="admin-panel">
								<div className="admin-panel_head">
									<h2>Run SEO / GEO / AEO Marketing Agent</h2>
									<span className="admin-panel_meta">ChatGPT · Claude · Gemini · Google</span>
								</div>
								<form action={runMarketingCampaignAction} className="agent-milestone-form">
									<div className="agent-marketing-fields">
										<div>
											<label htmlFor="mkt-query">Target Search / AI Prompt Query</label>
											<input
												id="mkt-query"
												type="text"
												name="targetQuery"
												value={campaignQuery}
												onChange={(e) => setCampaignQuery(e.target.value)}
												placeholder="e.g. best 7-day Flutter MVP agency for startups"
												required
											/>
										</div>
										<div>
											<label htmlFor="mkt-channel">Primary Target</label>
											<select id="mkt-channel" name="channel" defaultValue="google">
												<option value="google">Google Rank + All AI Search</option>
												<option value="chatgpt">ChatGPT Search (OAI-SearchBot / Bing)</option>
												<option value="claude">Claude Search / Anthropic</option>
												<option value="gemini">Gemini / Google AI Overviews</option>
												<option value="perplexity">Perplexity Answer Engine</option>
												<option value="a2a">Partner A2A Agent Network</option>
											</select>
										</div>
									</div>

									{seoAudit.recommendedQueries.length > 0 && (
										<div className="agent-query-chips">
											{seoAudit.recommendedQueries.map((q) => (
												<button
													key={q}
													type="button"
													className="admin-btn is-small is-quiet"
													onClick={() => setCampaignQuery(q)}
												>
													{q}
												</button>
											))}
										</div>
									)}

									<div className="agent-marketing-checks">
										<label>
											<input type="checkbox" name="autoSaveDraft" defaultChecked /> Generate &amp; save AEO/GEO blog draft in CMS
										</label>
										<label>
											<input type="checkbox" name="pingSearchEngines" defaultChecked /> Ping IndexNow (Bing / ChatGPT)
										</label>
									</div>

									<div className="agent-reply-actions">
										<SubmitButton className="admin-btn is-primary" pending="Running Marketing Agent...">
											<i className="fa-solid fa-robot" aria-hidden="true"></i> Run Marketing Agent
										</SubmitButton>
									</div>
								</form>
							</section>

							<section className="admin-panel">
								<div className="admin-panel_head">
									<h2>Send Marketing Pitch via Email ({mailAddress})</h2>
									<span className="admin-panel_meta">{mailConfigured ? 'SMTP Connected' : 'App Password needed'}</span>
								</div>
								<form action={sendMarketingEmailAction} className="agent-milestone-form">
									<div className="agent-form-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
										<div>
											<label htmlFor="mkt-mail-to">Recipient Email</label>
											<input
												id="mkt-mail-to"
												type="email"
												name="to"
												placeholder="partner@company.com"
												required
											/>
										</div>
										<div>
											<label htmlFor="mkt-mail-channel">Channel Context</label>
											<select id="mkt-mail-channel" name="channel" defaultValue="a2a">
												<option value="a2a">Partner Agent / Procurement</option>
												<option value="chatgpt">ChatGPT / Bing</option>
												<option value="claude">Claude / MCP Ecosystem</option>
												<option value="gemini">Gemini / Google Rank</option>
											</select>
										</div>
									</div>
									<div className="agent-marketing-fields is-spaced" style={{ marginTop: '10px' }}>
										<div>
											<label htmlFor="mkt-mail-query">Pitch Focus Query</label>
											<input
												id="mkt-mail-query"
												type="text"
												name="targetQuery"
												defaultValue={campaignQuery}
											/>
										</div>
									</div>
									<div className="agent-marketing-checks">
										<label>
											<input type="checkbox" name="includeAudit" defaultChecked /> Include Live SEO / GEO / AEO Readiness Report
										</label>
									</div>
									<div className="agent-reply-actions">
										<SubmitButton className="admin-btn is-primary" pending="Sending via Mail SMTP...">
											<i className="fa-solid fa-paper-plane" aria-hidden="true"></i> Send Marketing Email
										</SubmitButton>
									</div>
								</form>
							</section>
						</div>
					</div>

					<section className="admin-panel is-wide">
						<div className="admin-panel_head">
							<h2>Recent Marketing Agent Runs &amp; Inter-Agent Pitches</h2>
							<span className="admin-panel_meta">
								Live external pitch endpoint: <code>GET /api/agent/marketing</code> &amp; MCP <code>get_agency_marketing_brief</code>
							</span>
						</div>

						{marketingRuns.length === 0 ? (
							<p className="admin-muted">Run the Marketing Agent above to generate AEO drafts, FAQ JSON-LD, and partner pitches.</p>
						) : (
							<div className="agent-marketing-runs">
								{marketingRuns.map((run) => (
									<article key={run.id} className="agent-srs-card">
										<div className="agent-thread-top">
											<strong>{run.targetQuery}</strong>
											<span className="admin-chip is-good">{run.kind.toUpperCase()} · {run.channel}</span>
										</div>
										<p className="admin-muted">{formatTs(run.createdAt)} — {run.summary}</p>
										{run.savedPostId && (
											<p className="agent-run-draft-link">
												<Link href={`/admin/blog/${run.savedPostId}`}>Open generated draft in Blog editor →</Link>
											</p>
										)}
										{run.agentPitch && (
											<details className="agent-pitch-details">
												<summary>
													<i className="fa-solid fa-file-lines me-1" aria-hidden="true"></i> View Generated Pitch ({run.agentPitch.length} characters)
												</summary>
												<pre className="agent-code-block agent-pitch-pre">{run.agentPitch}</pre>
											</details>
										)}
									</article>
								))}
							</div>
						)}
					</section>
				</div>
			)}
		</div>
	);
}
