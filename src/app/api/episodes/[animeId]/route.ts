import { NextRequest, NextResponse } from 'next/server';
import { fetchAnimeEpisodes } from '@/lib/hianime';

export async function GET(
  req: NextRequest,
  { params }: { params: { animeId: string } }
) {
  try {
    const animeId = params.animeId;
    const episodes = await fetchAnimeEpisodes(animeId);
    return NextResponse.json({ total: episodes.length, episodes });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch episodes', details: error.message, episodes: [] },
      { status: 500 }
    );
  }
}
