import { accessSync, constants, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const HARNESS_ROOT = join(__dirname, '..');
export const ARTIFACTS_DIR = join(HARNESS_ROOT, 'artifacts');

export function ensureArtifactsDir() {
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

export function resolveChromeExecutable() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  return undefined;
}

export function getBaseUrl() {
  return process.env.BASE_URL ?? 'http://127.0.0.1:3000';
}

export function getLaunchOptions() {
  return {
    executablePath: resolveChromeExecutable(),
    headless: process.env.HEADLESS !== 'false',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--no-sandbox',
    ],
  };
}

export async function joinRoom(page, { baseUrl, roomName, participantName }) {
  await page.goto(`${baseUrl}/rooms/${encodeURIComponent(roomName)}`, {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForTimeout(1500);

  const nameInput = page.locator('input[type="text"]').first();
  if (await nameInput.count()) {
    await nameInput.fill(participantName);
  }

  await page.getByRole('button', { name: /join/i }).first().click();
}

export async function readRemoteAudioVolumes(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('audio')).map((audio) => ({
      muted: audio.muted,
      volume: Number(audio.volume.toFixed(3)),
      hasSrc: !!audio.srcObject,
    })),
  );
}

export async function setRangeByLabel(page, label, value) {
  return page.evaluate(
    ([ariaLabel, nextValue]) => {
      const input = document.querySelector(`input[aria-label="${ariaLabel}"]`);
      if (!input) {
        return 'NO_SLIDER';
      }

      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      ).set;
      setter.call(input, String(nextValue));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return input.value;
    },
    [label, value],
  );
}

export async function toggleTranslationEnabled(page) {
  return page.evaluate(() => {
    const label = [...document.querySelectorAll('span')].find(
      (element) => element.textContent.trim() === 'Enable translation',
    );
    const checkbox = label?.parentElement?.querySelector('input[type=checkbox]');
    if (!checkbox) {
      return 'NO_CHECKBOX';
    }
    if (!checkbox.checked) {
      checkbox.click();
    }
    return checkbox.checked;
  });
}
