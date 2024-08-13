import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function startRecording(req: NextApiRequest, res: NextApiResponse) {
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

    const {
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      LIVEKIT_URL,
      S3_KEY_ID,
      S3_KEY_SECRET,
      S3_BUCKET,
      S3_ENDPOINT,
      S3_REGION,
    } = process.env;

    const hostURL = new URL(LIVEKIT_URL!);
    hostURL.protocol = 'https:';

    const egressClient = new EgressClient(hostURL.origin, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    const existingEgresses = await egressClient.listEgress({ roomName });
    if (existingEgresses.length > 0 && existingEgresses.some((e) => e.status < 2)) {
      (res.statusMessage = 'Meeting is already being recorded'), res.status(409).end();
      return;
    }

    const fileOutput = new EncodedFileOutput({
      filepath: `${new Date(Date.now()).toISOString()}-${roomName}.mp4`,
      output: {
        case: 's3',
        value: new S3Upload({
          endpoint: S3_ENDPOINT,
          accessKey: S3_KEY_ID,
          secret: S3_KEY_SECRET,
          region: S3_REGION,
          bucket: S3_BUCKET,
        }),
      },
    });

    await egressClient.startRoomCompositeEgress(
      roomName,
      {
        file: fileOutput,
      },
      {
        layout: 'speaker',
      },
    );

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
