import { describe, expect, it } from 'vitest';

import {
  buildSessionUpdate,
  buildTranslationClientSecretRequest,
  normalizeTranslationLanguage,
} from './realtime-translation-config';

describe('normalizeTranslationLanguage', () => {
  it('accepts supported languages', () => {
    expect(normalizeTranslationLanguage('es')).toBe('es');
    expect(normalizeTranslationLanguage(' EN ')).toBe('en');
  });

  it('rejects unsupported languages', () => {
    expect(() => normalizeTranslationLanguage('xx')).toThrow('Unsupported translation language');
  });

  it('rejects invalid language codes', () => {
    expect(() => normalizeTranslationLanguage('')).toThrow('A translation language is required');
    expect(() => normalizeTranslationLanguage('not-a-lang')).toThrow(
      'Invalid translation language',
    );
  });
});

describe('buildSessionUpdate', () => {
  it('includes output language and optional input features', () => {
    const update = buildSessionUpdate({
      language: 'fr',
      inputTranscriptionEnabled: true,
      noiseReductionEnabled: true,
    });

    expect(update.type).toBe('session.update');
    expect(update.session.audio.output.language).toBe('fr');
    expect(update.session.audio.input.transcription).toEqual({
      model: 'gpt-realtime-whisper',
    });
    expect(update.session.audio.input.noise_reduction).toEqual({ type: 'near_field' });
  });

  it('omits transcription when disabled', () => {
    const update = buildSessionUpdate({
      language: 'de',
      inputTranscriptionEnabled: false,
      noiseReductionEnabled: false,
    });

    expect(update.session.audio.input.transcription).toBeUndefined();
    expect(update.session.audio.input.noise_reduction).toBeNull();
  });
});

describe('buildTranslationClientSecretRequest', () => {
  it('requires an API key', () => {
    expect(() =>
      buildTranslationClientSecretRequest({
        apiKey: '',
        language: 'es',
        inputTranscriptionEnabled: false,
        noiseReductionEnabled: false,
      }),
    ).toThrow('OPENAI_API_KEY is required');
  });

  it('builds the client secret request payload', () => {
    const request = buildTranslationClientSecretRequest({
      apiKey: 'test-key',
      language: 'ja',
      inputTranscriptionEnabled: true,
      noiseReductionEnabled: false,
    });

    expect(request.url).toBe('https://api.openai.com/v1/realtime/translations/client_secrets');
    expect(request.init.method).toBe('POST');
    expect(request.init.headers).toMatchObject({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(request.init.body as string) as {
      session: { model: string; audio: { output: { language: string } } };
    };
    expect(body.session.model).toBe('gpt-realtime-translate');
    expect(body.session.audio.output.language).toBe('ja');
  });
});
