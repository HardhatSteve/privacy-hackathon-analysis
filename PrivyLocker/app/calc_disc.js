const crypto = require('crypto');

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest();
}

const discriminator = sha256("global:allow").slice(0, 8);
console.log("Discriminator:", discriminator.toString('hex'));
console.log("Discriminator Array:", Array.from(discriminator));
