/*
 * Deterministic Pricing Matrix & Guardrail Engine for TechFiyr A2A Commerce.
 * Programmatically enforces floor prices ($600 USD 7-day / $1,500 USD 14-day),
 * 25% / 50% / 25% milestone model, scope boundaries, and supported stacks.
 */
import {
	AGENT_SERVICES,
	DELIVERY_ENGINE_14DAY,
	DELIVERY_ENGINE_7DAY,
	GUARDRAILS,
	SUPPORTED_TECH_MAP,
	UNSUPPORTED_STACK_KEYWORDS,
	type DeliveryPhase,
	type ServiceTierId,
} from './catalog';
import { inspectAgentInteraction } from './security';

export type PaymentRail =
	| 'crypto_usdc_solana'
	| 'crypto_usdc_base'
	| 'crypto_usdt_trc20'
	| 'crypto_usdt_polygon'
	| 'payoneer'
	| 'bank_invoice';

export const VALID_PAYMENT_RAILS: PaymentRail[] = [
	'crypto_usdc_solana',
	'crypto_usdc_base',
	'crypto_usdt_trc20',
	'crypto_usdt_polygon',
	'payoneer',
	'bank_invoice',
];

export type QuoteInput = {
	projectTitle?: string;
	serviceId?: string;
	platform?: 'web' | 'mobile' | 'fullstack' | 'ai' | 'design' | 'enterprise';
	description: string;
	techStack?: string[];
	crudEntities?: number;
	mobileScreens?: number;
	integrationsCount?: number;
	requiresCustomAiTraining?: boolean;
	budgetUSD?: number;
	requestedDays?: number;
	paymentPreference?: PaymentRail;
};

export type PricingLineItem = {
	label: string;
	amountUSD: number;
};

export type MilestoneItem = {
	step: number;
	name: string;
	percent: number;
	amountUSD: number;
	dueDay: number;
	trigger: string;
};

export type QuoteDecision = 'approved' | 'counter_offer' | 'rejected';

export type QuoteEvaluation = {
	decision: QuoteDecision;
	reasonCode:
		| 'APPROVED'
		| 'BELOW_FLOOR_PRICE'
		| 'BUDGET_BELOW_SCOPE_MINIMUM'
		| 'TIMELINE_INFEASIBLE'
		| 'UNSUPPORTED_TECH_STACK'
		| 'INVALID_SPEC';
	reason: string;
	tier: ServiceTierId;
	serviceId: string;
	currency: 'USD';
	floorPriceUSD: number;
	recommendedPriceUSD: number;
	minimumAcceptableUSD: number;
	proposedPriceUSD: number;
	requiredDeliveryDays: number;
	normalizedStack: string[];
	unsupportedStacks: string[];
	scopeMetrics: {
		crudEntities: number;
		mobileScreens: number;
		integrationsCount: number;
		requiresExtendedPipeline: boolean;
		triggers: string[];
	};
	lineItems: PricingLineItem[];
	milestones: MilestoneItem[];
	phases: DeliveryPhase[];
};

const clampInt = (val: unknown, min: number, max: number, fallback: number): number => {
	if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
	return Math.max(min, Math.min(max, Math.round(val)));
};

export function normalizeTechStack(rawStack: string[] = []): {
	supported: string[];
	unsupported: string[];
	unrecognized: string[];
} {
	const supportedSet = new Set<string>();
	const unsupported: string[] = [];
	const unrecognized: string[] = [];

	for (const raw of rawStack) {
		const cleaned = String(raw || '').trim();
		if (!cleaned) continue;
		const lower = cleaned.toLowerCase();

		if (UNSUPPORTED_STACK_KEYWORDS.some((kw) => lower.includes(kw))) {
			unsupported.push(cleaned);
			continue;
		}

		if (SUPPORTED_TECH_MAP[lower]) {
			supportedSet.add(SUPPORTED_TECH_MAP[lower]);
			continue;
		}

		const matchedKey = Object.keys(SUPPORTED_TECH_MAP).find(
			(k) => lower === k || (k.length >= 4 && lower.includes(k)),
		);
		if (matchedKey) {
			supportedSet.add(SUPPORTED_TECH_MAP[matchedKey]);
		} else {
			unrecognized.push(cleaned);
		}
	}

	return {
		supported: Array.from(supportedSet),
		unsupported,
		unrecognized,
	};
}

function inferPlatform(input: QuoteInput, stack: string[]): 'web' | 'mobile' | 'fullstack' | 'ai' | 'design' | 'enterprise' {
	if (input.platform) return input.platform;
	const lower = `${input.projectTitle || ''} ${input.description} ${stack.join(' ')}`.toLowerCase();
	const hasMobile = /\b(flutter|react native|capacitor|ionic|ios|android|mobile app|play store|app store)\b/.test(lower);
	const hasWeb = /\b(next\.?js|react|angular|dashboard|saas|web app|website|laravel|php|spring|java|fastapi|python)\b/.test(lower);
	const hasEnterprise = /\b(erp|hrm|hrms|hr\s+solution|payroll|enterprise|large\s+software|multi-?branch)\b/.test(lower);
	const hasAi = /\b(ai\s*try-?on|virtual\s*try-?on|try-?on|computer\s+vision|rag|vector db|llm training|fine-?tun|ai agent|ai\s+native|embeddings|multi-agent)\b/.test(lower);
	const onlyDesign = /\b(figma|wireframe|prototype|ui\/ux only|design system only)\b/.test(lower) && !hasWeb && !hasMobile && !hasEnterprise;

	if (onlyDesign) return 'design';
	if (hasEnterprise && !hasAi) return 'enterprise';
	if (hasMobile && hasWeb) return 'fullstack';
	if (hasAi) return 'ai';
	if (hasMobile) return 'mobile';
	return 'web';
}

function selectServiceId(platform: ReturnType<typeof inferPlatform>, explicitId?: string): string {
	if (explicitId && AGENT_SERVICES.some((s) => s.id === explicitId)) return explicitId;
	if (platform === 'mobile') return 'mobile-app-cross-platform';
	if (platform === 'ai') return 'ai-tryon-vision-rag';
	if (platform === 'enterprise') return 'erp-hr-enterprise';
	if (platform === 'design') return 'ui-ux-prototyping';
	if (platform === 'fullstack') return 'web-saas-backend';
	return 'rapid-mvp-7day';
}

/** Strict 25% Upfront / 50% MVP Staging / 25% Final Code Handover milestone schedule. */
export function buildMilestones(totalUSD: number, days: number): MilestoneItem[] {
	const upfrontUSD = Math.round(totalUSD * 0.25);
	const stagingUSD = Math.round(totalUSD * 0.5);
	const finalUSD = totalUSD - upfrontUSD - stagingUSD;
	const midDay = days <= 7 ? 4 : Math.round(days * 0.55);

	return [
		{
			step: 1,
			name: '25% Upfront Deposit (Schema + Boilerplate Kickoff)',
			percent: 25,
			amountUSD: upfrontUSD,
			dueDay: 1,
			trigger: 'Order confirmation & Day 1 schema/boilerplate scaffold',
		},
		{
			step: 2,
			name: `50% MVP Staging Delivery (Day ${midDay})`,
			percent: 50,
			amountUSD: stagingUSD,
			dueDay: midDay,
			trigger: 'Live staging MVP URL / preview build deployed & verified',
		},
		{
			step: 3,
			name: `25% Final Code Handover (Day ${days})`,
			percent: 25,
			amountUSD: finalUSD,
			dueDay: days,
			trigger: 'Automated acceptance tests pass & GitHub repository transfer',
		},
	];
}

/**
 * Evaluates a structured or free-text project spec against deterministic pricing
 * and 7-day / 14-day scope guardrails.
 */
export function evaluateProjectSpec(input: QuoteInput): QuoteEvaluation {
	const desc = (input.description || '').trim();
	const title = (input.projectTitle || 'Custom Software Build').trim();
	const security = inspectAgentInteraction(`${title}\n${desc}`);

	if (!security.safe) {
		return {
			decision: 'rejected',
			reasonCode: 'INVALID_SPEC',
			reason: security.refusalMessage || 'Specification rejected by TechFiyr security guardrails.',
			tier: 'rapid_7day',
			serviceId: 'rapid-mvp-7day',
			currency: 'USD',
			floorPriceUSD: GUARDRAILS.minFloorPriceUSD,
			recommendedPriceUSD: GUARDRAILS.minFloorPriceUSD,
			minimumAcceptableUSD: GUARDRAILS.minFloorPriceUSD,
			proposedPriceUSD: GUARDRAILS.minFloorPriceUSD,
			requiredDeliveryDays: GUARDRAILS.standardTurnaroundDays,
			normalizedStack: [],
			unsupportedStacks: [],
			scopeMetrics: {
				crudEntities: 0,
				mobileScreens: 0,
				integrationsCount: 0,
				requiresExtendedPipeline: false,
				triggers: security.reasons,
			},
			lineItems: [],
			milestones: [],
			phases: DELIVERY_ENGINE_7DAY,
		};
	}

	const combinedLower = `${title} ${desc}`.toLowerCase();

	if (desc.length < 12) {
		return {
			decision: 'rejected',
			reasonCode: 'INVALID_SPEC',
			reason: 'Project description must be at least 12 characters with concrete functional requirements.',
			tier: 'rapid_7day',
			serviceId: 'rapid-mvp-7day',
			currency: 'USD',
			floorPriceUSD: GUARDRAILS.minFloorPriceUSD,
			recommendedPriceUSD: GUARDRAILS.minFloorPriceUSD,
			minimumAcceptableUSD: GUARDRAILS.minFloorPriceUSD,
			proposedPriceUSD: GUARDRAILS.minFloorPriceUSD,
			requiredDeliveryDays: GUARDRAILS.standardTurnaroundDays,
			normalizedStack: [],
			unsupportedStacks: [],
			scopeMetrics: {
				crudEntities: 0,
				mobileScreens: 0,
				integrationsCount: 0,
				requiresExtendedPipeline: false,
				triggers: ['Insufficient specification detail'],
			},
			lineItems: [],
			milestones: [],
			phases: DELIVERY_ENGINE_7DAY,
		};
	}

	const stackCheck = normalizeTechStack(input.techStack || []);
	const proseUnsupported = UNSUPPORTED_STACK_KEYWORDS.filter((kw) => combinedLower.includes(kw));
	const allUnsupported = Array.from(new Set([...stackCheck.unsupported, ...proseUnsupported]));

	if (allUnsupported.length > 0) {
		return {
			decision: 'rejected',
			reasonCode: 'UNSUPPORTED_TECH_STACK',
			reason: `Unsupported stack requested (${allUnsupported.join(', ')}). Supported stacks: AI-Native Dev, Java Spring Boot, Python, PHP/Laravel, Next.js/React, Android/iOS, Flutter, React Native, Capacitor, PostgreSQL/Supabase, Docker.`,
			tier: 'extended_14day',
			serviceId: 'web-saas-backend',
			currency: 'USD',
			floorPriceUSD: GUARDRAILS.minFloorPriceUSD,
			recommendedPriceUSD: GUARDRAILS.extendedMinPriceUSD,
			minimumAcceptableUSD: GUARDRAILS.extendedMinPriceUSD,
			proposedPriceUSD: GUARDRAILS.extendedMinPriceUSD,
			requiredDeliveryDays: GUARDRAILS.extendedTurnaroundDays,
			normalizedStack: stackCheck.supported,
			unsupportedStacks: allUnsupported,
			scopeMetrics: {
				crudEntities: clampInt(input.crudEntities, 0, 100, 3),
				mobileScreens: clampInt(input.mobileScreens, 0, 100, 0),
				integrationsCount: clampInt(input.integrationsCount, 0, 50, 1),
				requiresExtendedPipeline: true,
				triggers: [`Unsupported stack: ${allUnsupported.join(', ')}`],
			},
			lineItems: [],
			milestones: [],
			phases: DELIVERY_ENGINE_14DAY,
		};
	}

	const normalizedStack =
		stackCheck.supported.length > 0
			? stackCheck.supported
			: inferPlatform(input, []) === 'mobile'
				? ['Flutter', 'Supabase', 'Docker']
				: inferPlatform(input, []) === 'enterprise'
					? ['Java Spring Boot', 'Next.js', 'PostgreSQL', 'Docker']
					: inferPlatform(input, []) === 'ai'
						? ['Python', 'FastAPI', 'Next.js', 'PostgreSQL', 'Docker']
						: ['Next.js', 'Node.js', 'PostgreSQL', 'Docker'];

	const platform = inferPlatform(input, normalizedStack);
	const serviceId = selectServiceId(platform, input.serviceId);

	const isAiTryOn = /\b(?:ai\s*try-?on|virtual\s*try-?on|try-?on|virtual\s+fitting|garment\s+transfer)\b/.test(combinedLower);
	const isEnterpriseErpHr = /\b(?:erp|hrm|hrms|hr\s+solution|payroll|attendance|large\s+software|multi-?branch|core\s+banking)\b/.test(combinedLower);

	const proseInt = (re: RegExp): number | undefined => {
		const m = re.exec(combinedLower);
		if (!m) return undefined;
		const n = Number.parseInt(m[1], 10);
		return Number.isFinite(n) ? n : undefined;
	};

	const inferredCrud = proseInt(/\b(\d{1,2})\s+(?:crud\s+)?(?:entities|entity|models?|tables?|modules?)\b/);
	const inferredScreens = proseInt(/\b(\d{1,2})\s+(?:core\s+)?(?:mobile\s+|app\s+|ui\s+)?screens?\b/);
	const inferredIntegrations = proseInt(
		/\b(\d{1,2})\s+(?:third-?party\s+)?(?:external\s+)?(?:api|apis|webhook|webhooks|sdk|payment)?\s*integrations?\b/,
	);

	const crudEntities = clampInt(
		input.crudEntities ?? inferredCrud,
		1,
		100,
		platform === 'design' ? 1 : isEnterpriseErpHr ? 8 : 3,
	);
	const mobileScreens = clampInt(
		input.mobileScreens ?? inferredScreens,
		0,
		100,
		platform === 'mobile' || platform === 'fullstack' ? 4 : 0,
	);
	const integrationsCount = clampInt(
		input.integrationsCount ?? inferredIntegrations,
		0,
		50,
		isAiTryOn || isEnterpriseErpHr ? 2 : 1,
	);

	const complexProseSignals: string[] = [];
	if (input.requiresCustomAiTraining || /\b(?:fine-?tun|custom model training|train llm|ml pipeline)\b/.test(combinedLower)) {
		complexProseSignals.push('Custom AI training / ML pipeline');
	}
	if (isAiTryOn) {
		complexProseSignals.push('AI Try-On computer vision & virtual fitting pipeline');
	}
	if (isEnterpriseErpHr) {
		complexProseSignals.push('Enterprise ERP / HR / large software multi-module architecture');
	}
	if (platform === 'fullstack' && mobileScreens > 0) {
		complexProseSignals.push('Combined cross-platform mobile + full-stack web surface');
	}

	const triggers: string[] = [...complexProseSignals];
	if (crudEntities > GUARDRAILS.maxCrudEntities7Day) {
		triggers.push(`${crudEntities} CRUD entities exceeds 7-day limit (${GUARDRAILS.maxCrudEntities7Day})`);
	}
	if (mobileScreens > GUARDRAILS.maxMobileScreens7Day) {
		triggers.push(`${mobileScreens} mobile screens exceeds 7-day limit (${GUARDRAILS.maxMobileScreens7Day})`);
	}
	if (integrationsCount > GUARDRAILS.maxThirdPartyIntegrations7Day) {
		triggers.push(`${integrationsCount} integrations exceeds 7-day limit (${GUARDRAILS.maxThirdPartyIntegrations7Day})`);
	}

	const requiresExtendedPipeline = triggers.length > 0;
	const tier: ServiceTierId = requiresExtendedPipeline ? 'extended_14day' : 'rapid_7day';
	const requiredDeliveryDays = requiresExtendedPipeline
		? GUARDRAILS.extendedTurnaroundDays
		: GUARDRAILS.standardTurnaroundDays;
	const floorPriceUSD = requiresExtendedPipeline
		? GUARDRAILS.extendedMinPriceUSD
		: GUARDRAILS.minFloorPriceUSD;

	const service = AGENT_SERVICES.find((s) => s.id === serviceId) || AGENT_SERVICES[0];
	const baseUSD = Math.max(floorPriceUSD, service.basePriceUSD);
	const lineItems: PricingLineItem[] = [
		{
			label: requiresExtendedPipeline
				? `${service.name} — 14-Day Architecture & Core`
				: `${service.name} — 7-Day Sprint Base`,
			amountUSD: baseUSD,
		},
	];

	if (crudEntities > 3) {
		const extraEntities = crudEntities - 3;
		lineItems.push({
			label: `Additional CRUD data models & APIs (${extraEntities} x $100)`,
			amountUSD: extraEntities * 100,
		});
	}

	if (mobileScreens > 4) {
		const extraScreens = mobileScreens - 4;
		lineItems.push({
			label: `Additional mobile UI screens (${extraScreens} x $125)`,
			amountUSD: extraScreens * 125,
		});
	}

	if (integrationsCount > 1) {
		const extraIntegrations = integrationsCount - 1;
		lineItems.push({
			label: `Third-party API / webhook integrations (${extraIntegrations} x $150)`,
			amountUSD: extraIntegrations * 150,
		});
	}

	if (platform === 'ai' && !requiresExtendedPipeline) {
		lineItems.push({
			label: 'Gemini / LLM structured tool-calling & guardrail module',
			amountUSD: 250,
		});
	}

	if (isAiTryOn) {
		lineItems.push({
			label: 'AI Try-On computer vision & garment/product fitting pipeline',
			amountUSD: 900,
		});
	}

	if (isEnterpriseErpHr && !isAiTryOn) {
		lineItems.push({
			label: 'Enterprise ERP / HR role-based permissions, reporting & audit engine',
			amountUSD: 500,
		});
	}

	const recommendedPriceUSD = Math.max(
		floorPriceUSD,
		lineItems.reduce((sum, item) => sum + item.amountUSD, 0),
	);
	const minimumAcceptableUSD = Math.max(floorPriceUSD, Math.round((recommendedPriceUSD * 0.85) / 25) * 25);

	const budget =
		typeof input.budgetUSD === 'number' && Number.isFinite(input.budgetUSD) ? input.budgetUSD : undefined;
	const requestedDays =
		typeof input.requestedDays === 'number' && Number.isFinite(input.requestedDays)
			? Math.round(input.requestedDays)
			: undefined;

	let decision: QuoteDecision = 'approved';
	let reasonCode: QuoteEvaluation['reasonCode'] = 'APPROVED';
	let reason = `Scope verified within ${requiredDeliveryDays}-day SLA boundaries (25% upfront / 50% staging MVP / 25% final handover).`;
	let proposedPriceUSD = recommendedPriceUSD;

	if (budget !== undefined && budget < GUARDRAILS.minFloorPriceUSD) {
		decision = 'rejected';
		reasonCode = 'BELOW_FLOOR_PRICE';
		reason = `Offered budget ($${budget} USD) is below TechFiyr's strict minimum floor price of $${GUARDRAILS.minFloorPriceUSD} USD.`;
		proposedPriceUSD = minimumAcceptableUSD;
	} else if (budget !== undefined && budget < minimumAcceptableUSD) {
		decision = 'counter_offer';
		reasonCode = 'BUDGET_BELOW_SCOPE_MINIMUM';
		proposedPriceUSD = minimumAcceptableUSD;
		reason = `Offered budget ($${budget} USD) is below the minimum viable price ($${minimumAcceptableUSD} USD) for this ${requiredDeliveryDays}-day scope. Accepting $${minimumAcceptableUSD} USD or reduce entities/integrations to fit a $${Math.max(GUARDRAILS.minFloorPriceUSD, Math.round(budget))} USD 7-day MVP slice.`;
	} else if (requestedDays !== undefined && requestedDays < requiredDeliveryDays) {
		decision = 'counter_offer';
		reasonCode = 'TIMELINE_INFEASIBLE';
		proposedPriceUSD =
			budget !== undefined
				? Math.max(minimumAcceptableUSD, Math.min(recommendedPriceUSD, Math.round(budget)))
				: recommendedPriceUSD;
		reason = `Requested turnaround (${requestedDays} days) cannot accommodate verified QA/staging for this scope. Required SLA is ${requiredDeliveryDays} days (${triggers.length ? triggers.join('; ') : 'minimum 7-day sprint SLA'}).`;
	} else if (budget !== undefined && budget >= minimumAcceptableUSD && budget < recommendedPriceUSD) {
		proposedPriceUSD = Math.round(budget);
		reason = `Client budget ($${proposedPriceUSD} USD) accepted within negotiation band ($${minimumAcceptableUSD}–$${recommendedPriceUSD} USD) for ${requiredDeliveryDays}-day delivery (25% / 50% / 25% milestones).`;
	}

	const phases = requiredDeliveryDays <= 7 ? DELIVERY_ENGINE_7DAY : DELIVERY_ENGINE_14DAY;

	return {
		decision,
		reasonCode,
		reason,
		tier,
		serviceId,
		currency: 'USD',
		floorPriceUSD,
		recommendedPriceUSD,
		minimumAcceptableUSD,
		proposedPriceUSD,
		requiredDeliveryDays,
		normalizedStack,
		unsupportedStacks: [],
		scopeMetrics: {
			crudEntities,
			mobileScreens,
			integrationsCount,
			requiresExtendedPipeline,
			triggers,
		},
		lineItems,
		milestones: buildMilestones(proposedPriceUSD, requiredDeliveryDays),
		phases,
	};
}

/**
 * Hard programmatic check invoked before ANY order or contract is issued,
 * preventing LLM prompt-injection or manual bypass of floor price / SLA limits.
 */
export function enforceOrderGuardrails(params: {
	agreedPriceUSD: number;
	deliveryDays: number;
	description: string;
	techStack?: string[];
	crudEntities?: number;
	mobileScreens?: number;
	integrationsCount?: number;
	requiresCustomAiTraining?: boolean;
}): { ok: true; evaluation: QuoteEvaluation } | { ok: false; code: string; reason: string; evaluation: QuoteEvaluation } {
	const evaluation = evaluateProjectSpec({
		description: params.description,
		techStack: params.techStack,
		crudEntities: params.crudEntities,
		mobileScreens: params.mobileScreens,
		integrationsCount: params.integrationsCount,
		requiresCustomAiTraining: params.requiresCustomAiTraining,
		budgetUSD: params.agreedPriceUSD,
		requestedDays: params.deliveryDays,
	});

	if (evaluation.decision !== 'approved') {
		return {
			ok: false,
			code: evaluation.reasonCode,
			reason: evaluation.reason,
			evaluation,
		};
	}

	if (params.agreedPriceUSD < evaluation.floorPriceUSD) {
		return {
			ok: false,
			code: 'BELOW_FLOOR_PRICE',
			reason: `Programmatic guardrail blocked price $${params.agreedPriceUSD} USD (minimum floor is $${evaluation.floorPriceUSD} USD).`,
			evaluation,
		};
	}

	if (params.deliveryDays < evaluation.requiredDeliveryDays) {
		return {
			ok: false,
			code: 'TIMELINE_INFEASIBLE',
			reason: `Programmatic guardrail blocked ${params.deliveryDays}-day timeline (minimum required SLA is ${evaluation.requiredDeliveryDays} days).`,
			evaluation,
		};
	}

	return { ok: true, evaluation };
}
