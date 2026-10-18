import { NextResponse } from 'next/server';
import { fetchHomeCatalog } from '@/lib/hianime';

export async function GET() {
  try {
    const data = await fetchHomeCatalog();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch home anime data', details: error.message },
      { status: 500 }
    );
  }
}
