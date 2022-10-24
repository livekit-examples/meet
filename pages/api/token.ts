// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { AccessToken } from 'livekit-server-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getLiveKitURL } from '../../lib/clients';
import { TokenResult } from '../../lib/types';

const roomPattern = /\w{4}\-\w{4}/;

export default function handler(req: NextApiRequest, res: NextApiResponse<TokenResult>) {
  const roomName = req.query.roomName as string | undefined;
  const identity = req.query.identity as string | undefined;
  const region = req.query.region as string | undefined;

  if (!roomName || !identity) {
    res.status(403).end();
    return;
  }

  // enforce room name to be xxxx-xxxx
  // this is simple & naive way to prevent user from guessing room names
  // please use your own authentication mechanisms in your own app
  if (!roomName.match(roomPattern)) {
    res.status(400).end();
    return;
  }

  const at = new AccessToken();
  at.identity = identity;
  at.name = identity;
  at.ttl = '5m';
  at.addGrant({
    room: roomName,
    roomJoin: true,
  });

  res.status(200).json({
    url: getLiveKitURL(region),
    token: at.toJwt(),
  });
}
