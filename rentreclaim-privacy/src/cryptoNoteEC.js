// ECDH sealed memo using NaCl (X25519 + XSalsa20-Poly1305)
import nacl from "tweetnacl";
import * as ed2curve from "ed2curve";
import bs58 from "bs58";

const te = new TextEncoder();
const td = new TextDecoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/**
 * Encrypts a note for a Solana recipient (base58 Ed25519 pubkey / wallet address).
 * Returns a compact JSON string for the Memo.
 */
export function encryptForRecipient(note, recipientBase58) {
  const ed25519Pub = bs58.decode(recipientBase58);
  const x25519Pub = ed2curve.convertPublicKey(ed25519Pub);
  if (!x25519Pub) throw new Error("Could not convert recipient key to X25519");

  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(24);
  const shared = nacl.box.before(x25519Pub, eph.secretKey);
  const ct = nacl.box.after(te.encode(note), nonce, shared);

  return JSON.stringify({
    v: 2,
    alg: "nacl-sealed-x25519",
    ek: b64(eph.publicKey),
    n: b64(nonce),
    c: b64(ct),
  });
}

/**
 * Decrypt helper (for CLI / offline): given payload JSON and the recipient's
 * Ed25519 secret key (Uint8Array 32 or 64 bytes), return plaintext.
 */
export function decryptWithEd25519Secret(payloadJson, ed25519Secret) {
  const obj = JSON.parse(payloadJson);
  if (obj.v !== 2 || obj.alg !== "nacl-sealed-x25519")
    throw new Error("Unsupported payload");

  let sk = ed25519Secret;
  if (sk.length === 64) sk = sk.slice(0, 32);
  if (sk.length !== 32) throw new Error("Bad Ed25519 secret length");

  const x25519Secret = ed2curve.convertSecretKey(sk);
  if (!x25519Secret) throw new Error("Could not convert secret key to X25519");

  const ephPub = fromB64(obj.ek);
  const nonce = fromB64(obj.n);
  const ct = fromB64(obj.c);

  const shared = nacl.box.before(ephPub, x25519Secret);
  const pt = nacl.box.open.after(ct, nonce, shared);
  if (!pt) throw new Error("Decryption failed");
  return td.decode(pt);
}
