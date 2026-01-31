/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const rippleOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['ripple'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Ripple address', action: 'Get address' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign payment', action: 'Sign transaction' },
    ],
    default: 'getAddress',
  },
];

export const rippleFields: INodeProperties[] = [
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/144'/0'/0/0",
    displayOptions: { show: { resource: ['ripple'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['ripple'], operation: ['getAddress'] } },
  },
  {
    displayName: 'Destination',
    name: 'destination',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ripple'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Amount (XRP)',
    name: 'amount',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ripple'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Fee (Drops)',
    name: 'fee',
    type: 'string',
    default: '12',
    displayOptions: { show: { resource: ['ripple'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Sequence',
    name: 'sequence',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['ripple'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Destination Tag',
    name: 'destinationTag',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['ripple'], operation: ['signTransaction'] } },
  },
];

export async function executeRippleOperation(
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
        const response = await transport.rippleGetAddress(path, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath };
        break;
      }
      case 'signTransaction': {
        const path = this.getNodeParameter('path', index) as string;
        const destination = this.getNodeParameter('destination', index) as string;
        const amount = this.getNodeParameter('amount', index) as string;
        const fee = this.getNodeParameter('fee', index) as string;
        const sequence = this.getNodeParameter('sequence', index) as number;
        const destinationTag = this.getNodeParameter('destinationTag', index, 0) as number;
        const transaction = {
          TransactionType: 'Payment',
          Destination: destination,
          Amount: (parseFloat(amount) * 1000000).toString(),
          Fee: fee,
          Sequence: sequence,
          DestinationTag: destinationTag || undefined,
        };
        const response = await transport.rippleSignTransaction(path, transaction);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { signatures: response.payload.signatures, serializedTx: response.payload.serializedTx };
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
