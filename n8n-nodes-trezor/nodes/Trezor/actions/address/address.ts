/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const addressOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['address'] } },
    options: [
      { name: 'Validate', value: 'validate', description: 'Validate an address format', action: 'Validate address' },
      { name: 'Get Type', value: 'getType', description: 'Determine address type', action: 'Get address type' },
      { name: 'Derive', value: 'derive', description: 'Derive address from path', action: 'Derive address' },
      { name: 'Compare', value: 'compare', description: 'Compare two addresses', action: 'Compare addresses' },
    ],
    default: 'validate',
  },
];

export const addressFields: INodeProperties[] = [
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['address'], operation: ['validate', 'getType'] } },
    description: 'The address to validate or analyze',
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
      { name: 'Bitcoin Cash', value: 'bch' },
    ],
    default: 'btc',
    displayOptions: { show: { resource: ['address'], operation: ['validate', 'getType', 'derive'] } },
    description: 'The cryptocurrency network',
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/0'/0'/0/0",
    displayOptions: { show: { resource: ['address'], operation: ['derive'] } },
    description: 'BIP32 derivation path',
  },
  {
    displayName: 'Address 1',
    name: 'address1',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['address'], operation: ['compare'] } },
    description: 'First address to compare',
  },
  {
    displayName: 'Address 2',
    name: 'address2',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['address'], operation: ['compare'] } },
    description: 'Second address to compare',
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['address'], operation: ['derive'] } },
    description: 'Whether to show the address on Trezor screen for verification',
  },
];

export async function executeAddressOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'validate': {
        const address = this.getNodeParameter('address', index) as string;
        const coin = this.getNodeParameter('coin', index) as string;
        const isValid = validateAddress(address, coin);
        result = { address, coin, valid: isValid };
        break;
      }
      case 'getType': {
        const address = this.getNodeParameter('address', index) as string;
        const coin = this.getNodeParameter('coin', index) as string;
        const addressType = getAddressType(address, coin);
        result = { address, coin, type: addressType };
        break;
      }
      case 'derive': {
        const path = this.getNodeParameter('path', index) as string;
        const coin = this.getNodeParameter('coin', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getAddress(path, coin, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to derive address');
        result = { ...response.payload, coin };
        break;
      }
      case 'compare': {
        const address1 = this.getNodeParameter('address1', index) as string;
        const address2 = this.getNodeParameter('address2', index) as string;
        const match = address1.toLowerCase() === address2.toLowerCase();
        result = { address1, address2, match };
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

function validateAddress(address: string, coin: string): boolean {
  const patterns: Record<string, RegExp> = {
    btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    eth: /^0x[a-fA-F0-9]{40}$/,
    ltc: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    doge: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/,
    bch: /^(bitcoincash:)?[qp][a-z0-9]{41}$/,
  };
  return patterns[coin]?.test(address) ?? false;
}

function getAddressType(address: string, coin: string): string {
  if (coin === 'btc') {
    if (address.startsWith('bc1q')) return 'P2WPKH (Native SegWit)';
    if (address.startsWith('bc1p')) return 'P2TR (Taproot)';
    if (address.startsWith('3')) return 'P2SH (SegWit Compatible)';
    if (address.startsWith('1')) return 'P2PKH (Legacy)';
  }
  if (coin === 'eth' && address.startsWith('0x')) return 'Ethereum Address';
  if (coin === 'ltc') {
    if (address.startsWith('ltc1')) return 'Native SegWit';
    if (address.startsWith('M')) return 'SegWit Compatible';
    if (address.startsWith('L')) return 'Legacy';
  }
  return 'Unknown';
}
