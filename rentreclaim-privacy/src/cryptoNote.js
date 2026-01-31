// Minimal note encryption for Solana memo payloads (no deps)
// AES-GCM (256) + PBKDF2(SHA-256). Keep notes short (<200 chars).
const te = new TextEncoder();
const td = new TextDecoder();

function b64encode(u8) {
  let bin = "";
  u8.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

function b64decode(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase, salt, iterations = 150_000) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    te.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypts small text. Returns compact JSON string. */
export async function encryptNote(plaintext, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ctBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    te.encode(plaintext)
  );
  const ct = new Uint8Array(ctBuf);
  const payload = {
    v: 1,
    i: 150000,
    s: b64encode(salt),
    n: b64encode(iv),
    c: b64encode(ct),
  };
  return JSON.stringify(payload);
}

/** Decrypts a payload produced by encryptNote. */
export async function decryptNote(payload, passphrase) {
  const obj = JSON.parse(payload);
  if (obj.v !== 1) throw new Error("Unsupported note version");
  const salt = b64decode(obj.s);
  const iv = b64decode(obj.n);
  const ct = b64decode(obj.c);
  const key = await deriveKey(passphrase, salt, obj.i || 150000);
  const ptBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  return td.decode(ptBuf);
}
