/*
 * Serves `/.well-known/mcp-registry-auth` (via next.config.ts rewrite) for official
 * Model Context Protocol Registry HTTP domain verification (`mcp-publisher login http --domain techfiyr.com`).
 * Format expected by the MCP Registry: `v=MCPv1; k=ed25519; p=<BASE64_PUBLIC_KEY>`.
 */
import { NextResponse } from 'next/server';
import { env } from '@/lib/server/google';

export const runtime = 'nodejs';

export async function GET() {
	const proof = env('MCP_REGISTRY_AUTH').trim();
	if (!proof) {
		return new NextResponse(
			'MCP_REGISTRY_AUTH is not configured. Set MCP_REGISTRY_AUTH="v=MCPv1; k=ed25519; p=..." in environment variables to verify techfiyr.com for the official MCP Registry.\n',
			{
				status: 404,
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-store',
					'Access-Control-Allow-Origin': '*',
				},
			},
		);
	}

	return new NextResponse(`${proof}\n`, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

