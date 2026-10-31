import { NextRequest, NextResponse } from 'next/server';
import { searchAudius } from '@/lib/audius';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchAudius(q.trim());
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
