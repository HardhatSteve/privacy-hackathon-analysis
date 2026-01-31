/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const solanaOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['solana'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Solana address', action: 'Get address' },
      { name: 'Get Public Key', value: 'getPublicKey', description: 'Get public key', action: 'Get public key' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
    ],
    default: 'getAddress',
  },
];

export const solanaFields: INodeProperties[] = [
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Mainnet', value: 'mainnet-beta' },
      { name: 'Devnet', value: 'devnet' },
      { name: 'Testnet', value: 'testnet' },
    ],
    default: 'mainnet-beta',
    displayOptions: { show: { resource: ['solana'] } },
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/501'/0'/0'",
    displayOptions: { show: { resource: ['solana'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['solana'], operation: ['getAddress', 'getPublicKey'] } },
  },
  {
    displayName: 'Serialized Transaction',
    name: 'serializedTx',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['solana'], operation: ['signTransaction'] } },
    description: 'Base58 or hex encoded serialized transaction',
  },
];

export async function executeSolanaOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const network = this.getNodeParameter('network', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.solanaGetAddress(path, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath, network };
        break;
      }
      case 'getPublicKey': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getPublicKey(path, 'sol', showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get public key');
        result = { publicKey: response.payload.publicKey, path: response.payload.serializedPath, network };
        break;
      }
      case 'signTransaction': {
        const path = this.getNodeParameter('path', index) as string;
        const serializedTx = this.getNodeParameter('serializedTx', index) as string;
        const response = await transport.solanaSignTransaction(path, serializedTx);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { signature: response.payload.signature, network };
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
