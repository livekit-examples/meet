import { AgentDispatchClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// Agent name must match the one registered in the worker
const AGENT_NAME = 'transcription-agent';

interface SpawnRequest {
  roomName: string;
  email?: string;
  e2eePassphrase?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment
    if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
      return new NextResponse('LiveKit credentials not configured', { status: 500 });
    }

    // Parse request body
    const body: SpawnRequest = await request.json();
    const { roomName, email, e2eePassphrase } = body;

    if (!roomName) {
      return new NextResponse('Missing required parameter: roomName', { status: 400 });
    }

    // Create dispatch client
    const dispatchClient = new AgentDispatchClient(LIVEKIT_URL, API_KEY, API_SECRET);

    // Build metadata for the agent
    const metadata = JSON.stringify({
      roomName,
      email: email || null,
      passphrase: e2eePassphrase || null,
      serverUrl: LIVEKIT_URL,
      // Include the base URL so agent can fetch tokens
      baseUrl: getBaseUrl(request),
    });

    // Create dispatch request
    const dispatch = await dispatchClient.createDispatch(roomName, AGENT_NAME, {
      metadata,
    });

    console.log(`Dispatched agent ${AGENT_NAME} to room ${roomName}`, {
      dispatchId: dispatch.agentName,
      hasEmail: !!email,
      hasE2EE: !!e2eePassphrase,
    });

    return NextResponse.json({
      success: true,
      agentName: dispatch.agentName,
      room: dispatch.room,
    });
  } catch (error) {
    console.error('Failed to spawn agent:', error);

    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Get the base URL from the request
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}


