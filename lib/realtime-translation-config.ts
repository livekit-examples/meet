export const DEFAULT_TRANSLATION_MODEL = 'gpt-realtime-translate';
export const DEFAULT_INPUT_TRANSCRIPTION_MODEL = 'gpt-realtime-whisper';
export const REALTIME_TRANSLATION_CLIENT_SECRET_URL =
  'https://api.openai.com/v1/realtime/translations/client_secrets';
export const REALTIME_TRANSLATION_CALL_URL =
  'https://api.openai.com/v1/realtime/translations/calls';

export type TranslationLanguage = {
  value: string;
  label: string;
};

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'de', label: 'German' },
  { value: 'ko', label: 'Korean' },
  { value: 'hi', label: 'Hindi' },
  { value: 'id', label: 'Indonesian' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'it', label: 'Italian' },
  { value: 'en', label: 'English' },
];

const SUPPORTED_LANGUAGES = new Set(TRANSLATION_LANGUAGES.map((language) => language.value));
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/;

export function normalizeTranslationLanguage(language: string): string {
  if (typeof language !== 'string' || !language.trim()) {
    throw new Error('A translation language is required');
  }

  const normalized = language.trim().toLowerCase();
  if (!LANGUAGE_PATTERN.test(normalized)) {
    throw new Error('Invalid translation language');
  }
  if (!SUPPORTED_LANGUAGES.has(normalized)) {
    throw new Error('Unsupported translation language');
  }

  return normalized;
}

type BuildTranslationSessionConfigOptions = {
  language: string;
  inputTranscriptionEnabled: boolean;
  noiseReductionEnabled: boolean;
  model?: string;
};

type AudioInputConfig = {
  transcription?: { model: string };
  noise_reduction: { type: 'near_field' } | null;
};

export function buildTranslationSessionConfig({
  language,
  inputTranscriptionEnabled,
  noiseReductionEnabled,
  model = DEFAULT_TRANSLATION_MODEL,
}: BuildTranslationSessionConfigOptions) {
  return {
    model,
    audio: {
      input: buildAudioInputConfig({
        inputTranscriptionEnabled,
        noiseReductionEnabled,
      }),
      output: {
        language: normalizeTranslationLanguage(language),
      },
    },
  };
}

export function buildSessionUpdate({
  language,
  inputTranscriptionEnabled,
  noiseReductionEnabled,
}: Omit<BuildTranslationSessionConfigOptions, 'model'>) {
  const session = buildTranslationSessionConfig({
    language,
    inputTranscriptionEnabled,
    noiseReductionEnabled,
  });
  const { model: _model, ...sessionWithoutModel } = session;

  return {
    type: 'session.update' as const,
    session: sessionWithoutModel,
  };
}

export function buildTranslationClientSecretRequest({
  apiKey,
  language,
  inputTranscriptionEnabled,
  noiseReductionEnabled,
  model = DEFAULT_TRANSLATION_MODEL,
}: BuildTranslationSessionConfigOptions & { apiKey: string }) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  return {
    url: REALTIME_TRANSLATION_CLIENT_SECRET_URL,
    init: {
      method: 'POST' as const,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: buildTranslationSessionConfig({
          language,
          inputTranscriptionEnabled,
          noiseReductionEnabled,
          model,
        }),
      }),
    },
  };
}

function buildAudioInputConfig({
  inputTranscriptionEnabled,
  noiseReductionEnabled,
}: Pick<
  BuildTranslationSessionConfigOptions,
  'inputTranscriptionEnabled' | 'noiseReductionEnabled'
>): AudioInputConfig {
  return {
    ...(inputTranscriptionEnabled && {
      transcription: {
        model: DEFAULT_INPUT_TRANSCRIPTION_MODEL,
      },
    }),
    noise_reduction: noiseReductionEnabled ? { type: 'near_field' as const } : null,
  };
}
