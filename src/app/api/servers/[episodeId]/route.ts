import { NextRequest, NextResponse } from 'next/server';
import { fetchEpisodeServers } from '@/lib/hianime';

export async function GET(
  req: NextRequest,
  { params }: { params: { episodeId: string } }
) {
  try {
    const episodeId = params.episodeId;
    const servers = await fetchEpisodeServers(episodeId);
    return NextResponse.json(servers);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch servers', details: error.message, sub: [], dub: [] },
      { status: 500 }
    );
  }
}
