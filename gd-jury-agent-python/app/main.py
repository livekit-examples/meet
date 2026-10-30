
import asyncio
import logging
import os
import re
import secrets
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from livekit import api

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR.parent.parent / ".env")

app = FastAPI(
    title="AI Hackathon Jury Agent",
    description="Python backend for the AI Hackathon Jury Agent",
    version="1.0.0",
)

# Suppress duplicate dispatches briefly while a worker is joining the room.
started_rooms = {}
DISPATCH_JOIN_TIMEOUT_SECONDS = 8
dispatch_lock = asyncio.Lock()


class TokenRequest(BaseModel):
    team_name: str
    participant_name: str


class StartEvaluationRequest(BaseModel):
    room_name: str = "hackathon-room"


def get_livekit_config():
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not all([livekit_url, api_key, api_secret]):
        raise HTTPException(
            status_code=500,
            detail="LiveKit configuration is missing.",
        )

    return livekit_url, api_key, api_secret


def validate_room_name(room_name: str):
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,100}", room_name):
        raise HTTPException(status_code=400, detail="Invalid room name.")


def room_name_for_team(team_name: str) -> str:
    if not team_name.strip() or len(team_name) > 100:
        raise HTTPException(
            status_code=400,
            detail="Team name must be between 1 and 100 characters.",
        )

    room_name = re.sub(r"[^a-zA-Z0-9_-]+", "-", team_name.strip()).strip("-_")
    if not room_name:
        raise HTTPException(
            status_code=400,
            detail="Team name must include at least one letter or number.",
        )
    return room_name


@app.get("/")
async def home():
    return {
        "message": "AI Hackathon Jury Agent API is running",
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "gd-jury-agent-python"}


@app.get("/meeting")
async def meeting_page():
    return FileResponse(BASE_DIR / "templates" / "meeting.html")


async def ensure_unlimited_room(
    livekit_url: str,
    api_key: str,
    api_secret: str,
    room_name: str,
):
    async with api.LiveKitAPI(
        url=livekit_url,
        api_key=api_key,
        api_secret=api_secret,
    ) as livekit_api:
        rooms = await livekit_api.room.list_rooms(
            api.ListRoomsRequest(names=[room_name])
        )
        room = next(
            (room for room in rooms.rooms if room.name == room_name),
            None,
        )

        if room is None:
            try:
                room = await livekit_api.room.create_room(
                    api.CreateRoomRequest(
                        name=room_name,
                        max_participants=0,
                    )
                )
            except Exception:
                rooms = await livekit_api.room.list_rooms(
                    api.ListRoomsRequest(names=[room_name])
                )
                room = next(
                    (room for room in rooms.rooms if room.name == room_name),
                    None,
                )
                if room is None:
                    raise

        if room.max_participants > 0:
            raise HTTPException(
                status_code=409,
                detail=(
                    "This room has a participant limit configured in LiveKit. "
                    "Choose a new room name to create a room without an app-configured limit."
                ),
            )


@app.post("/api/token")
async def create_token(request: TokenRequest):
    livekit_url, api_key, api_secret = get_livekit_config()
    room_name = room_name_for_team(request.team_name)

    participant_name = request.participant_name.strip()
    if not participant_name or len(participant_name) > 80:
        raise HTTPException(
            status_code=400,
            detail="Participant name must be 1–80 characters.",
        )

    try:
        await ensure_unlimited_room(
            livekit_url,
            api_key,
            api_secret,
            room_name,
        )
    except HTTPException:
        raise
    except Exception as error:
        logging.exception("Could not create or verify the meeting room")
        raise HTTPException(
            status_code=502,
            detail="Could not prepare the meeting room. Check the LiveKit configuration.",
        ) from error

    identity = f"team-{secrets.token_hex(8)}"

    token = (
        api.AccessToken(api_key, api_secret)
        .with_identity(identity)
        .with_name(participant_name)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
    )

    # Joining does not automatically start the jury.
    return {
        "server_url": livekit_url,
        "participant_token": token.to_jwt(),
        "room_name": room_name,
        "team_name": request.team_name.strip(),
        "participant_name": participant_name,
    }


@app.post("/api/evaluation/start")
async def start_evaluation(request: StartEvaluationRequest):
    livekit_url, api_key, api_secret = get_livekit_config()
    validate_room_name(request.room_name)

    async with dispatch_lock:
        try:
            async with api.LiveKitAPI(
                url=livekit_url,
                api_key=api_key,
                api_secret=api_secret,
            ) as livekit_api:
                participants = await livekit_api.room.list_participants(
                    api.ListParticipantsRequest(room=request.room_name)
                )
                dispatches = await livekit_api.agent_dispatch.list_dispatch(
                    request.room_name
                )
                active_jury_identities = set()
                active_jury_jobs = []
                ended_jury_identities = set()

                for dispatch in dispatches:
                    if dispatch.agent_name != "hackathon-jury":
                        continue

                    for job in dispatch.state.jobs:
                        state = job.state
                        status_field = state.DESCRIPTOR.fields_by_name["status"]
                        status = status_field.enum_type.values_by_number[
                            state.status
                        ].name

                        if status in {"JS_PENDING", "JS_RUNNING"}:
                            active_jury_jobs.append(dispatch)
                            active_jury_identities.add(state.participant_identity)
                        elif status in {"JS_SUCCESS", "JS_FAILED", "JS_CANCELLED"}:
                            ended_jury_identities.add(state.participant_identity)

                for participant in participants.participants:
                    if (
                        participant.identity.startswith("agent-")
                        and participant.identity in ended_jury_identities
                        and participant.identity not in active_jury_identities
                    ):
                        logging.info(
                            "Removing stale jury participant %s from room %s",
                            participant.identity,
                            request.room_name,
                        )
                        await livekit_api.room.remove_participant(
                            api.RoomParticipantIdentity(
                                room=request.room_name,
                                identity=participant.identity,
                            )
                        )

                jury_is_present = any(
                    participant.identity in active_jury_identities
                    for participant in participants.participants
                )
                if jury_is_present:
                    started_rooms[request.room_name] = time.monotonic()
                    return {
                        "status": "already_started",
                        "message": "The jury is already connected to this room.",
                    }

                if active_jury_jobs:
                    started_rooms[request.room_name] = time.monotonic()
                    return {
                        "status": "starting",
                        "message": "The jury is already connecting to this room.",
                    }

                last_dispatch = started_rooms.get(request.room_name)
                if (
                    last_dispatch is not None
                    and time.monotonic() - last_dispatch < DISPATCH_JOIN_TIMEOUT_SECONDS
                ):
                    return {
                        "status": "starting",
                        "message": "The jury is still connecting to this room.",
                    }

                await livekit_api.agent_dispatch.create_dispatch(
                    api.CreateAgentDispatchRequest(
                        agent_name="hackathon-jury",
                        room=request.room_name,
                        deployment=os.getenv("LIVEKIT_AGENT_DEPLOYMENT", "").strip(),
                    )
                )

            started_rooms[request.room_name] = time.monotonic()
            logging.info(
                "Dispatched hackathon-jury to room %s using deployment %s",
                request.room_name,
                os.getenv("LIVEKIT_AGENT_DEPLOYMENT", "").strip() or "default",
            )

        except Exception:
            # Log the error on the server without exposing credentials.
            logging.exception("Could not start the jury evaluation")
            raise HTTPException(
                status_code=502,
                detail="Could not start the jury agent. Check the agent terminal and LiveKit configuration.",
            )

    return {
        "status": "started",
        "message": "The jury evaluation has been started.",
    }
