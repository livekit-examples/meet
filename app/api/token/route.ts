import { AccessToken } from 'livekit-server-sdk';
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { TokenResult } from '@/lib/types';
import { NextResponse } from 'next/server';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

const createToken = (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.ttl = '5m';
  at.addGrant(grant);
  return at.toJwt();
};

const roomPattern = /\w{4}\-\w{4}/;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const roomName = searchParams.get('roomName');
    const identity = searchParams.get('identity');
    const name = searchParams.get('name');
    const metadata = searchParams.get('metadata') ?? '';

    if (typeof identity !== 'string' || typeof roomName !== 'string') {
      return new NextResponse('Forbidden', { status: 401 });
    }
    if (name === null) {
      return new NextResponse('Provide a name.', { status: 400 });
    }
    if (Array.isArray(name)) {
      return new NextResponse('Provide only one room name.', { status: 400 });
    }
    if (Array.isArray(metadata)) {
      return new NextResponse('Provide only one metadata string.', { status: 400 });
    }

    // enforce room name to be xxxx-xxxx
    // this is simple & naive way to prevent user from guessing room names
    // please use your own authentication mechanisms in your own app
    if (!roomName.match(roomPattern)) {
      return new NextResponse('Invalid room name format.', { status: 400 });
    }

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    const token = await createToken({ identity, name, metadata }, grant);
    const result: TokenResult = {
      identity,
      accessToken: token,
    };

    return NextResponse.json(result);
  } catch (error) {
    return new NextResponse((error as Error).message, { status: 500 });
  }
}
