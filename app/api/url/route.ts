import { getLiveKitURL } from '@/lib/server-utils';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const region = req.nextUrl.searchParams.get('region');
    const livekitUrl = getLiveKitURL(region);
    return NextResponse.json({ url: livekitUrl });
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
  }
}
