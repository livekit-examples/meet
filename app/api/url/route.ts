import { getLiveKitURL } from '../../../lib/server-utils';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const region = searchParams.get('region');

    if (Array.isArray(region)) {
      throw Error('provide max one region string');
    }
    const livekitUrl = getLiveKitURL(region);
    return NextResponse.json({ url: livekitUrl });
  } catch (error) {
    return new NextResponse((error as Error).message, { status: 500 });
  }
}
