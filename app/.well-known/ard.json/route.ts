import { NextResponse } from 'next/server';
import ardData from '@/public/.well-known/ard.json';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export function GET() {
	return NextResponse.json(ardData, {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}

