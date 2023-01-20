import { NextApiRequest, NextApiResponse } from 'next';

import { AccessToken } from 'livekit-server-sdk';
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { TokenResult } from '../../lib/types';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

const createToken = (userInfo: AccessTokenOptions, grant: VideoGrant) => {
  const at = new AccessToken(apiKey, apiSecret, userInfo);
  at.ttl = '5m';
  at.addGrant(grant);
  return at.toJwt();
};

const roomPattern = /\w{4}\-\w{4}/;

export default async function handleToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { roomName, identity, name, metadata } = req.query;

    if (typeof identity !== 'string' || typeof roomName !== 'string') {
      res.status(403).end();
      return;
    }

    if (Array.isArray(name)) {
      throw Error('provide max one name');
    }
    if (Array.isArray(metadata)) {
      throw Error('provide max one metadata string');
    }

    // enforce room name to be xxxx-xxxx
    // this is simple & naive way to prevent user from guessing room names
    // please use your own authentication mechanisms in your own app
    if (!roomName.match(roomPattern)) {
      res.status(400).end();
      return;
    }

    // if (!userSession.isAuthenticated) {
    //   res.status(403).end();
    //   return;
    // }

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    const token = createToken({ identity, name, metadata }, grant);
    const result: TokenResult = {
      identity,
      accessToken: token,
    };

    res.status(200).json(result);
  } catch (e) {
    res.statusMessage = (e as Error).message;
    res.status(500).end();
  }
}
