/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const ethereumOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['ethereum'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Ethereum address', action: 'Get address' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign ETH transaction', action: 'Sign transaction' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign message (personal_sign)', action: 'Sign message' },
      { name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign EIP-712 typed data', action: 'Sign typed data' },
      { name: 'Verify Message', value: 'verifyMessage', description: 'Verify signed message', action: 'Verify message' },
    ],
    default: 'getAddress',
  },
];

export const ethereumFields: INodeProperties[] = [
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Mainnet', value: 1 },
      { name: 'Sepolia', value: 11155111 },
      { name: 'Goerli', value: 5 },
    ],
    default: 1,
    displayOptions: { show: { resource: ['ethereum'] } },
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/60'/0'/0/0",
    displayOptions: { show: { resource: ['ethereum'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['ethereum'], operation: ['getAddress'] } },
  },
  {
    displayName: 'To Address',
    name: 'to',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Value (ETH)',
    name: 'value',
    type: 'string',
    default: '0',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Gas Limit',
    name: 'gasLimit',
    type: 'string',
    default: '21000',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Gas Price (Gwei)',
    name: 'gasPrice',
    type: 'string',
    default: '20',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Nonce',
    name: 'nonce',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Data (Hex)',
    name: 'data',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signMessage', 'verifyMessage'] } },
  },
  {
    displayName: 'Typed Data (JSON)',
    name: 'typedData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['ethereum'], operation: ['signTypedData'] } },
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ethereum'], operation: ['verifyMessage'] } },
  },
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['ethereum'], operation: ['verifyMessage'] } },
  },
];

export async function executeEthereumOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const network = this.getNodeParameter('network', index) as number;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getAddress(path, 'eth', showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath, chainId: network };
        break;
      }
      case 'signTransaction': {
        const path = this.getNodeParameter('path', index) as string;
        const to = this.getNodeParameter('to', index) as string;
        const value = this.getNodeParameter('value', index) as string;
        const gasLimit = this.getNodeParameter('gasLimit', index) as string;
        const gasPrice = this.getNodeParameter('gasPrice', index) as string;
        const nonce = this.getNodeParameter('nonce', index) as number;
        const data = this.getNodeParameter('data', index, '') as string;
        const transaction = {
          to,
          value: BigInt(parseFloat(value) * 1e18).toString(16),
          gasLimit: BigInt(gasLimit).toString(16),
          gasPrice: BigInt(parseFloat(gasPrice) * 1e9).toString(16),
          nonce: nonce.toString(16),
          data: data || '0x',
          chainId: network,
        };
        const response = await transport.ethereumSignTransaction(path, transaction);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { v: response.payload.v, r: response.payload.r, s: response.payload.s, chainId: network };
        break;
      }
      case 'signMessage': {
        const path = this.getNodeParameter('path', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const response = await transport.ethereumSignMessage(path, message);
        if (!response.success) throw new Error(response.error || 'Failed to sign message');
        result = { address: response.payload.address, signature: response.payload.signature, message, chainId: network };
        break;
      }
      case 'signTypedData': {
        const path = this.getNodeParameter('path', index) as string;
        const typedData = this.getNodeParameter('typedData', index) as Record<string, unknown>;
        const response = await transport.ethereumSignTypedData(path, typedData);
        if (!response.success) throw new Error(response.error || 'Failed to sign typed data');
        result = { address: response.payload.address, signature: response.payload.signature, chainId: network };
        break;
      }
      case 'verifyMessage': {
        const address = this.getNodeParameter('address', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const signature = this.getNodeParameter('signature', index) as string;
        const response = await transport.verifyMessage(address, message, signature, 'eth');
        if (!response.success) throw new Error(response.error || 'Failed to verify');
        result = { valid: response.payload.valid, address, message, chainId: network };
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
