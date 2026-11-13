import { NextResponse } from 'next/server';
import catalogData from '@/public/.well-known/ai-catalog.json';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export function GET() {
	return NextResponse.json(catalogData, {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}

