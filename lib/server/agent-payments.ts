/*
 * Crypto (Solana SPL USDC, Base EVM USDC, TRC20/Polygon USDT) & Payoneer / Bank
 * payment instruction generator for TechFiyr A2A orders (no Stripe).
 * Implements the 25% Upfront / 50% MVP Staging / 25% Final Handover milestone schedule.
 */
import type { PaymentRail } from '@/lib/agent/pricing';
import { CONTACT } from '@/lib/site';
import type { OrderPaymentState } from './agent-store';
import { env } from './google';

export function resolvePaymentConfig() {
	return {
		solanaUsdcWallet: env('CRYPTO_USDC_SOLANA_ADDRESS') || env('AGENT_ESCROW_SOLANA_ADDRESS'),
		baseUsdcWallet: env('CRYPTO_USDC_BASE_ADDRESS') || env('AGENT_ESCROW_BASE_ADDRESS'),
		trc20UsdtWallet: env('CRYPTO_USDT_TRC20_ADDRESS'),
		polygonUsdtWallet: env('CRYPTO_USDT_POLYGON_ADDRESS'),
		payoneerAccount: env('PAYONEER_RECEIVING_ACCOUNT'),
		bankInvoiceInfo: env('BANK_TRANSFER_DETAILS'),
	};
}

export async function createPaymentForOrder(params: {
	orderId: string;
	projectTitle: string;
	clientEmail: string;
	amountUSD: number;
	deliveryDays: number;
	rail: PaymentRail;
}): Promise<OrderPaymentState> {
	const now = new Date().toISOString();
	const invoiceId = `INV-${params.orderId.replace(/^tf_ord_/, '').toUpperCase()}`;
	const upfrontDepositUSD = Math.round(params.amountUSD * 0.25);
	const stagingMilestoneUSD = Math.round(params.amountUSD * 0.5);
	const finalHandoverUSD = params.amountUSD - upfrontDepositUSD - stagingMilestoneUSD;

	const cfg = resolvePaymentConfig();
	const scheduleSummary = `25% Upfront ($${upfrontDepositUSD}), 50% Staging MVP ($${stagingMilestoneUSD}), 25% Final Handover ($${finalHandoverUSD})`;

	if (params.rail === 'crypto_usdc_solana') {
		const address = cfg.solanaUsdcWallet;
		return {
			rail: 'crypto_usdc_solana',
			status: 'awaiting_upfront_25',
			amountUSD: params.amountUSD,
			upfrontDepositUSD,
			stagingMilestoneUSD,
			finalHandoverUSD,
			currency: 'USDC',
			invoiceId,
			crypto_chain: 'Solana (SPL)',
			wallet_address: address || undefined,
			binance_p2p_ready: true,
			instructions: address
				? `Send $${upfrontDepositUSD} USDC (25% deposit of $${params.amountUSD}) on Solana (SPL) to ${address} with memo ${params.orderId}. Milestones: ${scheduleSummary}.`
				: `Solana (SPL) USDC invoice ${invoiceId} created (${scheduleSummary}). Reply with transaction confirmation or request wallet address from ${env('ZOHO_EMAIL') || CONTACT.email}.`,
			updatedAt: now,
		};
	}

	if (params.rail === 'crypto_usdc_base') {
		const address = cfg.baseUsdcWallet;
		return {
			rail: 'crypto_usdc_base',
			status: 'awaiting_upfront_25',
			amountUSD: params.amountUSD,
			upfrontDepositUSD,
			stagingMilestoneUSD,
			finalHandoverUSD,
			currency: 'USDC',
			invoiceId,
			crypto_chain: 'Base (EVM)',
			wallet_address: address || undefined,
			binance_p2p_ready: true,
			instructions: address
				? `Send $${upfrontDepositUSD} USDC (25% deposit of $${params.amountUSD}) on Base (EVM) to ${address} and reply with tx hash for ${params.orderId}. Milestones: ${scheduleSummary}.`
				: `Base (EVM) USDC invoice ${invoiceId} created (${scheduleSummary}). Reply to ${env('ZOHO_EMAIL') || CONTACT.email} for receiving wallet confirmation.`,
			updatedAt: now,
		};
	}

	if (params.rail === 'crypto_usdt_trc20') {
		const address = cfg.trc20UsdtWallet;
		return {
			rail: 'crypto_usdt_trc20',
			status: 'awaiting_upfront_25',
			amountUSD: params.amountUSD,
			upfrontDepositUSD,
			stagingMilestoneUSD,
			finalHandoverUSD,
			currency: 'USDT',
			invoiceId,
			crypto_chain: 'TRON (TRC20)',
			wallet_address: address || undefined,
			binance_p2p_ready: true,
			instructions: address
				? `Send $${upfrontDepositUSD} USDT (TRC20, Binance P2P offramp ready) to ${address} and share tx hash for ${params.orderId}. Milestones: ${scheduleSummary}.`
				: `USDT (TRC20) invoice ${invoiceId} created (${scheduleSummary}). Binance P2P ready; confirm receiving address via ${env('ZOHO_EMAIL') || CONTACT.email}.`,
			updatedAt: now,
		};
	}

	if (params.rail === 'crypto_usdt_polygon') {
		const address = cfg.polygonUsdtWallet;
		return {
			rail: 'crypto_usdt_polygon',
			status: 'awaiting_upfront_25',
			amountUSD: params.amountUSD,
			upfrontDepositUSD,
			stagingMilestoneUSD,
			finalHandoverUSD,
			currency: 'USDT',
			invoiceId,
			crypto_chain: 'Polygon (PoS)',
			wallet_address: address || undefined,
			binance_p2p_ready: true,
			instructions: address
				? `Send $${upfrontDepositUSD} USDT (Polygon, Binance P2P ready) to ${address} and share tx hash for ${params.orderId}. Milestones: ${scheduleSummary}.`
				: `USDT (Polygon) invoice ${invoiceId} created (${scheduleSummary}). Confirm receiving address via ${env('ZOHO_EMAIL') || CONTACT.email}.`,
			updatedAt: now,
		};
	}

	if (params.rail === 'payoneer') {
		const payoneer = cfg.payoneerAccount;
		return {
			rail: 'payoneer',
			status: 'awaiting_upfront_25',
			amountUSD: params.amountUSD,
			upfrontDepositUSD,
			stagingMilestoneUSD,
			finalHandoverUSD,
			currency: 'USD',
			invoiceId,
			crypto_chain: 'Payoneer USD Virtual Account',
			payoneer_account: payoneer || undefined,
			instructions: payoneer
				? `Pay $${upfrontDepositUSD} USD (25% upfront deposit) to Payoneer Virtual Receiving Account (${payoneer}) referencing ${invoiceId}. Milestones: ${scheduleSummary}.`
				: `Payoneer USD invoice ${invoiceId} issued (${scheduleSummary}). Payoneer virtual account payment request sent from ${env('ZOHO_EMAIL') || CONTACT.email}.`,
			updatedAt: now,
		};
	}

	return {
		rail: 'bank_invoice',
		status: 'awaiting_upfront_25',
		amountUSD: params.amountUSD,
		upfrontDepositUSD,
		stagingMilestoneUSD,
		finalHandoverUSD,
		currency: 'USD',
		invoiceId,
		crypto_chain: 'International Wire / Invoice',
		instructions: cfg.bankInvoiceInfo
			? `Remit $${upfrontDepositUSD} USD (25% deposit) per invoice ${invoiceId}: ${cfg.bankInvoiceInfo}. Milestones: ${scheduleSummary}.`
			: `Manual Bank Transfer Invoice ${invoiceId} issued for $${params.amountUSD} USD (${scheduleSummary}). Wire/ACH coordinates provided via ${env('ZOHO_EMAIL') || CONTACT.email}.`,
		updatedAt: now,
	};
}

/** Builds formatted multi-rail payment instructions included in closed-deal proposals & emails. */
export function formatPaymentInstructionsBlock(orderId: string, totalUSD: number, upfrontUSD: number): string {
	const cfg = resolvePaymentConfig();
	const lines = [
		`Milestone Schedule (Total: $${totalUSD} USD):`,
		`- 25% Upfront Deposit (Due Day 1): $${upfrontUSD} USD`,
		`- 50% Staging MVP Delivery (Due Day 4): $${Math.round(totalUSD * 0.5)} USD`,
		`- 25% Final Code Handover (Due Day 7): $${totalUSD - upfrontUSD - Math.round(totalUSD * 0.5)} USD`,
		'',
		'Accepted Payment Channels:',
		`- USDC (Solana SPL): ${cfg.solanaUsdcWallet || 'Configured on invoice / reply to request wallet address'}`,
		`- USDC (Base EVM): ${cfg.baseUsdcWallet || 'Configured on invoice / reply to request wallet address'}`,
		`- USDT (TRC20 / Polygon — Binance P2P ready): ${cfg.trc20UsdtWallet || cfg.polygonUsdtWallet || 'Available on request'}`,
		`- Payoneer Virtual Receiving Account / Bank Wire: ${cfg.payoneerAccount || 'Reply with preferred billing entity for Payoneer USD request'}`,
		`Reference ID: ${orderId}`,
	];
	return lines.join('\n');
}
