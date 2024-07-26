import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handleToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { roomName } = req.query;

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
    } = process.env;

    const hostURL = new URL(LIVEKIT_URL!);
    hostURL.protocol = 'https:';

    const egressClient = new EgressClient(hostURL.origin, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    const fileOutput = new EncodedFileOutput({
      filepath: `${new Date(Date.now()).toISOString()}-${roomName}.mp4`,
      output: {
        case: 's3',
        value: new S3Upload({
          endpoint: S3_ENDPOINT,
          accessKey: S3_KEY_ID,
          secret: S3_KEY_SECRET,
          region: 'auto',
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
