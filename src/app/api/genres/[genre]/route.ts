import { NextRequest, NextResponse } from 'next/server';
import { fetchGenreAnime } from '@/lib/hianime';

export async function GET(
  req: NextRequest,
  { params }: { params: { genre: string } }
) {
  try {
    const genre = params.genre;
    const results = await fetchGenreAnime(genre);
    return NextResponse.json({ genre, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch genre anime', genre: params.genre, results: [] },
      { status: 500 }
    );
  }
}
