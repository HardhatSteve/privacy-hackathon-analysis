export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export const randBetween = (a, b) => Math.floor(a + Math.random() * (b - a));

const decoyMints = [
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "So11111111111111111111111111111111111111112",   // wSOL
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // mSOL
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"   // JUP
];

export async function decoyReadBurst(connection) {
  const mint = decoyMints[Math.floor(Math.random() * decoyMints.length)];
  try {
    await connection.getAccountInfo(new (await import("@solana/web3.js")).PublicKey(mint));
  } catch (e) {}
  await sleep(randBetween(100, 400));
}
