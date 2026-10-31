import { NextRequest, NextResponse } from 'next/server';
import { searchYt } from '@/lib/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || !q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchYt(q.trim());
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YouTube search failed';
    console.error('yt search error:', message);
    return NextResponse.json({ results: [], error: message }, { status: 502 });
  }
}
