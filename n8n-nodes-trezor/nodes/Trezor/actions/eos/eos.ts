/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const eosOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['eos'] } },
    options: [
      { name: 'Get Public Key', value: 'getPublicKey', description: 'Get EOS public key', action: 'Get public key' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
    ],
    default: 'getPublicKey',
  },
];

export const eosFields: INodeProperties[] = [
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/194'/0'/0/0",
    displayOptions: { show: { resource: ['eos'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['eos'], operation: ['getPublicKey'] } },
  },
  {
    displayName: 'Transaction (JSON)',
    name: 'transaction',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['eos'], operation: ['signTransaction'] } },
  },
];

export async function executeEosOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getPublicKey': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.eosGetPublicKey(path, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get public key');
        result = { wifPublicKey: response.payload.wifPublicKey, rawPublicKey: response.payload.rawPublicKey };
        break;
      }
      case 'signTransaction': {
        const path = this.getNodeParameter('path', index) as string;
        const transaction = this.getNodeParameter('transaction', index) as Record<string, unknown>;
        const response = await transport.eosSignTransaction(path, transaction);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { signature: response.payload.signature };
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
