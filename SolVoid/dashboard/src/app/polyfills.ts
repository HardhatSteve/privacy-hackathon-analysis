import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;

    // Monkey-patch Buffer.isBuffer to be more permissive for bs58/base-x compatibility
    const oldIsBuffer = Buffer.isBuffer;
    Buffer.isBuffer = (obj: any): obj is Buffer => {
        return oldIsBuffer(obj) || obj instanceof Uint8Array || (obj && obj.constructor && obj.constructor.name === 'Buffer');
    };

    (window as any).global = window;
    (window as any).process = {
        env: { NODE_ENV: process.env.NODE_ENV },
        version: '',
        nextTick: (cb: any) => setTimeout(cb, 0),
        browser: true,
    };
}
