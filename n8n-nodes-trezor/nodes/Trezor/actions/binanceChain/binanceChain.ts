/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const binanceChainOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['binanceChain'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Binance Chain address', action: 'Get address' },
      { name: 'Get Public Key', value: 'getPublicKey', description: 'Get public key', action: 'Get public key' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
    ],
    default: 'getAddress',
  },
];

export const binanceChainFields: INodeProperties[] = [
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/714'/0'/0/0",
    displayOptions: { show: { resource: ['binanceChain'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['binanceChain'], operation: ['getAddress', 'getPublicKey'] } },
  },
  {
    displayName: 'Transaction (JSON)',
    name: 'transaction',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['binanceChain'], operation: ['signTransaction'] } },
  },
];

export async function executeBinanceChainOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.binanceGetAddress(path, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath };
        break;
      }
      case 'getPublicKey': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getPublicKey(path, 'bnb', showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get public key');
        result = { publicKey: response.payload.publicKey, path: response.payload.serializedPath };
        break;
      }
      case 'signTransaction': {
        const path = this.getNodeParameter('path', index) as string;
        const transaction = this.getNodeParameter('transaction', index) as Record<string, unknown>;
        const response = await transport.binanceSignTransaction(path, transaction);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { signature: response.payload.signature, publicKey: response.payload.publicKey };
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
