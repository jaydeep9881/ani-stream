import { NextRequest, NextResponse } from 'next/server';
import { fetchAnimeDetails } from '@/lib/hianime';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const detail = await fetchAnimeDetails(slug);
    return NextResponse.json(detail);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch anime details', details: error.message },
      { status: 500 }
    );
  }
}
