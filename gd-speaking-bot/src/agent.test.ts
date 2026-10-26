// Agent behavior is covered by the simulations in scenarios.yaml, which run full
// conversations against the agent on LiveKit Cloud (see README.md). The eval
// below is kept as an example of the in-process testing framework
// (https://docs.livekit.io/agents/start/testing/) for turn-level checks that
// don't need a live session. Uncomment it and run `pnpm test` to use it.
//
// import { dedent, inference, initializeLogger, voice } from '@livekit/agents';
// import dotenv from 'dotenv';
// import { afterEach, beforeEach, describe, it } from 'vitest';
// import { createAgent } from './agent.ts';
//
// dotenv.config({ path: '.env.local' });
//
// // Initialize logger for testing.
// // You may wish to adjust the log level to print more or less information during test runs.
// initializeLogger({ pretty: true, level: 'warn' });
//
// describe('agent evaluation', () => {
//   let session: voice.AgentSession;
//   let judgeLlm: inference.LLM;
//
//   beforeEach(async () => {
//     judgeLlm = new inference.LLM({ model: 'openai/gpt-4.1-mini' });
//     session = new voice.AgentSession();
//     await session.start({ agent: createAgent() });
//   });
//
//   afterEach(async () => {
//     await session?.close();
//     await judgeLlm?.aclose();
//   });
//
//   /** Evaluation of the agent's friendly nature. */
//   it('offers assistance', { timeout: 30000 }, async () => {
//     // Run an agent turn following the user's greeting
//     const result = await session.run({ userInput: 'Hello' }).wait();
//
//     // Evaluate the agent's response for friendliness
//     await result.expect
//       .nextEvent()
//       .isMessage({ role: 'assistant' })
//       .judge(judgeLlm, {
//         intent: dedent`
//           Greets the user in a friendly manner.
//
//           Optional context that may or may not be included:
//           - Offer of assistance with any request the user may have
//           - Other small talk or chit chat is acceptable, so long as it is friendly and not too intrusive
//         `,
//       });
//
//     // Assert that there are no unexpected further events
//     result.expect.noMoreEvents();
//   });
// });
