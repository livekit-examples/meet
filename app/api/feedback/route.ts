

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Utterance = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

type Scores = {
  communication: number;
  collaboration: number;
  relevance: number;
  clarity: number;
};

type CandidateFeedback = {
  name: string;
  overallScore: number;
  scores: Scores;
  strengths: string[];
  improvements: string[];
  feedback: string;
};

type Feedback = {
  meetingSummary: string;
  candidates: CandidateFeedback[];
};

type SavedFeedback = Feedback & {
  roomName: string;
  generatedAt: string;
  transcriptHash: string;
  rubricVersion: number;
};

const RUBRIC_VERSION = 1;

const safeName = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

function feedbackAsText(feedback: Feedback) {
  return [
    'GROUP DISCUSSION FEEDBACK REPORT',
    '',
    `Discussion summary: ${feedback.meetingSummary}`,
    '',
    ...feedback.candidates.map((candidate) =>
      [
        `Candidate: ${candidate.name}`,
        `Overall score: ${candidate.overallScore}/100`,
        `Scores: Communication ${candidate.scores.communication}/25 | Collaboration ${candidate.scores.collaboration}/25 | Relevance ${candidate.scores.relevance}/25 | Clarity ${candidate.scores.clarity}/25`,
        `Feedback: ${candidate.feedback}`,
        `Strengths: ${candidate.strengths.join('; ') || 'Not enough evidence'}`,
        `Improvements: ${candidate.improvements.join('; ') || 'Not enough evidence'}`,
      ].join('\n'),
    ),
  ].join('\n');
}

function isValidCategoryScore(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 25
  );
}

function validateAndNormalizeFeedback(value: unknown): Feedback {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid feedback response.');
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.meetingSummary !== 'string' ||
    !Array.isArray(data.candidates)
  ) {
    throw new Error('Missing summary or candidate reports.');
  }

  const candidates: CandidateFeedback[] = data.candidates.map(
    (item: unknown) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid candidate report.');
      }

      const candidate = item as Record<string, unknown>;
      const scores = candidate.scores as Record<string, unknown> | undefined;

      if (
        typeof candidate.name !== 'string' ||
        !candidate.name.trim() ||
        !scores ||
        !isValidCategoryScore(scores.communication) ||
        !isValidCategoryScore(scores.collaboration) ||
        !isValidCategoryScore(scores.relevance) ||
        !isValidCategoryScore(scores.clarity) ||
        !Array.isArray(candidate.strengths) ||
        !candidate.strengths.every((x) => typeof x === 'string') ||
        !Array.isArray(candidate.improvements) ||
        !candidate.improvements.every((x) => typeof x === 'string') ||
        typeof candidate.feedback !== 'string'
      ) {
        throw new Error(`Invalid scores or fields for ${candidate.name || 'candidate'}.`);
      }

      const normalizedScores: Scores = {
        communication: scores.communication,
        collaboration: scores.collaboration,
        relevance: scores.relevance,
        clarity: scores.clarity,
      };

      // The server calculates the total; the LLM cannot choose it.
      const overallScore =
        normalizedScores.communication +
        normalizedScores.collaboration +
        normalizedScores.relevance +
        normalizedScores.clarity;

      return {
        name: candidate.name.trim(),
        overallScore,
        scores: normalizedScores,
        strengths: candidate.strengths,
        improvements: candidate.improvements,
        feedback: candidate.feedback,
      };
    },
  );

  const names = candidates.map((c) => c.name.toLowerCase());

  if (new Set(names).size !== names.length) {
    throw new Error('Duplicate candidate names in feedback response.');
  }

  return {
    meetingSummary: data.meetingSummary,
    candidates,
  };
}

export async function GET(request: NextRequest) {
  const roomName = new URL(request.url).searchParams.get('roomName');

  if (!roomName) {
    return NextResponse.json(
      { error: 'roomName is required.' },
      { status: 400 },
    );
  }

  try {
    const file = path.join(
      process.cwd(),
      '.feedback-data',
      `${safeName(roomName)}.json`,
    );

    return NextResponse.json(JSON.parse(await readFile(file, 'utf8')));
  } catch {
    return NextResponse.json(
      { error: 'No saved feedback report exists for this meeting.' },
      { status: 404 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomName, forceRegenerate = false } = body;

    if (typeof roomName !== 'string' || !roomName.trim()) {
      return NextResponse.json(
        { error: 'roomName is required.' },
        { status: 400 },
      );
    }

    if (typeof forceRegenerate !== 'boolean') {
      return NextResponse.json(
        { error: 'forceRegenerate must be a boolean.' },
        { status: 400 },
      );
    }

    const room = safeName(roomName);

    const transcriptFile = path.join(
      process.cwd(),
      '.transcript-data',
      `${room}.json`,
    );

    const rawTranscript = await readFile(transcriptFile, 'utf8');
    const utterances = JSON.parse(rawTranscript) as Utterance[];

    if (
      !Array.isArray(utterances) ||
      utterances.length === 0 ||
      !utterances.every(
        (u) =>
          typeof u.speaker === 'string' &&
          typeof u.text === 'string' &&
          typeof u.start === 'number' &&
          typeof u.end === 'number',
      )
    ) {
      return NextResponse.json(
        { error: 'No valid speech was found in this meeting.' },
        { status: 404 },
      );
    }

    const ordered = [...utterances].sort(
      (a, b) => a.start - b.start,
    );

    const transcript = ordered
      .map((item) => `${item.speaker}: ${item.text}`)
      .join('\n');

    const transcriptHash = createHash('sha256')
      .update(JSON.stringify(ordered))
      .digest('hex');

    const feedbackDataRoot = path.join(
      process.cwd(),
      '.feedback-data',
    );
    const reportRoot = path.join(
      process.cwd(),
      'feedback-reports',
    );
    const savedFile = path.join(
      feedbackDataRoot,
      `${room}.json`,
    );

    // Reuse the report if the transcript and rubric are unchanged.
    if (!forceRegenerate) {
      try {
        const saved = JSON.parse(
          await readFile(savedFile, 'utf8'),
        ) as SavedFeedback;

        if (
          saved.transcriptHash === transcriptHash &&
          saved.rubricVersion === RUBRIC_VERSION
        ) {
          return NextResponse.json({
            ...saved,
            reused: true,
          });
        }
      } catch {
        // No compatible saved report; generate one below.
      }
    }

    const prompt = `You are a group-discussion feedback assistant.

Evaluate only the supplied transcript. Do not infer personality,
protected traits, or job suitability. Do not make hiring decisions.

Use these fixed rubric categories, each scored from 0 to 25:

Communication:
0-5: Very limited understandable contribution.
6-10: Often difficult to follow.
11-15: Generally understandable, with some issues.
16-20: Clear and effective expression.
21-25: Consistently clear, well-articulated contributions.

Collaboration:
0-5: Little evidence of constructive participation.
6-10: Limited engagement with others' ideas.
11-15: Some engagement with the discussion.
16-20: Builds on others' points and participates constructively.
21-25: Consistently helps develop a balanced discussion.

Relevance:
0-5: Contributions are mostly unrelated to the topic.
6-10: Frequent tangents or weak topic connections.
11-15: Generally relevant, with some digressions.
16-20: Relevant contributions supported by explanations.
21-25: Consistently focused and substantively relevant.

Clarity:
0-5: Meaning is usually unclear.
6-10: Ideas are often poorly organized.
11-15: Meaning is mostly understandable.
16-20: Ideas are logically organized.
21-25: Ideas are consistently precise and well structured.

Use only evidence present in the transcript. Do not penalize a
candidate for a lack of speaking time alone. Do not treat a
reasonable opinion as factually wrong merely because it is an opinion.
If evidence is insufficient, reflect that limitation in the feedback.

For every speaker, provide:
- communication, collaboration, relevance and clarity scores
- strengths and improvements
- constructive feedback explaining the scores

Return only valid JSON in this format:
{
  "meetingSummary": "short discussion summary",
  "candidates": [
    {
      "name": "speaker name exactly as in transcript",
      "overallScore": 0,
      "scores": {
        "communication": 0,
        "collaboration": 0,
        "relevance": 0,
        "clarity": 0
      },
      "strengths": ["specific evidence-based strength"],
      "improvements": ["specific actionable improvement"],
      "feedback": "evidence-based constructive feedback"
    }
  ]
}

The server will calculate overallScore as the sum of the four
category scores. Score consistently using this rubric.

Transcript:
${transcript}`;

    const ollamaResponse = await fetch(
      'http://127.0.0.1:11434/api/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0 },
        }),
      },
    );

    if (!ollamaResponse.ok) {
      console.error(
        'Ollama feedback request failed:',
        await ollamaResponse.text(),
      );

      return NextResponse.json(
        { error: 'Ollama could not generate feedback. Make sure Ollama is running.' },
        { status: 502 },
      );
    }

    const result = (await ollamaResponse.json()) as {
      response?: string;
    };

    if (!result.response) {
      throw new Error('Ollama returned no feedback text.');
    }

    const feedback = validateAndNormalizeFeedback(
      JSON.parse(result.response),
    );

    const savedFeedback: SavedFeedback = {
      ...feedback,
      roomName,
      generatedAt: new Date().toISOString(),
      transcriptHash,
      rubricVersion: RUBRIC_VERSION,
    };

    await Promise.all([
      mkdir(feedbackDataRoot, { recursive: true }),
      mkdir(reportRoot, { recursive: true }),
    ]);

    await Promise.all([
      writeFile(
        savedFile,
        JSON.stringify(savedFeedback, null, 2),
        'utf8',
      ),
      writeFile(
        path.join(reportRoot, `${room}-feedback.txt`),
        feedbackAsText(feedback),
        'utf8',
      ),
    ]);

    return NextResponse.json({
      ...savedFeedback,
      reused: false,
    });
  } catch (error) {
    console.error('Failed to generate feedback:', error);

    return NextResponse.json(
      { error: 'Could not generate feedback for this meeting.' },
      { status: 500 },
    );
  }
}
