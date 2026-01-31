import {
  RPCClient,
  collectWalletData,
  normalizeWalletData,
  generateReport,
  createDefaultLabelProvider,
} from 'solana-privacy-scanner-core';

const wallet = 'CG2j5yV6XokVsDBgGdgxUSi6jSAq6oq8J83LPivwJwwb';

const client = new RPCClient();
const rawData = await collectWalletData(client, wallet);
const context = normalizeWalletData(rawData, createDefaultLabelProvider());
const report = generateReport(context);

console.log(JSON.stringify(report, null, 2));