// just for demonstration purposes, extremely insecure

import { BaseKeyProvider, createKeyMaterialFromString } from 'livekit-client';

export class DummyKeyProvider extends BaseKeyProvider {
  readonly participantKeys = new Map([
    ['dev1', 'dev1key'],
    ['dev2', 'dev2key'],
  ]);

  async setKey(participantId: string) {
    // @ts-ignore
    const cryptoKey = await createKeyMaterialFromString(this.participantKeys.get(participantId));
    this.onSetEncryptionKey(cryptoKey, participantId);
  }
}
