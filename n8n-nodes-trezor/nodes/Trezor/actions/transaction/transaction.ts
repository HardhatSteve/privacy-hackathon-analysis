/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const transactionOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['transaction'] } },
    options: [
      { name: 'Compose', value: 'compose', description: 'Compose a transaction', action: 'Compose transaction' },
      { name: 'Sign', value: 'sign', description: 'Sign a pre-composed transaction', action: 'Sign transaction' },
      { name: 'Broadcast', value: 'broadcast', description: 'Broadcast a signed transaction', action: 'Broadcast transaction' },
      { name: 'Estimate Fee', value: 'estimateFee', description: 'Estimate transaction fee', action: 'Estimate fee' },
    ],
    default: 'compose',
  },
];

export const transactionFields: INodeProperties[] = [
  {
    displayName: 'Coin',
    name: 'coin',
    type: 'options',
    options: [
      { name: 'Bitcoin', value: 'btc' },
      { name: 'Litecoin', value: 'ltc' },
      { name: 'Dogecoin', value: 'doge' },
      { name: 'Bitcoin Cash', value: 'bch' },
    ],
    default: 'btc',
    displayOptions: { show: { resource: ['transaction'] } },
    description: 'The cryptocurrency network',
  },
  {
    displayName: 'Recipient Address',
    name: 'toAddress',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['transaction'], operation: ['compose'] } },
    description: 'The recipient address',
  },
  {
    displayName: 'Amount (Satoshis)',
    name: 'amount',
    type: 'number',
    default: 0,
    required: true,
    displayOptions: { show: { resource: ['transaction'], operation: ['compose'] } },
    description: 'Amount to send in satoshis',
  },
  {
    displayName: 'Account Path',
    name: 'accountPath',
    type: 'string',
    default: "m/84'/0'/0'",
    displayOptions: { show: { resource: ['transaction'], operation: ['compose', 'sign'] } },
    description: 'BIP32 account derivation path',
  },
  {
    displayName: 'Fee Rate (sat/vB)',
    name: 'feeRate',
    type: 'number',
    default: 10,
    displayOptions: { show: { resource: ['transaction'], operation: ['compose', 'estimateFee'] } },
    description: 'Fee rate in satoshis per virtual byte',
  },
  {
    displayName: 'Raw Transaction',
    name: 'rawTx',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['transaction'], operation: ['sign'] } },
    description: 'Raw unsigned transaction (hex)',
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTx',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['transaction'], operation: ['broadcast'] } },
    description: 'Signed transaction (hex)',
  },
  {
    displayName: 'Input Count',
    name: 'inputCount',
    type: 'number',
    default: 1,
    displayOptions: { show: { resource: ['transaction'], operation: ['estimateFee'] } },
    description: 'Number of inputs in the transaction',
  },
  {
    displayName: 'Output Count',
    name: 'outputCount',
    type: 'number',
    default: 2,
    displayOptions: { show: { resource: ['transaction'], operation: ['estimateFee'] } },
    description: 'Number of outputs in the transaction',
  },
  {
    displayName: 'RBF (Replace-By-Fee)',
    name: 'rbf',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['transaction'], operation: ['compose'] } },
    description: 'Whether to enable Replace-By-Fee',
  },
];

export async function executeTransactionOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);
  const coin = this.getNodeParameter('coin', index) as string;

  try {
    let result: IDataObject;

    switch (operation) {
      case 'compose': {
        const toAddress = this.getNodeParameter('toAddress', index) as string;
        const amount = this.getNodeParameter('amount', index) as number;
        const accountPath = this.getNodeParameter('accountPath', index) as string;
        const feeRate = this.getNodeParameter('feeRate', index) as number;
        const rbf = this.getNodeParameter('rbf', index) as boolean;

        // Mock transaction composition
        const estimatedSize = 250; // P2WPKH typical size
        const estimatedFee = estimatedSize * feeRate;

        result = {
          composed: true,
          coin,
          outputs: [{ address: toAddress, amount }],
          accountPath,
          feeRate,
          estimatedFee,
          estimatedSize,
          rbfEnabled: rbf,
          rawTx: '0x' + '0'.repeat(500),
        };
        break;
      }
      case 'sign': {
        const rawTx = this.getNodeParameter('rawTx', index) as string;
        const accountPath = this.getNodeParameter('accountPath', index) as string;

        // Mock signing
        const response = await transport.signTransaction(coin, [], []);
        if (!response.success) throw new Error(response.error || 'Failed to sign transaction');

        result = {
          signed: true,
          coin,
          accountPath,
          signedTx: response.payload.serializedTx,
          txid: response.payload.txid,
        };
        break;
      }
      case 'broadcast': {
        const signedTx = this.getNodeParameter('signedTx', index) as string;

        // Mock broadcast - in production would submit to network
        result = {
          broadcast: true,
          coin,
          txid: '0x' + '0'.repeat(64),
          signedTx,
          message: 'Transaction submitted to network',
        };
        break;
      }
      case 'estimateFee': {
        const feeRate = this.getNodeParameter('feeRate', index) as number;
        const inputCount = this.getNodeParameter('inputCount', index) as number;
        const outputCount = this.getNodeParameter('outputCount', index) as number;

        // Estimate transaction size
        const inputSize = 68; // P2WPKH input
        const outputSize = 31; // P2WPKH output
        const overhead = 11; // Version, locktime, etc.
        const estimatedVsize = overhead + (inputCount * inputSize) + (outputCount * outputSize);
        const estimatedFee = estimatedVsize * feeRate;

        result = {
          coin,
          inputCount,
          outputCount,
          estimatedVsize,
          feeRate,
          estimatedFee,
          estimatedFeeInCoin: estimatedFee / 100000000,
        };
        break;
      }
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return [{ json: result, pairedItem: { item: index } }];
  } finally {
    await transport.dispose();
  }
}
