/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const evmChainsOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['evmChains'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get address for EVM chain', action: 'Get address' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign EVM transaction', action: 'Sign transaction' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign message', action: 'Sign message' },
      { name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign EIP-712 typed data', action: 'Sign typed data' },
    ],
    default: 'getAddress',
  },
];

export const evmChainsFields: INodeProperties[] = [
  {
    displayName: 'Chain',
    name: 'chain',
    type: 'options',
    options: [
      { name: 'Polygon', value: 137 },
      { name: 'BNB Smart Chain', value: 56 },
      { name: 'Avalanche C-Chain', value: 43114 },
      { name: 'Arbitrum One', value: 42161 },
      { name: 'Optimism', value: 10 },
      { name: 'Base', value: 8453 },
      { name: 'Fantom', value: 250 },
      { name: 'Gnosis Chain', value: 100 },
    ],
    default: 137,
    displayOptions: { show: { resource: ['evmChains'] } },
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/44'/60'/0'/0/0",
    displayOptions: { show: { resource: ['evmChains'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['evmChains'], operation: ['getAddress'] } },
  },
  {
    displayName: 'To Address',
    name: 'to',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Value',
    name: 'value',
    type: 'string',
    default: '0',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Gas Limit',
    name: 'gasLimit',
    type: 'string',
    default: '21000',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Gas Price (Gwei)',
    name: 'gasPrice',
    type: 'string',
    default: '20',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Nonce',
    name: 'nonce',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Data (Hex)',
    name: 'data',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signMessage'] } },
  },
  {
    displayName: 'Typed Data (JSON)',
    name: 'typedData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTypedData'] } },
  },
];

export async function executeEvmChainsOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const chainId = this.getNodeParameter('chain', index) as number;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getAddress(path, 'eth', showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath, chainId };
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
          to, value: BigInt(parseFloat(value) * 1e18).toString(16),
          gasLimit: BigInt(gasLimit).toString(16), gasPrice: BigInt(parseFloat(gasPrice) * 1e9).toString(16),
          nonce: nonce.toString(16), data: data || '0x', chainId,
        };
        const response = await transport.ethereumSignTransaction(path, transaction);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { v: response.payload.v, r: response.payload.r, s: response.payload.s, chainId };
        break;
      }
      case 'signMessage': {
        const path = this.getNodeParameter('path', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const response = await transport.ethereumSignMessage(path, message);
        if (!response.success) throw new Error(response.error || 'Failed to sign message');
        result = { address: response.payload.address, signature: response.payload.signature, message, chainId };
        break;
      }
      case 'signTypedData': {
        const path = this.getNodeParameter('path', index) as string;
        const typedData = this.getNodeParameter('typedData', index) as Record<string, unknown>;
        const response = await transport.ethereumSignTypedData(path, typedData);
        if (!response.success) throw new Error(response.error || 'Failed to sign typed data');
        result = { address: response.payload.address, signature: response.payload.signature, chainId };
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
