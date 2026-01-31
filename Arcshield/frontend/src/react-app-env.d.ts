/// <reference types="react-scripts" />

declare module '@arcium-hq/client' {
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

declare module '@noble/curves/x25519' {
  export const x25519: {
    utils: {
      randomPrivateKey(): Uint8Array;
    };
    getPublicKey(privateKey: Uint8Array): Uint8Array;
    getSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
  };
}

declare module 'numeral' {
  interface Numeral {
    format(format?: string): string;
    value(): number | null;
  }
  function numeral(value: number | string | null | undefined): Numeral;
  export = numeral;
}

declare module '@arcium-hq/reader' {
  // Add reader types if needed
}
