/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const bitcoinOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['bitcoin'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Bitcoin address', action: 'Get address' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign a Bitcoin transaction', action: 'Sign transaction' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign a message', action: 'Sign message' },
      { name: 'Verify Message', value: 'verifyMessage', description: 'Verify a signed message', action: 'Verify message' },
      { name: 'Get UTXO', value: 'getUtxo', description: 'Get unspent transaction outputs', action: 'Get UTXO' },
    ],
    default: 'getAddress',
  },
];

export const bitcoinFields: INodeProperties[] = [
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Mainnet', value: 'mainnet' },
      { name: 'Testnet', value: 'testnet' },
    ],
    default: 'mainnet',
    displayOptions: { show: { resource: ['bitcoin'] } },
    description: 'Bitcoin network',
  },
  {
    displayName: 'Address Type',
    name: 'addressType',
    type: 'options',
    options: [
      { name: 'Native SegWit (bc1q...)', value: 'p2wpkh' },
      { name: 'SegWit (3...)', value: 'p2sh-p2wpkh' },
      { name: 'Legacy (1...)', value: 'p2pkh' },
      { name: 'Taproot (bc1p...)', value: 'p2tr' },
    ],
    default: 'p2wpkh',
    displayOptions: { show: { resource: ['bitcoin'], operation: ['getAddress'] } },
    description: 'Address type to generate',
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/0'/0'/0/0",
    displayOptions: { show: { resource: ['bitcoin'], operation: ['getAddress', 'signTransaction', 'signMessage'] } },
    description: 'BIP32 derivation path',
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['bitcoin'], operation: ['getAddress'] } },
    description: 'Whether to display address on device for verification',
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bitcoin'], operation: ['signMessage', 'verifyMessage'] } },
    description: 'Message to sign or verify',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bitcoin'], operation: ['verifyMessage', 'getUtxo'] } },
    description: 'Bitcoin address',
  },
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['bitcoin'], operation: ['verifyMessage'] } },
    description: 'Signature to verify',
  },
  {
    displayName: 'Inputs (JSON)',
    name: 'inputs',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['bitcoin'], operation: ['signTransaction'] } },
    description: 'Transaction inputs as JSON array',
  },
  {
    displayName: 'Outputs (JSON)',
    name: 'outputs',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['bitcoin'], operation: ['signTransaction'] } },
    description: 'Transaction outputs as JSON array',
  },
];

export async function executeBitcoinOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const network = this.getNodeParameter('network', index) as string;
  const coin = network === 'testnet' ? 'test' : 'btc';
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const addressType = this.getNodeParameter('addressType', index) as string;
        const response = await transport.getAddress(path, coin, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = {
          address: response.payload.address,
          path: response.payload.serializedPath,
          addressType,
          network,
        };
        break;
      }
      case 'signTransaction': {
        const inputs = this.getNodeParameter('inputs', index) as unknown[];
        const outputs = this.getNodeParameter('outputs', index) as unknown[];
        const response = await transport.signTransaction(coin, inputs, outputs);
        if (!response.success) throw new Error(response.error || 'Failed to sign transaction');
        result = {
          signatures: response.payload.signatures,
          serializedTx: response.payload.serializedTx,
          txid: response.payload.txid,
          network,
        };
        break;
      }
      case 'signMessage': {
        const path = this.getNodeParameter('path', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const response = await transport.signMessage(path, message, coin);
        if (!response.success) throw new Error(response.error || 'Failed to sign message');
        result = {
          address: response.payload.address,
          signature: response.payload.signature,
          message,
          network,
        };
        break;
      }
      case 'verifyMessage': {
        const address = this.getNodeParameter('address', index) as string;
        const message = this.getNodeParameter('message', index) as string;
        const signature = this.getNodeParameter('signature', index) as string;
        const response = await transport.verifyMessage(address, message, signature, coin);
        if (!response.success) throw new Error(response.error || 'Failed to verify message');
        result = {
          valid: response.payload.valid,
          address,
          message,
          network,
        };
        break;
      }
      case 'getUtxo': {
        const address = this.getNodeParameter('address', index) as string;
        result = {
          address,
          utxos: [],
          totalValue: '0',
          network,
          note: 'UTXO lookup requires blockchain API integration',
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
