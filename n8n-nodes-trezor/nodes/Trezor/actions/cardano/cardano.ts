/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const cardanoOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['cardano'] } },
    options: [
      { name: 'Get Address', value: 'getAddress', description: 'Get Cardano address', action: 'Get address' },
      { name: 'Get Public Key', value: 'getPublicKey', description: 'Get public key', action: 'Get public key' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
      { name: 'Get Stake Address', value: 'getStakeAddress', description: 'Get staking address', action: 'Get stake address' },
    ],
    default: 'getAddress',
  },
];

export const cardanoFields: INodeProperties[] = [
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Mainnet', value: 1 },
      { name: 'Testnet', value: 0 },
    ],
    default: 1,
    displayOptions: { show: { resource: ['cardano'] } },
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/1852'/1815'/0'/0/0",
    displayOptions: { show: { resource: ['cardano'] } },
  },
  {
    displayName: 'Staking Path',
    name: 'stakingPath',
    type: 'string',
    default: "m/1852'/1815'/0'/2/0",
    displayOptions: { show: { resource: ['cardano'], operation: ['getAddress', 'getStakeAddress'] } },
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['cardano'], operation: ['getAddress', 'getPublicKey'] } },
  },
  {
    displayName: 'Inputs (JSON)',
    name: 'inputs',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['cardano'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Outputs (JSON)',
    name: 'outputs',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['cardano'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'Fee (Lovelace)',
    name: 'fee',
    type: 'string',
    default: '200000',
    displayOptions: { show: { resource: ['cardano'], operation: ['signTransaction'] } },
  },
  {
    displayName: 'TTL',
    name: 'ttl',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['cardano'], operation: ['signTransaction'] } },
  },
];

export async function executeCardanoOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const networkId = this.getNodeParameter('network', index) as number;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getAddress': {
        const path = this.getNodeParameter('path', index) as string;
        const stakingPath = this.getNodeParameter('stakingPath', index) as string;
        const response = await transport.cardanoGetAddress(path, stakingPath, networkId);
        if (!response.success) throw new Error(response.error || 'Failed to get address');
        result = { address: response.payload.address, path: response.payload.serializedPath, networkId };
        break;
      }
      case 'getPublicKey': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getPublicKey(path, 'ada', showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get public key');
        result = { publicKey: response.payload.publicKey, path: response.payload.serializedPath, networkId };
        break;
      }
      case 'signTransaction': {
        const inputs = this.getNodeParameter('inputs', index) as unknown[];
        const outputs = this.getNodeParameter('outputs', index) as unknown[];
        const fee = this.getNodeParameter('fee', index) as string;
        const ttl = this.getNodeParameter('ttl', index) as string;
        const response = await transport.cardanoSignTransaction(inputs, outputs, fee, ttl);
        if (!response.success) throw new Error(response.error || 'Failed to sign');
        result = { signatures: response.payload.signatures, serializedTx: response.payload.serializedTx, networkId };
        break;
      }
      case 'getStakeAddress': {
        const stakingPath = this.getNodeParameter('stakingPath', index) as string;
        const response = await transport.cardanoGetAddress(stakingPath, stakingPath, networkId);
        if (!response.success) throw new Error(response.error || 'Failed to get stake address');
        result = { stakeAddress: response.payload.address, path: response.payload.serializedPath, networkId };
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
