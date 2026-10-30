
import asyncio
import logging
import os
from collections.abc import AsyncIterable, Sequence
from pathlib import Path

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    FlushSentinel,
    JobContext,
    ModelSettings,
    cli,
    room_io,
)
from livekit.agents.llm import ChatChunk, ChatContext, FallbackAdapter, ImageContent, LLM, Tool
from livekit.plugins import deepgram, google, openai

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger("hackathon-jury")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    raise RuntimeError(
        "DEEPGRAM_API_KEY is missing. Add it to gd-jury-agent-python/.env or export it before starting the agent."
    )

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

if not OPENAI_API_KEY and not GOOGLE_API_KEY:
    raise RuntimeError(
        "Configure OPENAI_API_KEY in the repository .env or GOOGLE_API_KEY in "
        "gd-jury-agent-python/.env to enable jury responses."
    )

server = AgentServer()


def create_llm() -> tuple[LLM, str]:
    if GOOGLE_API_KEY:
        return (
            FallbackAdapter(
                llm=[
                    google.LLM(
                        model="gemini-3.5-flash",
                        api_key=GOOGLE_API_KEY,
                    ),
                    google.LLM(
                        model="gemini-3.5-flash-lite",
                        api_key=GOOGLE_API_KEY,
                    ),
                    google.LLM(
                        model="gemini-2.5-flash",
                        api_key=GOOGLE_API_KEY,
                    ),
                ],
                attempt_timeout=15.0,
                max_retry_per_llm=0,
            ),
            "Google Gemini with model failover",
        )

    return (
        openai.LLM(
            model=OPENAI_MODEL,
            api_key=OPENAI_API_KEY,
        ),
        f"OpenAI ({OPENAI_MODEL})",
    )


def listen_to_active_team_speaker(
    agent_room_io: room_io.RoomIO,
    speakers: Sequence[rtc.RemoteParticipant],
) -> None:
    team_speaker = next(
        (
            participant
            for participant in speakers
            if not participant.identity.lower().startswith("agent-")
        ),
        None,
    )
    if team_speaker is None:
        return

    linked_participant = agent_room_io.linked_participant
    if linked_participant is None or linked_participant.identity != team_speaker.identity:
        logger.info("Listening to team participant %s", team_speaker.identity)
        agent_room_io.set_participant(team_speaker.identity)


class HackathonJury(Agent):
    def __init__(self, get_latest_screen_frame):
        self._get_latest_screen_frame = get_latest_screen_frame
        super().__init__(
            instructions=(
                "You are the AI jury member in a live hackathon team meeting. "
                "After welcoming the team, ask whether they are ready to present and invite "
                "them to share their screen, slides, or live demo. "
                "Then listen carefully and have a real back-and-forth conversation. "
                "Act like an attentive human hackathon judge throughout the entire "
                "presentation, not just at the beginning or when directly addressed. "
                "Let the presenter finish each thought; never talk over them. After each "
                "meaningful section or answer, briefly acknowledge what they said and ask "
                "one specific, relevant follow-up question. Move naturally through the "
                "problem, target users, solution, demo, technology choices, challenges, "
                "innovation, impact, and next steps. If the team has been presenting for "
                "a while without a question, ask a concise question at the next pause. "
                "Respond directly to what the team just said before asking a follow-up. "
                "If they ask whether they should present, clearly say yes and invite them "
                "to start sharing their screen. If they greet you or ask whether you are "
                "there, answer them. Never repeat only the welcome, ignore a clear question, "
                "or wait for a special wake phrase. Do not ask multiple questions at once "
                "or repeat questions the team has already answered. "
                "After a team answer, follow its details with another question when useful; "
                "do not end the interaction after a single exchange. "
                "When a screen image is included in the current user turn, inspect that image "
                "before answering questions about what is shown. Describe only content that is "
                "clearly visible. Distinguish code editors, slides, terminals, and other apps; "
                "never assume a shared screen is a PowerPoint. If the image is missing or unclear, "
                "say you cannot make it out and ask the team to describe or share it again. "
                "Be warm, polite, concise, and professional."
            )
        )

    def llm_node(
        self,
        chat_ctx: ChatContext,
        tools: list[Tool],
        model_settings: ModelSettings,
    ) -> AsyncIterable[ChatChunk | str | FlushSentinel]:
        frame = self._get_latest_screen_frame()
        if frame is not None:
            chat_ctx = chat_ctx.copy()
            last_user_index = next(
                (
                    index
                    for index in range(len(chat_ctx.items) - 1, -1, -1)
                    if chat_ctx.items[index].role == "user"
                ),
                None,
            )
            if last_user_index is not None:
                message = chat_ctx.items[last_user_index]
                chat_ctx.items[last_user_index] = message.model_copy(
                    update={"content": [*message.content, ImageContent(image=frame)]}
                )

        return super().llm_node(chat_ctx, tools, model_settings)


@server.rtc_session(agent_name="hackathon-jury")
async def entrypoint(ctx: JobContext):
    await ctx.connect()
    logger.info("Connected to room %s; starting jury voice session", ctx.room.name)

    screen_frames: dict[str, rtc.VideoFrame] = {}
    latest_screen_track_sid: str | None = None
    screen_capture_tasks: dict[str, asyncio.Task[None]] = {}

    def get_latest_screen_frame() -> rtc.VideoFrame | None:
        if latest_screen_track_sid is None:
            return None
        return screen_frames.get(latest_screen_track_sid)

    async def capture_screen_share(track: rtc.RemoteTrack, track_sid: str) -> None:
        nonlocal latest_screen_track_sid
        stream = rtc.VideoStream(track)
        try:
            async for event in stream:
                screen_frames[track_sid] = event.frame
                latest_screen_track_sid = track_sid
        finally:
            await stream.aclose()

    def on_track_subscribed(
        track: rtc.RemoteTrack,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant,
    ) -> None:
        if publication.source != rtc.TrackSource.SOURCE_SCREENSHARE:
            return
        if publication.sid in screen_capture_tasks:
            return

        logger.info("Receiving screen share from participant %s", participant.identity)
        task = asyncio.create_task(capture_screen_share(track, publication.sid))
        screen_capture_tasks[publication.sid] = task

        def on_capture_finished(finished_task: asyncio.Task[None]) -> None:
            screen_capture_tasks.pop(publication.sid, None)
            try:
                finished_task.result()
            except asyncio.CancelledError:
                pass
            except Exception:
                logger.exception(
                    "Could not read screen share from participant %s",
                    participant.identity,
                )

        task.add_done_callback(on_capture_finished)

    def on_track_unsubscribed(
        track: rtc.RemoteTrack,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant,
    ) -> None:
        nonlocal latest_screen_track_sid
        if publication.source != rtc.TrackSource.SOURCE_SCREENSHARE:
            return

        screen_frames.pop(publication.sid, None)
        if latest_screen_track_sid == publication.sid:
            latest_screen_track_sid = next(reversed(screen_frames), None)
        task = screen_capture_tasks.pop(publication.sid, None)
        if task is not None:
            task.cancel()
        logger.info("Screen share ended for participant %s", participant.identity)

    ctx.room.on("track_subscribed", on_track_subscribed)
    ctx.room.on("track_unsubscribed", on_track_unsubscribed)
    for participant in ctx.room.remote_participants.values():
        for publication in participant.track_publications.values():
            if publication.track is not None:
                on_track_subscribed(
                    publication.track,
                    publication,
                    participant,
                )

    llm, llm_provider = create_llm()
    logger.info("Using %s for jury responses", llm_provider)

    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="en",
            api_key=DEEPGRAM_API_KEY,
        ),
        llm=llm,
        tts=deepgram.TTS(
            model="aura-2-andromeda-en",
            api_key=DEEPGRAM_API_KEY,
        ),
    )

    session.on(
        "user_input_transcribed",
        lambda event: logger.info(
            "Team speech transcribed (final=%s, characters=%d)",
            event.is_final,
            len(event.transcript),
        ),
    )
    session.on(
        "user_transcription_timeout",
        lambda event: logger.warning(
            "Speech was detected but produced no transcript (duration=%.2fs)",
            event.speech_duration,
        ),
    )
    session.on(
        "agent_state_changed",
        lambda event: logger.info(
            "Jury state changed: %s -> %s",
            event.old_state,
            event.new_state,
        ),
    )
    session.on(
        "error",
        lambda event: logger.error(
            "Voice pipeline error from %s: %s",
            type(event.source).__name__,
            event.error,
        ),
    )

    await session.start(
        room=ctx.room,
        agent=HackathonJury(get_latest_screen_frame),
        room_options=room_io.RoomOptions(
            audio_input=True,
            audio_output=True,
        ),
    )

    agent_room_io = session.room_io
    ctx.room.on(
        "active_speakers_changed",
        lambda speakers: listen_to_active_team_speaker(agent_room_io, speakers),
    )

    shutdown_event = asyncio.Event()

    async def on_shutdown(reason: str):
        logger.info("Jury session shutting down: %s", reason)
        ctx.room.off("track_subscribed", on_track_subscribed)
        ctx.room.off("track_unsubscribed", on_track_unsubscribed)
        for task in screen_capture_tasks.values():
            task.cancel()
        if screen_capture_tasks:
            await asyncio.gather(*screen_capture_tasks.values(), return_exceptions=True)
        shutdown_event.set()

    ctx.add_shutdown_callback(on_shutdown)

    welcome = (
        "Hello, team, and welcome. I am your AI hackathon jury member. "
        "Are you ready to present? Please share your screen, slides, or live demo. "
        "I will listen and talk with you about your project as you present."
    )
    speech = session.say(welcome, allow_interruptions=False)
    await speech
    if error := speech.exception():
        logger.exception("Could not play the jury welcome message", exc_info=error)
        raise error
    logger.info("Jury welcome message finished")
    await shutdown_event.wait()


if __name__ == "__main__":
    cli.run_app(server)
