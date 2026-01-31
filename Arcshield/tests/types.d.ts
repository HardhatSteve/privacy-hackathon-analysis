/// <reference types="mocha" />

declare module '@arcium-hq/client' {
  import { Connection } from '@solana/web3.js';

  export class RescueCipher {
    constructor(sharedSecret: Uint8Array);
    encrypt(data: Uint8Array[]): { encrypted: Uint8Array[]; nonce: Uint8Array };
    decrypt(encrypted: Uint8Array[], nonce: Uint8Array): Uint8Array[];
  }

  export const x25519: {
    utils: {
      randomPrivateKey(): Uint8Array;
    };
    getPublicKey(privateKey: Uint8Array): Uint8Array;
    getSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
  };
}
