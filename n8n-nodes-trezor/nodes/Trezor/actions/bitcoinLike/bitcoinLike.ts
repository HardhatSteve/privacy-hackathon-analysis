/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const bitcoinLikeOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['bitcoinLike'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get address for Bitcoin-like coin', action: 'Get address' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign a message', action: 'Sign message' },
      { name: 'Verify Message', value: 'verifyMessage', description: 'Verify signed message', action: 'Verify message' },
    ],
    default: 'getAddress',
  },
];

export const bitcoinLikeFields: INodeProperties[] = [
  {
    displayName: 'Coin',
    name: 'coin',
    type: 'options',
    options: [
      { name: 'Litecoin', value: 'ltc' },
      { name: 'Dogecoin', value: 'doge' },
      { name: 'Dash', value: 'dash' },
      { name: 'Bitcoin Cash', value: 'bch' },
      { name: 'Zcash', value: 'zec' },
      { name: 'DigiByte', value: 'dgb' },
      { name: 'Vertcoin', value: 'vtc' },
      { name: 'Groestlcoin', value: 'grs' },
    ],
    default: 'ltc',
    displayOptions: { show: { resource: ['bitcoinLike'] } },
    description: 'Bitcoin-like cryptocurrency',
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/2'/0'/0/0",
    displayOptions: { show: { resource: ['bitcoinLike'] } },
    description: 'BIP32 derivation path',
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['bitcoinLike'], operation: ['getAddress'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bitcoinLike'], operation: ['signMessage', 'verifyMessage'] } },
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bitcoinLike'], operation: ['verifyMessage'] } },
  },
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bitcoinLike'], operation: ['verifyMessage'] } },
  },
  {
    displayName: 'Inputs (JSON)',
    name: 'inputs',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['bitcoinLike'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Outputs (JSON)',
    name: 'outputs',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['bitcoinLike'], operation: ['signTransaction'] } },
  },
];

export async function executeBitcoinLikeOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const coin = this.getNodeParameter('coin', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getAddress(path, coin, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath, coin };
        break;
      }
      case 'signTransaction': {
        const inputs = this.getNodeParameter('inputs', index) as unknown[];
        const outputs = this.getNodeParameter('outputs', index) as unknown[];
        const response = await transport.signTransaction(coin, inputs, outputs);
        if (!response.success) throw new Error(response.error || 'Failed to sign transaction');
        result = { signatures: response.payload.signatures, serializedTx: response.payload.serializedTx, coin };
        break;
      }
      case 'signMessage': {
        const path = this.getNodeParameter('path', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const response = await transport.signMessage(path, message, coin);
        if (!response.success) throw new Error(response.error || 'Failed to sign message');
        result = { address: response.payload.address, signature: response.payload.signature, message, coin };
        break;
      }
      case 'verifyMessage': {
        const address = this.getNodeParameter('address', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const signature = this.getNodeParameter('signature', index) as string;
        const response = await transport.verifyMessage(address, message, signature, coin);
        if (!response.success) throw new Error(response.error || 'Failed to verify');
        result = { valid: response.payload.valid, address, message, coin };
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
