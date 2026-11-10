/*
 * Persistence and access-control helpers for the TechFiyr A2A agent layer (server only).
 * Stores quotes, orders, negotiation sessions, and A2A tasks through lib/server/store.ts
 * (Cloud Firestore in production, .data/ JSON files locally).
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { DeliveryPhase } from '@/lib/agent/catalog';
import type { MilestoneItem, PaymentRail, QuoteEvaluation, QuoteInput } from '@/lib/agent/pricing';
import { env } from './google';
import { store, storeMode } from './store';

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
	status: 'pending_payment' | 'awaiting_payment_rails' | 'escrow_locked' | 'paid' | 'released';
	amountUSD: number;
	currency: 'USD' | 'USDC';
	invoiceId: string;
	checkoutUrl?: string;
	stripeSessionId?: string;
	escrow?: {
		network: string;
		token: string;
		address: string;
		memo: string;
		releaseCondition: string;
	};
	instructions: string;
	updatedAt: string;
};

export type AgentOrderRecord = {
	id: string;
	orderTokenHash: string;
	quoteId?: string;
	clientAgentId: string;
	clientDid?: string;
	clientEmail: string;
	callbackUrl?: string;
	projectTitle: string;
	scopeSummary: string;
	techStack: string[];
	agreedPriceUSD: number;
	deliveryDays: number;
	tier: 'rapid_7day' | 'extended_14day';
	milestones: MilestoneItem[];
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
		whatsappSent: boolean;
		webhookSent: boolean;
		detail?: string;
	};
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

const COLLECTIONS = {
	quotes: 'agent_quotes',
	orders: 'agent_orders',
	sessions: 'agent_sessions',
	tasks: 'agent_tasks',
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
	return (req.headers.get('x-order-token') || req.headers.get('x-agent-key') || '').trim();
}

/** Pipeline / operator key check (used for listing all orders or advancing delivery phases). */
export function isOperatorAuthorized(req: Request): boolean {
	const operatorKey = env('AGENT_API_KEY') || env('CRON_SECRET');
	if (!operatorKey || operatorKey.length < 16) return false;
	const token = extractBearer(req);
	return Boolean(token && safeEqual(token, operatorKey));
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
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

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

/** Strips sensitive internal hashes before returning order state to an authorized caller. */
export function publicOrderView(order: AgentOrderRecord) {
	const { orderTokenHash: _drop, ...safe } = order;
	return safe;
}

