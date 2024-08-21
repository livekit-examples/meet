import { VideoCodec } from 'livekit-client';

export function validateVideoCodec(codec: string | undefined | null): VideoCodec | undefined {
  if (codec === 'vp8' || codec === 'vp9' || codec === 'h264' || codec === 'av1') {
    return codec;
  } else if (codec === undefined || codec === null) {
    return undefined;
  } else {
    console.warn(`Invalid codec: Got ${codec} but expected 'vp8', 'vp9', 'h264' or 'av1'.`);
    return undefined;
  }
}

export function isVideoCodec(codec: string): codec is VideoCodec {
  return ['vp8', 'vp9', 'h264', 'av1'].includes(codec);
}
