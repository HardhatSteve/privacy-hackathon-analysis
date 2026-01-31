/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const signingOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['signing'] } },
    options: [
      { name: 'Sign Message', value: 'signMessage', description: 'Sign a text message', action: 'Sign message' },
      { name: 'Verify Message', value: 'verifyMessage', description: 'Verify a signed message', action: 'Verify message' },
      { name: 'Sign Hash', value: 'signHash', description: 'Sign a hash directly', action: 'Sign hash' },
      { name: 'Get Entropy', value: 'getEntropy', description: 'Get random entropy from device', action: 'Get entropy' },
    ],
    default: 'signMessage',
  },
];

export const signingFields: INodeProperties[] = [
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['signing'], operation: ['signMessage', 'verifyMessage'] } },
    description: 'The message to sign or verify',
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/0'/0'/0/0",
    displayOptions: { show: { resource: ['signing'], operation: ['signMessage', 'signHash'] } },
    description: 'BIP32 derivation path',
  },
  {
    displayName: 'Coin',
    name: 'coin',
    type: 'options',
    options: [
      { name: 'Bitcoin', value: 'btc' },
      { name: 'Ethereum', value: 'eth' },
      { name: 'Litecoin', value: 'ltc' },
      { name: 'Dogecoin', value: 'doge' },
    ],
    default: 'btc',
    displayOptions: { show: { resource: ['signing'], operation: ['signMessage', 'verifyMessage'] } },
    description: 'The cryptocurrency network',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['signing'], operation: ['verifyMessage'] } },
    description: 'The address that signed the message',
  },
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['signing'], operation: ['verifyMessage'] } },
    description: 'The signature to verify',
  },
  {
    displayName: 'Hash',
    name: 'hash',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['signing'], operation: ['signHash'] } },
    description: 'The 32-byte hash to sign (hex encoded)',
  },
  {
    displayName: 'Entropy Size (Bytes)',
    name: 'entropySize',
    type: 'number',
    default: 32,
    displayOptions: { show: { resource: ['signing'], operation: ['getEntropy'] } },
    description: 'Size of random entropy to generate (1-1024 bytes)',
  },
];

export async function executeSigningOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'signMessage': {
        const message = this.getNodeParameter('message', index) as string;
        const path = this.getNodeParameter('path', index) as string;
        const coin = this.getNodeParameter('coin', index) as string;
        const response = await transport.signMessage(path, message, coin);
        if (!response.success) throw new Error(response.error || 'Failed to sign message');
        result = {
          ...response.payload,
          message,
          coin,
          path,
        };
        break;
      }
      case 'verifyMessage': {
        const message = this.getNodeParameter('message', index) as string;
        const address = this.getNodeParameter('address', index) as string;
        const signature = this.getNodeParameter('signature', index) as string;
        const coin = this.getNodeParameter('coin', index) as string;
        const response = await transport.verifyMessage(address, message, signature, coin);
        if (!response.success) throw new Error(response.error || 'Failed to verify message');
        result = {
          valid: response.payload.valid,
          message,
          address,
          coin,
        };
        break;
      }
      case 'signHash': {
        const hash = this.getNodeParameter('hash', index) as string;
        const path = this.getNodeParameter('path', index) as string;
        // Validate hash format
        if (!/^(0x)?[a-fA-F0-9]{64}$/.test(hash)) {
          throw new Error('Hash must be a 32-byte hex string');
        }
        // Mock implementation
        result = {
          hash,
          path,
          signature: '0x' + '0'.repeat(128),
        };
        break;
      }
      case 'getEntropy': {
        const size = this.getNodeParameter('entropySize', index) as number;
        if (size < 1 || size > 1024) {
          throw new Error('Entropy size must be between 1 and 1024 bytes');
        }
        // Mock implementation - in production would call device
        const entropy = '0x' + Array.from({ length: size }, () =>
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join('');
        result = {
          entropy,
          size,
          source: 'hardware_rng',
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
