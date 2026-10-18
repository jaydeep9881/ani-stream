import { NextResponse } from 'next/server';
import { fetchLandingData } from '@/lib/hianime';

export async function GET() {
  try {
    const data = await fetchLandingData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch landing data', details: error.message },
      { status: 500 }
    );
  }
}
