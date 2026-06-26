import { chromium } from 'playwright-core';

import {
  ARTIFACTS_DIR,
  ensureArtifactsDir,
  getBaseUrl,
  getLaunchOptions,
  joinRoom,
  readRemoteAudioVolumes,
  setRangeByLabel,
  toggleTranslationEnabled,
} from './lib/helpers.mjs';

const ORIGINAL_VOLUME_LABEL = 'Original remote volume';
const ROOM_NAME = process.env.ROOM_NAME ?? `ui-harness-${Date.now()}`;

function assertVolume(actual, expected, step) {
  const audio = actual?.[0];
  if (!audio) {
    throw new Error(`${step}: expected remote audio element, got ${JSON.stringify(actual)}`);
  }
  if (audio.volume !== expected) {
    throw new Error(`${step}: expected volume ${expected}, got ${audio.volume}`);
  }
}

async function main() {
  ensureArtifactsDir();
  const baseUrl = getBaseUrl();
  const launchOptions = getLaunchOptions();

  if (!launchOptions.executablePath) {
    throw new Error(
      'No Chrome/Chromium executable found. Set CHROME_PATH or install Google Chrome.',
    );
  }

  const browser = await chromium.launch(launchOptions);
  const result = { room: ROOM_NAME, baseUrl, steps: {} };

  try {
    const speakerContext = await browser.newContext();
    const speakerPage = await speakerContext.newPage();
    await joinRoom(speakerPage, {
      baseUrl,
      roomName: ROOM_NAME,
      participantName: 'Speaker',
    });

    const listenerContext = await browser.newContext();
    const listenerPage = await listenerContext.newPage();
    await joinRoom(listenerPage, {
      baseUrl,
      roomName: ROOM_NAME,
      participantName: 'Listener',
    });

    await listenerPage.waitForSelector(`input[aria-label="${ORIGINAL_VOLUME_LABEL}"]`, {
      timeout: 30000,
    });
    await listenerPage.waitForTimeout(6000);

    result.steps.baseline = await readRemoteAudioVolumes(listenerPage);
    assertVolume(result.steps.baseline, 1, 'baseline');

    result.steps.sliderOff = await setRangeByLabel(listenerPage, ORIGINAL_VOLUME_LABEL, 30);
    await listenerPage.waitForTimeout(1500);
    result.steps.afterSliderTranslationOff = await readRemoteAudioVolumes(listenerPage);
    assertVolume(result.steps.afterSliderTranslationOff, 0.3, 'slider while translation off');

    result.steps.enableTranslation = await toggleTranslationEnabled(listenerPage);
    await listenerPage.waitForTimeout(4000);
    result.steps.afterEnableTranslation = await readRemoteAudioVolumes(listenerPage);
    assertVolume(result.steps.afterEnableTranslation, 0.15, 'auto-duck on enable');

    result.steps.sliderOn = await setRangeByLabel(listenerPage, ORIGINAL_VOLUME_LABEL, 60);
    await listenerPage.waitForTimeout(1500);
    result.steps.afterSliderTranslationOn = await readRemoteAudioVolumes(listenerPage);
    assertVolume(result.steps.afterSliderTranslationOn, 0.6, 'slider while translation on');

    await listenerPage.screenshot({
      path: `${ARTIFACTS_DIR}/translation-original-volume.png`,
      fullPage: true,
    });

    result.passed = true;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    result.passed = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

await main();
