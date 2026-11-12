/*
 * Canonical TechFiyr Agent-to-Agent (A2A) Commerce catalog, pricing guardrails,
 * supported tech stacks, accepted Crypto/Payoneer payment rails, and 7-day delivery phases.
 * Company facts and team roster stay synced with lib/site.ts and lib/content.ts.
 */
import { AUTHORS } from '@/lib/content';
import { CONTACT, SITE_NAME, SITE_URL } from '@/lib/site';

export const AGENT_PROTOCOL_VERSION = '1.0.0';
export const MCP_PROTOCOL_VERSION = '2025-03-26';
export const SALES_AGENT_EMAIL = 'techfiyr.dev@gmail.com';
export const MEETING_BOOKING_URL = `${SITE_URL}/contact#contact`;

export const GUARDRAILS = {
	currency: 'USD',
	minFloorPriceUSD: 600,
	extendedMinPriceUSD: 1500,
	standardTurnaroundDays: 7,
	extendedTurnaroundDays: 14,
	maxCrudEntities7Day: 5,
	maxMobileScreens7Day: 4,
	maxThirdPartyIntegrations7Day: 3,
	quoteValidityHours: 168,
	milestoneSchedule: {
		upfrontDepositPercent: 25,
		mvpStagingPercent: 50,
		finalHandoverPercent: 25,
	},
} as const;

export type ServiceTierId = 'rapid_7day' | 'extended_14day';

export type AgentServiceOffering = {
	id: string;
	name: string;
	category: 'prototyping' | 'mobile' | 'web_saas' | 'ai_systems' | 'enterprise_erp' | 'ui_ux' | 'partnership';
	summary: string;
	defaultTier: ServiceTierId;
	basePriceUSD: number;
	deliveryDays: number;
	supportedStacks: string[];
	scopeLimits7Day: string[];
	deliverables: string[];
};

export const AGENT_SERVICES: AgentServiceOffering[] = [
	{
		id: 'rapid-mvp-7day',
		name: 'Autonomous & Rapid App Prototyping (7-Day MVP Engine)',
		category: 'prototyping',
		summary:
			'Full-cycle MVP execution by AI-native software developers: database schema, backend APIs, modular web frontend, Docker containerization, and automated tests shipped in 7 days.',
		defaultTier: 'rapid_7day',
		basePriceUSD: 600,
		deliveryDays: 7,
		supportedStacks: ['Next.js', 'React', 'Node.js', 'Java Spring Boot', 'Python', 'PHP / Laravel', 'PostgreSQL', 'Supabase', 'Docker'],
		scopeLimits7Day: [
			'Up to 5 CRUD entities',
			'Standard auth + role-based access',
			'Up to 3 third-party API/webhook integrations',
		],
		deliverables: [
			'Day 1: Schema + modular monorepo boilerplate (25% deposit)',
			'Day 4: Staging MVP deployment + core workflows (50% milestone)',
			'Day 7: Automated QA, Docker build & GitHub repository handover (25% final)',
		],
	},
	{
		id: 'mobile-app-cross-platform',
		name: 'Mobile App Development (Android, iOS, Flutter, React Native & Capacitor)',
		category: 'mobile',
		summary:
			'Native Android (Kotlin) & iOS (Swift) or cross-platform Flutter, React Native, and Ionic Capacitor mobile apps with Firebase/Supabase/REST APIs and Codemagic CI/CD store pipelines.',
		defaultTier: 'rapid_7day',
		basePriceUSD: 900,
		deliveryDays: 7,
		supportedStacks: ['Android (Kotlin)', 'iOS (Swift)', 'Flutter', 'React Native', 'Ionic Capacitor', 'Firebase', 'Supabase', 'Node.js', 'Codemagic CI/CD'],
		scopeLimits7Day: [
			'Up to 4 core mobile screens for 7-day MVP',
			'Firebase/Supabase or single REST API backend',
			'Up to 3 third-party SDK/API integrations',
		],
		deliverables: [
			'Native or unified Flutter / React Native / Capacitor codebase',
			'Signed Android APK/AAB & iOS TestFlight-ready build config',
			'Codemagic / GitHub Actions CI/CD workflow',
		],
	},
	{
		id: 'web-saas-backend',
		name: 'Web Development, SaaS & Enterprise Backend (Java Spring, Python, PHP Laravel)',
		category: 'web_saas',
		summary:
			'Scalable web platforms, multi-tenant SaaS products, and enterprise REST/GraphQL APIs engineered with Java Spring Boot, Python (FastAPI/Django), PHP Laravel, Next.js, React, and Node.js.',
		defaultTier: 'rapid_7day',
		basePriceUSD: 750,
		deliveryDays: 7,
		supportedStacks: ['Java Spring Boot', 'Python', 'FastAPI', 'PHP / Laravel', 'Next.js', 'React', 'Angular', 'Node.js', 'PostgreSQL', 'MySQL', 'Docker', 'AWS'],
		scopeLimits7Day: [
			'Up to 5 CRUD entities and authentication',
			'Admin or client dashboard UI',
			'Up to 3 external API/payment integrations',
		],
		deliverables: [
			'Modular Java Spring / Python / PHP Laravel / TypeScript codebase',
			'OpenAPI / REST documentation & database migrations',
			'Docker compose & cloud staging deployment',
		],
	},
	{
		id: 'erp-hr-enterprise',
		name: 'ERP, HR / Payroll Solutions & Large Software Development',
		category: 'enterprise_erp',
		summary:
			'Custom enterprise resource planning (ERP), HRM/HR payroll, attendance, inventory, accounting, and multi-department large software platforms built on Java Spring Boot, Laravel, Python, PostgreSQL, and Docker.',
		defaultTier: 'extended_14day',
		basePriceUSD: 1500,
		deliveryDays: 14,
		supportedStacks: ['Java Spring Boot', 'PHP / Laravel', 'Python', 'Next.js', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'AWS'],
		scopeLimits7Day: [
			'Single ERP/HR sub-module prototype fits 7-day sprint ($900+)',
			'Full multi-module ERP, HR/payroll, or large enterprise platform scoped across 14+ day milestones ($1,500+)',
		],
		deliverables: [
			'Role-based multi-tenant ERP / HR architecture & relational DB schema',
			'Staging deployment with audit trails, reporting, and API integrations',
			'Automated QA, Docker deployment & full GitHub repository handover',
		],
	},
	{
		id: 'ai-tryon-vision-rag',
		name: 'AI Try-On Solutions, Computer Vision & Production AI/RAG Agents',
		category: 'ai_systems',
		summary:
			'Virtual AI Try-On solutions for fashion/eyewear/e-commerce, computer vision inference pipelines, custom RAG vector search, and autonomous MCP/A2A agent systems.',
		defaultTier: 'extended_14day',
		basePriceUSD: 1500,
		deliveryDays: 14,
		supportedStacks: ['Python', 'FastAPI', 'AI Try-On / Computer Vision', 'Next.js', 'Flutter', 'Capacitor', 'Gemini API', 'Vector DB', 'MCP', 'Docker'],
		scopeLimits7Day: [
			'Single-endpoint MCP/A2A or prompt pipeline fits 7 days ($850+)',
			'AI Try-On virtual fitting, image generation, or custom RAG pipelines require 14+ days ($1,500–$2,400+)',
		],
		deliverables: [
			'AI Try-On / Computer Vision inference API & web/mobile embed',
			'Guardrailed prompt/RAG evaluation harness & MCP/A2A tools',
			'Containerized staging URL & GitHub source transfer',
		],
	},
	{
		id: 'startup-technical-partner',
		name: 'AI-Native Software Developers, Startup Technical Partner & Consulting',
		category: 'partnership',
		summary:
			'Dedicated AI-native software engineers, technical co-pilot / CTO architecture advisory for startups, and white-label B2B agency development partnerships.',
		defaultTier: 'rapid_7day',
		basePriceUSD: 900,
		deliveryDays: 7,
		supportedStacks: ['AI-Native Development', 'Java Spring Boot', 'Python', 'PHP / Laravel', 'Next.js', 'Flutter', 'React Native', 'Ionic Capacitor', 'Android (Kotlin)', 'iOS (Swift)'],
		scopeLimits7Day: [
			'Technical architecture audit & prototype sprint in 7 days',
			'Ongoing dedicated engineering or partner retainers scoped with founders via https://techfiyr.com/contact#contact',
		],
		deliverables: [
			'Dedicated senior AI-native engineering capacity or CTO consulting',
			'Architecture blueprint, sprint roadmap & CI/CD delivery',
			'Direct founder/lead developer sync via https://techfiyr.com/contact#contact',
		],
	},
	{
		id: 'ui-ux-prototyping',
		name: 'UI/UX Design Systems & Clickable Prototyping',
		category: 'ui_ux',
		summary:
			'Figma design systems, responsive mobile/web interfaces, and clickable product prototypes led by a 10+ year Lead UI/UX Designer.',
		defaultTier: 'rapid_7day',
		basePriceUSD: 600,
		deliveryDays: 7,
		supportedStacks: ['Figma', 'Design Systems', 'Wireframes', 'Interactive Prototypes'],
		scopeLimits7Day: [
			'Up to 6 core user-flow screens + component tokens in 7 days',
		],
		deliverables: [
			'Editable Figma file & component library',
			'Clickable prototype link & developer handoff tokens',
		],
	},
];

/** Canonical tech tokens accepted without human escalation (normalized lowercase keys). */
export const SUPPORTED_TECH_MAP: Record<string, string> = {
	'ai-native': 'AI-Native Development',
	'ai native': 'AI-Native Development',
	'ai try-on': 'AI Try-On / Computer Vision',
	'ai try on': 'AI Try-On / Computer Vision',
	'virtual try-on': 'AI Try-On / Computer Vision',
	'virtual try on': 'AI Try-On / Computer Vision',
	'computer vision': 'AI Try-On / Computer Vision',
	'next.js': 'Next.js',
	nextjs: 'Next.js',
	react: 'React',
	'react.js': 'React',
	typescript: 'TypeScript',
	'node.js': 'Node.js',
	nodejs: 'Node.js',
	node: 'Node.js',
	express: 'Express',
	fastify: 'Fastify',
	python: 'Python',
	fastapi: 'FastAPI',
	django: 'Django',
	flutter: 'Flutter',
	dart: 'Dart',
	'react native': 'React Native',
	'react-native': 'React Native',
	capacitor: 'Ionic Capacitor',
	ionic: 'Ionic Capacitor',
	'ionic capacitor': 'Ionic Capacitor',
	ios: 'iOS (Swift)',
	swift: 'iOS (Swift)',
	android: 'Android (Kotlin)',
	kotlin: 'Android (Kotlin)',
	java: 'Java Spring Boot',
	'java spring': 'Java Spring Boot',
	'spring boot': 'Java Spring Boot',
	spring: 'Java Spring Boot',
	angular: 'Angular',
	laravel: 'PHP / Laravel',
	php: 'PHP / Laravel',
	erp: 'Enterprise ERP / HR',
	hrm: 'Enterprise ERP / HR',
	hrms: 'Enterprise ERP / HR',
	payroll: 'Enterprise ERP / HR',
	postgresql: 'PostgreSQL',
	postgres: 'PostgreSQL',
	supabase: 'Supabase',
	prisma: 'Prisma',
	mysql: 'MySQL',
	mongodb: 'MongoDB',
	mongo: 'MongoDB',
	redis: 'Redis',
	firebase: 'Firebase',
	firestore: 'Cloud Firestore',
	docker: 'Docker',
	aws: 'AWS',
	netlify: 'Netlify',
	vercel: 'Vercel',
	codemagic: 'Codemagic CI/CD',
	'github actions': 'GitHub Actions',
	rest: 'REST API',
	graphql: 'GraphQL',
	figma: 'Figma',
	gemini: 'Gemini API',
	rag: 'RAG / Vector DB',
	mcp: 'Model Context Protocol (MCP)',
	a2a: 'Agent-to-Agent (A2A)',
	tailwind: 'Tailwind CSS',
};

/** Stacks that cannot enter the automated 7/14-day pipeline without manual escalation. */
export const UNSUPPORTED_STACK_KEYWORDS = [
	'unity',
	'unreal',
	'godot',
	'c++',
	'embedded firmware',
	'rtos',
	'arduino',
	'fpga',
	'vhdl',
	'verilog',
	'cobol',
	'fortran',
	'sap abap',
	'salesforce apex',
	'blockchain consensus',
	'solidity zk circuit',
	'ios objective-c legacy',
];

export type DeliveryPhase = {
	id: string;
	dayWindow: string;
	phase: string;
	execution: string;
};

export const DELIVERY_ENGINE_7DAY: DeliveryPhase[] = [
	{
		id: 'day_1_structuring',
		dayWindow: 'Day 1',
		phase: 'Schema + Boilerplate Lock (25% Deposit)',
		execution:
			'AI-Developer-Ready SRS validated; modular monorepo scaffold, DB schema, and auth boilerplate initialized.',
	},
	{
		id: 'day_2_3_codegen',
		dayWindow: 'Day 2-3',
		phase: 'Core Feature & API Engineering',
		execution:
			'Backend APIs, business logic, and frontend/mobile screens implemented with automated unit checks.',
	},
	{
		id: 'day_4_mvp_staging',
		dayWindow: 'Day 4',
		phase: 'Staging MVP Delivery (50% Milestone)',
		execution:
			'Live cloud staging URL / preview build delivered for client agent verification and 50% milestone settlement.',
	},
	{
		id: 'day_5_6_container_qa',
		dayWindow: 'Day 5-6',
		phase: 'Docker Containerization & Hardening',
		execution:
			'Automated linting, type-checking, security audit, Docker build validation, and acceptance criteria verification.',
	},
	{
		id: 'day_7_handover_release',
		dayWindow: 'Day 7',
		phase: 'Final Release & Handover (25% Final)',
		execution:
			'Source repository transfer (GitHub org invite), deployment docs, and final 25% milestone settlement.',
	},
];

export const DELIVERY_ENGINE_14DAY: DeliveryPhase[] = [
	{
		id: 'day_1_2_architecture',
		dayWindow: 'Day 1-2',
		phase: 'Architecture, Schema & Boilerplate (25% Deposit)',
		execution:
			'Full system architecture, ER schema, vector/AI evaluation plan, and monorepo scaffold locked.',
	},
	{
		id: 'day_3_7_implementation',
		dayWindow: 'Day 3-7',
		phase: 'Core Backend, AI/RAG & UI Sprints',
		execution:
			'Backend services, frontend/mobile views, custom AI/RAG pipelines, and third-party integrations built.',
	},
	{
		id: 'day_8_mvp_staging',
		dayWindow: 'Day 8',
		phase: 'Staging MVP Delivery (50% Milestone)',
		execution:
			'Cloud staging or TestFlight/APK build delivered for automated/client acceptance testing.',
	},
	{
		id: 'day_9_13_qa_hardening',
		dayWindow: 'Day 9-13',
		phase: 'Containerization, Security & E2E QA',
		execution:
			'Docker hardening, integration testing, performance profiling, and store compliance verification.',
	},
	{
		id: 'day_14_handover_release',
		dayWindow: 'Day 14',
		phase: 'Production Handover & Release (25% Final)',
		execution:
			'GitHub repo transfer, CI/CD secrets handover, documentation, and final 25% milestone settlement.',
	},
];

export function buildAgentCatalog() {
	return {
		schemaVersion: AGENT_PROTOCOL_VERSION,
		provider: {
			name: SITE_NAME,
			url: `${SITE_URL}/`,
			location: '325, Mirpur DOHS, Dhaka 1216, Bangladesh',
			serves: ['United States', 'Europe', 'Asia', 'Global Remote'],
			email: CONTACT.email,
			salesAgentEmail: SALES_AGENT_EMAIL,
			profiles: {
				github: CONTACT.github,
				fiverr: CONTACT.fiverr,
				upwork: CONTACT.upwork,
			},
			proof: {
				yearsActive: '2+ years agency track record (11+ years lead engineering experience)',
				shippedClients: 20,
				rating: '5.0 / 5.0 (Fiverr & Upwork)',
				coreTeamSize: 8,
				featuredCaseStudy: {
					name: 'MatMaps',
					url: `${SITE_URL}/projects/matmaps`,
					liveWeb: 'https://matmaps.co.uk/',
					playStore: 'https://play.google.com/store/apps/details?id=com.matmaps.app',
				},
			},
			team: AUTHORS.filter((a) => a.name !== 'TechFiyr Team').map((a) => ({
				name: a.name,
				role: a.role,
				profile: a.url,
			})),
		},
		guardrails: GUARDRAILS,
		services: AGENT_SERVICES,
		supportedTechnologies: Array.from(new Set(Object.values(SUPPORTED_TECH_MAP))),
		fulfillmentEngines: {
			rapid_7day: DELIVERY_ENGINE_7DAY,
			extended_14day: DELIVERY_ENGINE_14DAY,
		},
		paymentRails: [
			{
				id: 'crypto_usdc_solana',
				label: 'USDC on Solana (SPL)',
				currency: 'USDC',
				network: 'Solana (SPL)',
				settlement: '25% Upfront / 50% Staging MVP / 25% Final Handover',
			},
			{
				id: 'crypto_usdc_base',
				label: 'USDC on Base (EVM)',
				currency: 'USDC',
				network: 'Base (EVM)',
				settlement: '25% Upfront / 50% Staging MVP / 25% Final Handover',
			},
			{
				id: 'crypto_usdt_trc20',
				label: 'USDT (TRC20) — Binance P2P Offramp Ready',
				currency: 'USDT',
				network: 'TRON (TRC20)',
				settlement: '25% Upfront / 50% Staging MVP / 25% Final Handover',
			},
			{
				id: 'crypto_usdt_polygon',
				label: 'USDT (Polygon) — Binance P2P Offramp Ready',
				currency: 'USDT',
				network: 'Polygon (PoS)',
				settlement: '25% Upfront / 50% Staging MVP / 25% Final Handover',
			},
			{
				id: 'payoneer',
				label: 'Payoneer Virtual Receiving Account (USD)',
				currency: 'USD',
				network: 'Payoneer Global Receiving',
				settlement: '25% Upfront / 50% Staging MVP / 25% Final Handover',
			},
			{
				id: 'bank_invoice',
				label: 'Manual Bank Transfer Invoice (SWIFT / Wire)',
				currency: 'USD',
				network: 'International Wire',
				settlement: '25% Upfront / 50% Staging MVP / 25% Final Handover',
			},
		],
		endpoints: {
			agentCard: `${SITE_URL}/.well-known/agent.json`,
			mcpManifest: `${SITE_URL}/.well-known/mcp.json`,
			ucpManifest: `${SITE_URL}/.well-known/ucp.json`,
			openApi: `${SITE_URL}/openapi.json`,
			llmsTxt: `${SITE_URL}/llms.txt`,
			mcpServer: `${SITE_URL}/api/mcp`,
			a2aJsonRpc: `${SITE_URL}/api/agent/a2a`,
			catalog: `${SITE_URL}/api/agent/catalog`,
			quote: `${SITE_URL}/api/agent/quote`,
			negotiate: `${SITE_URL}/api/agent/negotiate`,
			createOrder: `${SITE_URL}/api/v1/agent-order`,
			orders: `${SITE_URL}/api/agent/orders`,
			meetingBooking: MEETING_BOOKING_URL,
		},
	};
}
