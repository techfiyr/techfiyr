import type { NextConfig } from 'next';

/*
 * Every page is prerendered at build time (static HTML on Netlify's CDN), and links between
 * pages are prefetched, so navigation is instant. Legacy .html URLs are redirected in netlify.toml.
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
};

export default nextConfig;
