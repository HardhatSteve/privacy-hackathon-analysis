/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const stellarOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['stellar'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Stellar address', action: 'Get address' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
    ],
    default: 'getAddress',
  },
];

export const stellarFields: INodeProperties[] = [
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Public', value: 'Public Global Stellar Network ; September 2015' },
      { name: 'Testnet', value: 'Test SDF Network ; September 2015' },
    ],
    default: 'Public Global Stellar Network ; September 2015',
    displayOptions: { show: { resource: ['stellar'] } },
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/148'/0'",
    displayOptions: { show: { resource: ['stellar'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['stellar'], operation: ['getAddress'] } },
  },
  {
    displayName: 'Transaction Envelope (XDR)',
    name: 'transactionEnvelope',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['stellar'], operation: ['signTransaction'] } },
  },
];

export async function executeStellarOperation(
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
        const response = await transport.stellarGetAddress(path, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath, network };
        break;
      }
      case 'signTransaction': {
        const path = this.getNodeParameter('path', index) as string;
        const transactionEnvelope = this.getNodeParameter('transactionEnvelope', index) as string;
        const response = await transport.stellarSignTransaction(path, network, { envelope: transactionEnvelope });
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
