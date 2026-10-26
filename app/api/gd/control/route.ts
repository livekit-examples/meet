
import {
  AgentDispatchClient,
  RoomServiceClient,
  TokenVerifier,
} from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;

type DiscussionState = {
  hostIdentity?: string;
  status?: 'waiting' | 'running' | 'ended';
};

function getClients() {
  if (!apiKey || !apiSecret || !livekitUrl) {
    throw new Error('LiveKit server environment variables are missing.');
  }

  const host = livekitUrl
    .replace(/^wss:/, 'https:')
    .replace(/^ws:/, 'http:');

  return {
    rooms: new RoomServiceClient(host, apiKey, apiSecret),
    dispatch: new AgentDispatchClient(host, apiKey, apiSecret),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const roomName =
      typeof body.roomName === 'string' ? body.roomName.trim() : '';

    const action = body.action;

    const participantToken =
      typeof body.participantToken === 'string'
        ? body.participantToken
        : '';

    if (!roomName || !participantToken) {
      return NextResponse.json(
        { error: 'roomName and participantToken are required.' },
        { status: 400 },
      );
    }

    if (action !== 'start' && action !== 'end') {
      return NextResponse.json(
        { error: 'Action must be start or end.' },
        { status: 400 },
      );
    }

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error('LiveKit server environment variables are missing.');
    }

    // Verify that the participant token was signed by LiveKit.
    const verifier = new TokenVerifier(apiKey, apiSecret);
    const claims = await verifier.verify(participantToken);

    const identity = claims.sub;
    const tokenRoom = claims.video?.room;
    const canJoin = claims.video?.roomJoin;

    if (!identity || tokenRoom !== roomName || !canJoin) {
      return NextResponse.json(
        { error: 'Invalid participant token for this room.' },
        { status: 401 },
      );
    }

    const { rooms, dispatch } = getClients();

    // Confirm that the participant is currently in this room.
    const participants = await rooms.listParticipants(roomName);
    const caller = participants.find(
      (participant) => participant.identity === identity,
    );

    if (!caller) {
      return NextResponse.json(
        { error: 'Participant is not in the room.' },
        { status: 403 },
      );
    }

    const roomList = await rooms.listRooms([roomName]);
    const room = roomList[0];

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found.' },
        { status: 404 },
      );
    }

    let state: DiscussionState = {};

    try {
      state = room.metadata ? JSON.parse(room.metadata) : {};
    } catch {
      state = {};
    }

    // START: the first participant to start becomes the host.
    if (action === 'start') {
      if (state.status === 'running' || state.status === 'ended') {
        return NextResponse.json(
          { error: 'The discussion has already started or ended.' },
          { status: 409 },
        );
      }

      state = {
        hostIdentity: identity,
        status: 'running',
      };

      await rooms.updateRoomMetadata(
        roomName,
        JSON.stringify(state),
      );

      try {
        const deployment = process.env.LIVEKIT_AGENT_DEPLOYMENT;

if (!deployment) {
  throw new Error('LIVEKIT_AGENT_DEPLOYMENT is not configured.');
}

const dispatchResult = await dispatch.createDispatch(
  roomName,
  'gd-speaking-bot',
  {
    metadata: JSON.stringify({
      purpose: 'group-discussion',
    }),
    deployment,
  },
);

console.log('[GD CONTROL] Agent dispatched:', dispatchResult);
      } catch (error) {
        await rooms.updateRoomMetadata(roomName, JSON.stringify({}));
        throw error;
      }

      // The browser must publish GD_START after receiving this response.
      return NextResponse.json({
        success: true,
        status: 'running',
        hostIdentity: identity,
        message: 'Group discussion started.',
      });
    }

    // END: only the host can end the discussion early.
    if (state.hostIdentity !== identity) {
      return NextResponse.json(
        { error: 'Only the host can end the discussion.' },
        { status: 403 },
      );
    }

    if (state.status !== 'running') {
      return NextResponse.json(
        { error: 'The discussion is not running.' },
        { status: 409 },
      );
    }

    // Mark the room as ended. The host's browser must then publish
    // GD_END to the bot as a participant-originated data message.
    state.status = 'ended';

    await rooms.updateRoomMetadata(
      roomName,
      JSON.stringify(state),
    );

    return NextResponse.json({
      success: true,
      status: 'ended',
      hostIdentity: identity,
      message: 'Discussion ended. Notify the bot to say thank you.',
    });
  } catch (error) {
    console.error('GD control API error:', error);

    return NextResponse.json(
      { error: 'Failed to control the group discussion.' },
      { status: 500 },
    );
  }
}
