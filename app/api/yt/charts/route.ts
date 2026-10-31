import { NextResponse } from 'next/server';
import { chartsYt } from '@/lib/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await chartsYt();
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load charts';
    console.error('yt charts error:', message);
    return NextResponse.json({ results: [], error: message }, { status: 502 });
  }
}
