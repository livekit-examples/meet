import { deepgram } from '@/lib/deepgram/client';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type StoredUtterance = { speaker: string; start: number; end: number; text: string };
const safeName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

function formatTranscript(utterances: StoredUtterance[]) {
  const ordered = utterances.sort((a, b) => a.start - b.start);
  const paragraphs: string[] = [];
  let current: StoredUtterance[] = [];
  for (const utterance of ordered) {
    const previous =  current[current.length - 1];
    if (!previous || previous.speaker === utterance.speaker && utterance.start - previous.end < 2) {
      current.push(utterance);
    } else {
      paragraphs.push(`${current[0].speaker}: ${current.map((item) => item.text).join(' ')}`);
      current = [utterance];
    }
  }
  if (current.length) paragraphs.push(`${current[0].speaker}: ${current.map((item) => item.text).join(' ')}`);
  return paragraphs.join('\n\n') || '[No speech detected.]';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const roomName = formData.get('roomName');
    const speakerName = formData.get('speakerName');
    const startedAt = Number(formData.get('startedAt'));
    const audio = formData.get('audio');
    if (typeof roomName !== 'string' || !(audio instanceof File)) {
      return NextResponse.json({ error: 'roomName and audio are required.' }, { status: 400 });
    }

    const result = await deepgram.listen.v1.media.transcribeFile(
      { data: Buffer.from(await audio.arrayBuffer()), filename: audio.name || 'meeting.webm', contentType: audio.type || 'audio/webm' },
      { model: 'nova-3', language: 'en', smart_format: true, punctuate: true, paragraphs: true, utterances: true },
    );
    const baseTime = Number.isFinite(startedAt) ? startedAt : Date.now();
    const speaker = typeof speakerName === 'string' && speakerName.trim() ? speakerName.trim() : 'Participant';
    const newUtterances: StoredUtterance[] = 'results' in result
      ? ((result.results.utterances ?? []) as Array<{
    transcript?: string | null;
    start?: number | null;
    end?: number | null;
  }>).flatMap((utterance) => {
          const text = utterance.transcript?.trim();
          return text ? [{ speaker, start: baseTime + (utterance.start ?? 0) * 1000, end: baseTime + (utterance.end ?? 0) * 1000, text }] : [];
        })
      : [];

    const root = path.join(process.cwd(), 'transcripts');
    const dataRoot = path.join(process.cwd(), '.transcript-data');
    const room = safeName(roomName);
    await Promise.all([mkdir(root, { recursive: true }), mkdir(dataRoot, { recursive: true })]);
    const dataFile = path.join(dataRoot, `${room}.json`);
    let existing: StoredUtterance[] = [];
    try { existing = JSON.parse(await readFile(dataFile, 'utf8')); } catch { /* first speaker to leave */ }
    const utterances = [...existing, ...newUtterances];
    await writeFile(dataFile, JSON.stringify(utterances), 'utf8');
    const filename = `${room}.txt`;
    await writeFile(path.join(root, filename), formatTranscript(utterances), 'utf8');
    console.info(`[Transcript] Updated ${filename} with ${newUtterances.length} utterances from ${speaker}.`);
    return NextResponse.json({ filename });
  } catch (error) {
    console.error('Failed to create meeting transcript:', error);
    return NextResponse.json({ error: 'Failed to transcribe the meeting.' }, { status: 500 });
  }
}
