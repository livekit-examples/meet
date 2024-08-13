import { EgressClient } from 'livekit-server-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function stopRecording(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { roomName } = req.query;

    /**
     * CAUTION:
     * for simplicity this implementation does not authenticate users and therefore allows anyone with knowledge of a roomName
     * to start/stop recordings for that room.
     * DO NOT USE THIS FOR PRODUCTION PURPOSES AS IS
     */

    if (typeof roomName !== 'string') {
      res.statusMessage = 'Missing roomName parameter';
      res.status(403).end();
      return;
    }

    const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;

    const hostURL = new URL(LIVEKIT_URL!);
    hostURL.protocol = 'https:';

    const egressClient = new EgressClient(hostURL.origin, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    const activeEgresses = (await egressClient.listEgress({ roomName })).filter(
      (info) => info.status < 2,
    );
    if (activeEgresses.length === 0) {
      res.statusMessage = 'No active recording found';
      res.status(404).end();
      return;
    }
    await Promise.all(activeEgresses.map((info) => egressClient.stopEgress(info.egressId)));

    res.status(200).end();
  } catch (e) {
    if (e instanceof Error) {
      res.statusMessage = e.name;
      console.error(e);
      res.status(500).end();
      return;
    }
  }
}
