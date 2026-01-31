// Crypto polyfill that includes hkdfSync
// This extends crypto-browserify without breaking curve operations
// CRITICAL: @noble packages don't import Node's 'crypto' module
// They use their own crypto implementations, so this won't affect them
const crypto = require('crypto-browserify');
const Buffer = require('buffer').Buffer;

// Always add hkdfSync - crypto-browserify doesn't have it
if (typeof crypto.hkdfSync === 'undefined') {
  crypto.hkdfSync = function(ikm, salt, info, keylen, digest) {
    if (digest && digest !== 'sha256') {
      throw new Error('Only SHA-256 is supported in this polyfill');
    }
    
    // Ensure inputs are Buffers
    const ikmBuffer = Buffer.isBuffer(ikm) ? ikm : Buffer.from(ikm);
    const saltBuffer = salt ? (Buffer.isBuffer(salt) ? salt : Buffer.from(salt)) : Buffer.alloc(0);
    const infoBuffer = info ? (Buffer.isBuffer(info) ? info : Buffer.from(info)) : Buffer.alloc(0);
    
    // Extract phase: PRK = HMAC-Hash(salt, IKM)
    const hmac = crypto.createHmac('sha256', saltBuffer);
    hmac.update(ikmBuffer);
    const prk = hmac.digest(); // Pseudo-Random Key
    
    // Expand phase
    const n = Math.ceil(keylen / 32); // SHA-256 produces 32-byte outputs
    const okm = Buffer.alloc(keylen);
    let t = Buffer.alloc(0);
    
    for (let i = 0; i < n; i++) {
      const hmac2 = crypto.createHmac('sha256', prk);
      hmac2.update(t);
      hmac2.update(infoBuffer);
      hmac2.update(Buffer.from([i + 1]));
      t = hmac2.digest();
      const start = i * 32;
      const end = Math.min(start + 32, keylen);
      t.copy(okm, start, 0, end - start);
    }
    
    return okm;
  };
}

// Export for CommonJS
module.exports = crypto;

// Also support ES module exports for webpack
if (typeof module.exports.default === 'undefined') {
  module.exports.default = crypto;
}
