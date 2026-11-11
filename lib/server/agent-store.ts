/*
 * Persistence and access-control helpers for the TechFiyr A2A agent layer (server only).
 * Stores Inquiries, Orders (with AI-Developer-Ready SRS Markdown & JSON), Quotes,
 * Negotiation Sessions, and A2A Tasks through lib/server/store.ts (Firestore / .data/).
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { DeliveryPhase } from '@/lib/agent/catalog';
import type { MilestoneItem, PaymentRail, QuoteEvaluation, QuoteInput } from '@/lib/agent/pricing';
import type { AiDeveloperSrs } from '@/types/srs';
import { env } from './google';
import { store, storeMode } from './store';

export type InquiryStatus = 'PENDING' | 'NEGOTIATING' | 'CLOSED' | 'REJECTED';

export type InquiryMessage = {
	timestamp: string;
	role: 'client' | 'sales_agent';
	text: string;
	messageId?: string;
};

export type InquiryRecord = {
	id: string;
	sender_email: string;
	sender_name?: string;
	subject: string;
	thread_id: string;
	status: InquiryStatus;
	channel: 'gmail' | 'zoho_email' | 'email' | 'a2a' | 'mcp';
	messages: InquiryMessage[];
	order_id?: string;
	created_at: string;
	updated_at: string;
};

export type MilestoneStatus = 'AWAITING_DEPOSIT' | 'UPFRONT_PAID' | 'MVP_DELIVERED' | 'FULLY_PAID';

export type AgentQuoteRecord = {
	id: string;
	createdAt: string;
	expiresAt: string;
	clientAgentId: string;
	clientDid?: string;
	clientEmail?: string;
	input: QuoteInput;
	evaluation: QuoteEvaluation;
	status: 'quoted' | 'countered' | 'rejected' | 'converted';
	orderId?: string;
};

export type OrderPhaseState = DeliveryPhase & {
	status: 'pending' | 'in_progress' | 'completed';
	updatedAt?: string;
	artifactUrl?: string;
};

export type OrderPaymentState = {
	rail: PaymentRail;
	status: 'awaiting_upfront_25' | 'upfront_25_paid' | 'staging_50_paid' | 'fully_paid';
	amountUSD: number;
	upfrontDepositUSD: number;
	stagingMilestoneUSD: number;
	finalHandoverUSD: number;
	currency: 'USD' | 'USDC' | 'USDT';
	invoiceId: string;
	crypto_chain?: string;
	wallet_address?: string;
	crypto_tx_hash?: string;
	payoneer_account?: string;
	payoneer_reference?: string;
	binance_p2p_ready?: boolean;
	instructions: string;
	updatedAt: string;
};

export type AgentOrderRecord = {
	id: string;
	orderTokenHash: string;
	inquiry_id?: string;
	quoteId?: string;
	clientAgentId: string;
	clientDid?: string;
	client_contact: string;
	clientEmail: string;
	callbackUrl?: string;
	projectTitle: string;
	executive_overview: string;
	scopeSummary: string;
	techStack: string[];
	total_price_usd: number;
	agreedPriceUSD: number;
	timeline_days: number;
	deliveryDays: number;
	tier: 'rapid_7day' | 'extended_14day';
	milestone_status: MilestoneStatus;
	milestones: MilestoneItem[];
	crypto_chain: string;
	crypto_tx_hash: string;
	payoneer_reference: string;
	srs_markdown: string;
	srs_json: AiDeveloperSrs;
	sow: {
		sowId: string;
		issuedAt: string;
		provider: 'TechFiyr';
		clientEmail: string;
		clientAgentId: string;
		deliverables: string[];
		acceptanceCriteria: string[];
		guardrailsVerified: boolean;
	};
	currentPhase: string;
	phases: OrderPhaseState[];
	payment: OrderPaymentState;
	deliverables: {
		repoUrl?: string;
		stagingUrl?: string;
		deliveryReportUrl?: string;
	};
	notifications: {
		emailAlertSent: boolean;
		webhookSent: boolean;
		detail?: string;
	};
	created_at: string;
	createdAt: string;
	updatedAt: string;
};

export type NegotiationTurn = {
	role: 'buyer_agent' | 'sales_agent';
	content: string;
	timestamp: string;
	decision?: string;
};

export type NegotiationSessionRecord = {
	id: string;
	inquiryId?: string;
	createdAt: string;
	updatedAt: string;
	clientAgentId: string;
	clientEmail?: string;
	turns: NegotiationTurn[];
	latestEvaluation?: QuoteEvaluation;
	status: 'open' | 'deal_closed' | 'rejected';
	orderId?: string;
};

export type A2ATaskRecord = {
	id: string;
	contextId: string;
	status: {
		state: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
		timestamp: string;
		message?: {
			role: 'agent';
			parts: { kind: 'text' | 'data'; text?: string; data?: Record<string, unknown> }[];
		};
	};
	history: unknown[];
	artifacts?: unknown[];
	metadata?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
};

export type EmailSyncRun = {
	ranAt: string;
	ok: boolean;
	checked: number;
	processed: number;
	replied: number;
	closedDeals: number;
	errors: string[];
};

export type AgentProtocol = 'mcp' | 'a2a' | 'rest' | 'marketing';

export type AgentAuditHit = {
	id: string;
	timestamp: string;
	protocol: AgentProtocol;
	method: string;
	endpoint: string;
	action: string;
	agent_name: string;
	user_agent: string;
	client_hash: string;
	status_code: number;
	duration_ms: number;
	summary: string;
	inquiry_id?: string;
	order_id?: string;
};

export type AgentReachMetrics = {
	totalHits: number;
	mcpHits: number;
	a2aHits: number;
	restHits: number;
	marketingHits: number;
	toolCalls: Record<string, number>;
	uniqueAgents: string[];
	lastHitAt: string;
};

export type MarketingRunRecord = {
	id: string;
	createdAt: string;
	kind: 'audit' | 'campaign' | 'agent_pitch' | 'indexnow' | 'registry_broadcast';
	targetQuery: string;
	channel: string;
	score?: number;
	savedPostId?: string;
	savedPostSlug?: string;
	indexNowPinged?: boolean;
	summary: string;
	seoTitle?: string;
	seoDescription?: string;
	llmsSnippet?: string;
	faqJsonLd?: Record<string, unknown>;
	agentPitch?: string;
};

const COLLECTIONS = {
	inquiries: 'agent_inquiries',
	quotes: 'agent_quotes',
	orders: 'agent_orders',
	sessions: 'agent_sessions',
	tasks: 'agent_tasks',
	audit: 'agent_audit_logs',
	marketing: 'agent_marketing_runs',
	meta: 'meta',
} as const;

export function canPersistAgentStore(): boolean {
	return storeMode() !== 'none';
}

export function generateId(prefix: string): string {
	return `${prefix}_${randomBytes(9).toString('hex')}`;
}

export function generateOrderToken(): { rawToken: string; tokenHash: string } {
	const rawToken = `tfa_${randomBytes(24).toString('base64url')}`;
	return { rawToken, tokenHash: hashSecret(rawToken) };
}

export function hashSecret(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
	if (!a || !b) return false;
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function extractBearer(req: Request): string {
	const auth = req.headers.get('authorization') || '';
	if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
	return (
		req.headers.get('x-order-token') ||
		req.headers.get('x-agent-key') ||
		req.headers.get('x-marketing-key') ||
		''
	).trim();
}

export function isOperatorAuthorized(req: Request): boolean {
	const operatorKey = env('AGENT_SALES_API_KEY') || env('CRON_SECRET');
	if (!operatorKey || operatorKey.length < 16) return false;
	const token = extractBearer(req);
	return Boolean(token && safeEqual(token, operatorKey));
}

export function isMarketingAuthorized(req: Request): boolean {
	const marketingKey = env('AGENT_MARKETING_API_KEY') || env('CRON_SECRET');
	if (!marketingKey || marketingKey.length < 16) return false;
	const token = extractBearer(req);
	return Boolean(token && safeEqual(token, marketingKey));
}

export function isOrderAuthorized(req: Request, order: AgentOrderRecord, explicitToken?: string): boolean {
	if (isOperatorAuthorized(req)) return true;
	const urlToken = new URL(req.url).searchParams.get('token') || '';
	const candidate = (explicitToken || extractBearer(req) || urlToken).trim();
	if (!candidate || !order.orderTokenHash) return false;
	return safeEqual(hashSecret(candidate), order.orderTokenHash);
}

function cleanDoc<T>(data: T): Record<string, unknown> {
	return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

// ---------- Inquiries ----------
export async function saveInquiry(inquiry: InquiryRecord): Promise<boolean> {
	if (!canPersistAgentStore()) return false;
	await store.put(COLLECTIONS.inquiries, inquiry.id, cleanDoc(inquiry));
	return true;
}

export async function getInquiry(id: string): Promise<InquiryRecord | null> {
	if (!canPersistAgentStore() || !id) return null;
	const doc = await store.get(COLLECTIONS.inquiries, id);
	return doc ? (doc as unknown as InquiryRecord) : null;
}

export async function listInquiries(): Promise<InquiryRecord[]> {
	if (!canPersistAgentStore()) return [];
	const docs = await store.list(COLLECTIONS.inquiries);
	return docs
		.map((d) => d as unknown as InquiryRecord)
		.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export async function findInquiryByThread(threadIds: string[], senderEmail: string): Promise<InquiryRecord | null> {
	const all = await listInquiries();
	const cleanSender = senderEmail.trim().toLowerCase();
	const idSet = new Set(threadIds.map((t) => t.trim()).filter(Boolean));

	for (const inq of all) {
		if (idSet.has(inq.thread_id)) return inq;
		if (inq.messages.some((m) => m.messageId && idSet.has(m.messageId))) return inq;
	}
	return all.find((inq) => inq.sender_email.toLowerCase() === cleanSender && inq.status !== 'CLOSED' && inq.status !== 'REJECTED') || null;
}

// ---------- Quotes ----------
export async function saveQuote(quote: AgentQuoteRecord): Promise<boolean> {
	if (!canPersistAgentStore()) return false;
	await store.put(COLLECTIONS.quotes, quote.id, cleanDoc(quote));
	return true;
}

export async function getQuote(id: string): Promise<AgentQuoteRecord | null> {
	if (!canPersistAgentStore() || !id) return null;
	const doc = await store.get(COLLECTIONS.quotes, id);
	return doc ? (doc as unknown as AgentQuoteRecord) : null;
}

// ---------- Orders ----------
export async function saveOrder(order: AgentOrderRecord): Promise<void> {
	await store.put(COLLECTIONS.orders, order.id, cleanDoc(order));
}

export async function getOrder(id: string): Promise<AgentOrderRecord | null> {
	if (!canPersistAgentStore() || !id) return null;
	const doc = await store.get(COLLECTIONS.orders, id);
	return doc ? (doc as unknown as AgentOrderRecord) : null;
}

export async function listOrders(): Promise<AgentOrderRecord[]> {
	if (!canPersistAgentStore()) return [];
	const docs = await store.list(COLLECTIONS.orders);
	return docs
		.map((d) => d as unknown as AgentOrderRecord)
		.sort((a, b) => ((a.created_at || a.createdAt) < (b.created_at || b.createdAt) ? 1 : -1));
}

// ---------- Sessions & Tasks ----------
export async function saveSession(session: NegotiationSessionRecord): Promise<boolean> {
	if (!canPersistAgentStore()) return false;
	await store.put(COLLECTIONS.sessions, session.id, cleanDoc(session));
	return true;
}

export async function getSession(id: string): Promise<NegotiationSessionRecord | null> {
	if (!canPersistAgentStore() || !id) return null;
	const doc = await store.get(COLLECTIONS.sessions, id);
	return doc ? (doc as unknown as NegotiationSessionRecord) : null;
}

export async function saveA2ATask(task: A2ATaskRecord): Promise<boolean> {
	if (!canPersistAgentStore()) return false;
	await store.put(COLLECTIONS.tasks, task.id, cleanDoc(task));
	return true;
}

export async function getA2ATask(id: string): Promise<A2ATaskRecord | null> {
	if (!canPersistAgentStore() || !id) return null;
	const doc = await store.get(COLLECTIONS.tasks, id);
	return doc ? (doc as unknown as A2ATaskRecord) : null;
}

export async function saveEmailSyncRun(run: EmailSyncRun): Promise<void> {
	if (!canPersistAgentStore()) return;
	await store.put(COLLECTIONS.meta, 'email-sync', cleanDoc(run));
}

export async function lastEmailSyncRun(): Promise<EmailSyncRun | null> {
	if (!canPersistAgentStore()) return null;
	const doc = await store.get(COLLECTIONS.meta, 'email-sync');
	return doc ? (doc as unknown as EmailSyncRun) : null;
}

// ---------- Agent Hit Audit Trail & Reach Metrics ----------
export async function saveAuditHit(hit: AgentAuditHit): Promise<void> {
	if (!canPersistAgentStore()) return;
	await store.put(COLLECTIONS.audit, hit.id, cleanDoc(hit));
}

export async function listAuditHits(limit = 100): Promise<AgentAuditHit[]> {
	if (!canPersistAgentStore()) return [];
	const docs = await store.list(COLLECTIONS.audit);
	return docs
		.map((d) => d as unknown as AgentAuditHit)
		.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
		.slice(0, limit);
}

export async function getAgentMetrics(): Promise<AgentReachMetrics> {
	const empty: AgentReachMetrics = {
		totalHits: 0,
		mcpHits: 0,
		a2aHits: 0,
		restHits: 0,
		marketingHits: 0,
		toolCalls: {},
		uniqueAgents: [],
		lastHitAt: '',
	};
	if (!canPersistAgentStore()) return empty;
	const doc = await store.get(COLLECTIONS.meta, 'agent-metrics');
	if (!doc) return empty;
	const raw = doc as Partial<AgentReachMetrics>;
	return {
		totalHits: Number(raw.totalHits || 0),
		mcpHits: Number(raw.mcpHits || 0),
		a2aHits: Number(raw.a2aHits || 0),
		restHits: Number(raw.restHits || 0),
		marketingHits: Number(raw.marketingHits || 0),
		toolCalls: typeof raw.toolCalls === 'object' && raw.toolCalls !== null ? (raw.toolCalls as Record<string, number>) : {},
		uniqueAgents: Array.isArray(raw.uniqueAgents) ? raw.uniqueAgents.filter((x): x is string => typeof x === 'string') : [],
		lastHitAt: typeof raw.lastHitAt === 'string' ? raw.lastHitAt : '',
	};
}

export async function saveAgentMetrics(metrics: AgentReachMetrics): Promise<void> {
	if (!canPersistAgentStore()) return;
	await store.put(COLLECTIONS.meta, 'agent-metrics', cleanDoc(metrics));
}

// ---------- SEO / GEO / AEO Marketing Runs ----------
export async function saveMarketingRun(run: MarketingRunRecord): Promise<void> {
	if (!canPersistAgentStore()) return;
	await store.put(COLLECTIONS.marketing, run.id, cleanDoc(run));
}

export async function listMarketingRuns(limit = 30): Promise<MarketingRunRecord[]> {
	if (!canPersistAgentStore()) return [];
	const docs = await store.list(COLLECTIONS.marketing);
	return docs
		.map((d) => d as unknown as MarketingRunRecord)
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
		.slice(0, limit);
}

/** Strips sensitive internal hashes before returning order state to an authorized caller. */
export function publicOrderView(order: AgentOrderRecord) {
	const { orderTokenHash: _drop, ...safe } = order;
	return safe;
}
