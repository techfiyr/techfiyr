/*
 * GET /api/agent/catalog: machine-readable TechFiyr service catalog, supported stacks,
 * pricing guardrails, and 7-day / 14-day fulfillment specifications for AI agents.
 */
import { buildAgentCatalog } from '@/lib/agent/catalog';
import { agentJson, agentOptions } from '@/lib/server/agent-http';
import { SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';

export async function OPTIONS() {
	return agentOptions();
}

export async function GET(req: Request) {
	const format = new URL(req.url).searchParams.get('format')?.toLowerCase();
	const catalog = buildAgentCatalog();

	if (format === 'ucp') {
		return agentJson(
			{
				protocol: 'UCP/1.0',
				'@context': 'https://schema.org',
				'@type': 'OfferCatalog',
				name: 'TechFiyr Agentic Development Services',
				provider: {
					'@type': 'ProfessionalService',
					name: catalog.provider.name,
					url: catalog.provider.url,
					email: catalog.provider.email,
				},
				guardrails: catalog.guardrails,
				itemListElement: catalog.services.map((s, idx) => ({
					'@type': 'Offer',
					position: idx + 1,
					itemOffered: {
						'@type': 'Service',
						identifier: s.id,
						name: s.name,
						description: s.summary,
						serviceType: s.category,
					},
					priceSpecification: {
						'@type': 'PriceSpecification',
						minPrice: s.basePriceUSD,
						priceCurrency: 'USD',
					},
					deliveryLeadTime: {
						'@type': 'QuantitativeValue',
						value: s.deliveryDays,
						unitCode: 'DAY',
					},
					url: `${SITE_URL}/api/v1/agent-order`,
				})),
				endpoints: catalog.endpoints,
			},
			200,
			{ 'Cache-Control': 'public, max-age=3600' },
		);
	}

	return agentJson({ ok: true, ...catalog }, 200, { 'Cache-Control': 'public, max-age=3600' });
}

