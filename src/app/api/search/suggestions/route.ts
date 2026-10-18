import { NextRequest, NextResponse } from 'next/server';
import { fetchSearchSuggestions } from '@/lib/hianime';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('keyword') || searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await fetchSearchSuggestions(q);
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Suggestions failed', details: error.message, suggestions: [] },
      { status: 500 }
    );
  }
}
