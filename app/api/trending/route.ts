import { NextResponse } from 'next/server';
import { trendingAudius } from '@/lib/audius';

export const revalidate = 600;

export async function GET() {
  try {
    const results = await trendingAudius();
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Trending error:', error);
    return NextResponse.json({ results: [], error: 'Failed to load trending' }, { status: 500 });
  }
}
