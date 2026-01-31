// This file helps webpack resolve crypto correctly
// We export a function that returns the appropriate crypto module
module.exports = function getCrypto() {
  // Try to use the native crypto if available (for browsers that support it)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // For browser crypto, we still need crypto-browserify for Node.js APIs
    const crypto = require('crypto-browserify');
    addHkdfSync(crypto);
    return crypto;
  }
  
  // Use crypto-browserify with hkdfSync
  const crypto = require('crypto-browserify');
  addHkdfSync(crypto);
  return crypto;
};

function addHkdfSync(crypto) {
  if (typeof crypto.hkdfSync === 'undefined') {
    crypto.hkdfSync = function(ikm, salt, info, keylen, digest = 'sha256') {
      if (digest !== 'sha256') {
        throw new Error('Only SHA-256 is supported in this polyfill');
      }
      
      const ikmBuffer = Buffer.isBuffer(ikm) ? ikm : Buffer.from(ikm);
      const saltBuffer = salt ? (Buffer.isBuffer(salt) ? salt : Buffer.from(salt)) : Buffer.alloc(0);
      const infoBuffer = info ? (Buffer.isBuffer(info) ? info : Buffer.from(info)) : Buffer.alloc(0);
      
      // Extract: PRK = HMAC-Hash(salt, IKM)
      const hmac = crypto.createHmac('sha256', saltBuffer);
      hmac.update(ikmBuffer);
      const prk = hmac.digest();
      
      // Expand
      const n = Math.ceil(keylen / 32);
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
}
