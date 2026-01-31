/// <reference types="vite/client" />

import type { Buffer as BufferType } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof BufferType;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
