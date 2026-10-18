import { NextRequest, NextResponse } from 'next/server';
import { fetchSearchAnime } from '@/lib/hianime';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || searchParams.get('keyword') || '';

    if (!q.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await fetchSearchAnime(q);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}
