import { Connection, clusterApiUrl } from '@solana/web3.js';
import config from '../config/index.js';
import logger from './logger.js';

let connection = null;

export function getConnection() {
  if (!connection) {
    const rpcUrl = config.solana.rpcUrl || clusterApiUrl(config.solana.cluster);
    
    connection = new Connection(rpcUrl, {
      commitment: config.solana.commitment,
      confirmTransactionInitialTimeout: 60000
    });

    logger.info('Solana connection initialized', {
      cluster: config.solana.cluster,
      rpcUrl: rpcUrl.substring(0, 50) + '...'
    });
  }

  return connection;
}

export async function getBalance(publicKey) {
  const conn = getConnection();
  return await conn.getBalance(publicKey);
}

export async function confirmTransaction(signature, commitment = 'confirmed') {
  const conn = getConnection();
  const result = await conn.confirmTransaction(signature, commitment);
  return result;
}

export async function sendTransaction(transaction, signers) {
  const conn = getConnection();
  const signature = await conn.sendTransaction(transaction, signers);
  await confirmTransaction(signature);
  return signature;
}

export default {
  getConnection,
  getBalance,
  confirmTransaction,
  sendTransaction
};
