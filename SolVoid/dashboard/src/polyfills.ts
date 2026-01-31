import { Buffer } from 'buffer'

// Force Buffer polyfill for Anchor in browser
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}

// Ensure Buffer.isBuffer works correctly
if (globalThis.Buffer && !globalThis.Buffer.isBuffer) {
  globalThis.Buffer.isBuffer = (obj: any): obj is Buffer => {
    return obj && obj.constructor === Buffer;
  };
}
