
import {
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from '@livekit/agents';
import {
  EnhancerModel,
  audioEnhancement,
} from '@livekit/plugins-ai-coustics';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createAgent } from './agent.ts';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: 'assemblyai/universal-3-6-pro',
        language: 'en',
      }),
      keytermsOptions: {
        keyterms: ['LiveKit'],
        keytermDetection: { enabled: true },
      },
      tts: new inference.TTS({
        model: 'fishaudio/s2.1-pro',
        voice: 'fa4c9eb3dccc4806b382b40d61c6b10a',
      }),
      turnHandling: {
        turnDetection: new inference.TurnDetector(),
        preemptiveGeneration: { enabled: true },
      },
      expressive: true,
    });

    let discussionStarted = false;
    let discussionEnded = false;

    await session.start({
      agent: createAgent(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: audioEnhancement({
          model: EnhancerModel.QuailVfS,
        }),
      },
    });

    await ctx.connect();

    const announce = async (text: string) => {
      console.log('[JURY BOT] Attempting to speak:', text);

      try {
        await session.say(text, {
          allowInterruptions: false,
        });
        console.log('[JURY BOT] Speech request completed.');
      } catch (error) {
        console.error('[JURY BOT] Speech failed:', error);
        throw error;
      }
    };

    const endDiscussion = async () => {
      if (!discussionStarted || discussionEnded) return;

      discussionEnded = true;

      await announce(
        'Thank you for presenting your hackathon project and answering my questions. I appreciate your time and effort. The evaluation session has now ended.',
      );

      console.log('[JURY BOT] Evaluation ended.');
    };

    ctx.room.on('dataReceived', (payload, participant) => {
      if (!participant) {
        console.warn(
          '[JURY BOT] Ignoring control message without a participant sender.',
        );
        return;
      }

      let message: { type?: string };

      try {
        message = JSON.parse(
          new TextDecoder().decode(payload),
        );
      } catch {
        console.warn('[JURY BOT] Ignoring invalid control message.');
        return;
      }

      if (
        message.type !== 'GD_START' &&
        message.type !== 'GD_END'
      ) {
        return;
      }

      let roomState: {
        hostIdentity?: string;
        status?: string;
      };

      try {
        roomState = ctx.room.metadata
          ? JSON.parse(ctx.room.metadata)
          : {};
      } catch {
        console.error(
          '[JURY BOT] Could not read room metadata.',
        );
        return;
      }

      if (
        !roomState.hostIdentity ||
        participant.identity !== roomState.hostIdentity
      ) {
        console.warn(
          `[JURY BOT] Ignoring ${message.type} from unauthorized participant: ${participant.identity}`,
        );
        return;
      }

      if (message.type === 'GD_START') {
        if (
          discussionStarted ||
          roomState.status !== 'running'
        ) {
          console.warn(
            '[JURY BOT] Start ignored. Evaluation already started or room status is not running.',
          );
          return;
        }

        discussionStarted = true;

        void announce(
          'Hello everyone! Welcome to your hackathon project evaluation. I will be your AI jury member today. Please introduce your team and briefly explain the problem your project solves. Then share your screen and open your project presentation. Let me know when you are ready.',
        ).catch((error) => {
          console.error(
            '[JURY BOT] Could not start announcement:',
            error,
          );
        });

        return;
      }

      if (message.type === 'GD_END') {
        void endDiscussion().catch((error) => {
          console.error(
            '[JURY BOT] Could not end evaluation:',
            error,
          );
        });
      }
    });

    console.log(
      `[JURY BOT] Ready and listening for control messages in room: ${ctx.room.name}`,
    );
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'gd-speaking-bot',
  }),
);
