import type { NextConfig } from 'next';

/*
 * Every page is prerendered at build time (static HTML on Netlify's CDN), and links between
 * pages are prefetched, so navigation is instant. Legacy .html URLs are redirected in netlify.toml (old project URLs in proxy.ts).
 */
const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	// Pages use plain <img> with explicit width/height, exactly as the original template
	images: { unoptimized: true },
	experimental: {
		// Keep prefetched pages in the client cache so back/forward and repeat visits are instant
		staleTimes: { dynamic: 30, static: 300 },
	},
	async rewrites() {
		return [
			{ source: '/sitemap', destination: '/sitemap.xml' },
			{ source: '/sitemap/', destination: '/sitemap.xml' },
			{ source: '/robots', destination: '/robots.txt' },
			{ source: '/llm', destination: '/llms.txt' },
			{ source: '/llm.txt', destination: '/llms.txt' },
			{ source: '/llms', destination: '/llms.txt' },
			{ source: '/llms-full.txt', destination: '/llms.txt' },
			{ source: '/.well-known/ard.json', destination: '/ard.json' },
			{ source: '/.well-known/ai-catalog.json', destination: '/ai-catalog.json' },
			{ source: '/.well-known/agent-card.json', destination: '/.well-known/agent.json' },
			{ source: '/.well-known/mcp-registry-auth', destination: '/api/well-known-mcp-auth' },
		];
	},
	async headers() {
		return [
			{
				source: '/',
				headers: [
					{
						key: 'Link',
						value:
							'<https://techfiyr.com/.well-known/ard.json>; rel="ard"; type="application/json", <https://techfiyr.com/.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json", <https://techfiyr.com/.well-known/agent.json>; rel="describedby"; type="application/json", <https://techfiyr.com/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json", <https://techfiyr.com/llms.txt>; rel="alternate"; type="text/markdown"',
					},
				],
			},
			{
				source: '/ard.json',
				headers: [
					{ key: 'Content-Type', value: 'application/json; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
			{
				source: '/ai-catalog.json',
				headers: [
					{ key: 'Content-Type', value: 'application/json; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
			{
				source: '/.well-known/:path*.json',
				headers: [
					{ key: 'Content-Type', value: 'application/json; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
			{
				source: '/server.json',
				headers: [
					{ key: 'Content-Type', value: 'application/json; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
			{
				source: '/mcp.json',
				headers: [
					{ key: 'Content-Type', value: 'application/json; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
			{
				source: '/llms-install.md',
				headers: [
					{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
			{
				source: '/openapi.json',
				headers: [
					{ key: 'Content-Type', value: 'application/json; charset=utf-8' },
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{ key: 'Cache-Control', value: 'public, max-age=3600' },
				],
			},
		];
	},
};

export default nextConfig;
