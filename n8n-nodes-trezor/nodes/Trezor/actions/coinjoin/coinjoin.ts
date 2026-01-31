/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const coinjoinOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['coinjoin'] } },
    options: [
      { name: 'Get Ownership Proof', value: 'getOwnershipProof', description: 'Generate ownership proof for CoinJoin', action: 'Get ownership proof' },
      { name: 'Get Ownership ID', value: 'getOwnershipId', description: 'Get ownership identifier', action: 'Get ownership ID' },
      { name: 'Authorize CoinJoin', value: 'authorize', description: 'Authorize a CoinJoin round', action: 'Authorize CoinJoin' },
    ],
    default: 'getOwnershipProof',
  },
];

export const coinjoinFields: INodeProperties[] = [
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/0'/0'/0/0",
    required: true,
    displayOptions: { show: { resource: ['coinjoin'] } },
    description: 'BIP32 derivation path for the UTXO',
  },
  {
    displayName: 'Script Type',
    name: 'scriptType',
    type: 'options',
    options: [
      { name: 'P2WPKH (Native SegWit)', value: 'SPENDWITNESS' },
      { name: 'P2TR (Taproot)', value: 'SPENDTAPROOT' },
    ],
    default: 'SPENDWITNESS',
    displayOptions: { show: { resource: ['coinjoin'] } },
    description: 'Script type for the input',
  },
  {
    displayName: 'Commitment Data',
    name: 'commitmentData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['coinjoin'], operation: ['getOwnershipProof'] } },
    description: 'Optional commitment data for the proof',
  },
  {
    displayName: 'Coordinator Name',
    name: 'coordinator',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['coinjoin'], operation: ['authorize'] } },
    description: 'Name of the CoinJoin coordinator',
  },
  {
    displayName: 'Max Rounds',
    name: 'maxRounds',
    type: 'number',
    default: 1,
    displayOptions: { show: { resource: ['coinjoin'], operation: ['authorize'] } },
    description: 'Maximum number of CoinJoin rounds to authorize',
  },
  {
    displayName: 'Max Coordinator Fee Rate',
    name: 'maxCoordinatorFeeRate',
    type: 'number',
    default: 0.003,
    displayOptions: { show: { resource: ['coinjoin'], operation: ['authorize'] } },
    description: 'Maximum coordinator fee rate (in percentage)',
  },
  {
    displayName: 'Max Fee per Kvbyte',
    name: 'maxFeePerKvbyte',
    type: 'number',
    default: 50000,
    displayOptions: { show: { resource: ['coinjoin'], operation: ['authorize'] } },
    description: 'Maximum fee per kilovirtual byte (satoshis)',
  },
];

export async function executeCoinjoinOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;
    const path = this.getNodeParameter('path', index) as string;
    const scriptType = this.getNodeParameter('scriptType', index) as string;

    switch (operation) {
      case 'getOwnershipProof': {
        const commitmentData = this.getNodeParameter('commitmentData', index, '') as string;
        // Mock implementation - in production would call transport.getOwnershipProof
        result = {
          ownershipProof: '0x' + '0'.repeat(128),
          path,
          scriptType,
          commitmentData: commitmentData || null,
        };
        break;
      }
      case 'getOwnershipId': {
        // Mock implementation
        result = {
          ownershipId: '0x' + '0'.repeat(64),
          path,
          scriptType,
        };
        break;
      }
      case 'authorize': {
        const coordinator = this.getNodeParameter('coordinator', index) as string;
        const maxRounds = this.getNodeParameter('maxRounds', index) as number;
        const maxCoordinatorFeeRate = this.getNodeParameter('maxCoordinatorFeeRate', index) as number;
        const maxFeePerKvbyte = this.getNodeParameter('maxFeePerKvbyte', index) as number;
        // Mock implementation
        result = {
          authorized: true,
          coordinator,
          maxRounds,
          maxCoordinatorFeeRate,
          maxFeePerKvbyte,
          message: 'CoinJoin authorization granted',
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
