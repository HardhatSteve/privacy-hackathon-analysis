/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';
import { getDefaultPath, getSlip44CoinType } from '../../constants';

export const accountOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['account'] } },
    options: [
      { name: 'Get Public Key', value: 'getPublicKey', description: 'Get account public key', action: 'Get public key' },
      { name: 'Get XPUB', value: 'getXpub', description: 'Get extended public key', action: 'Get XPUB' },
      { name: 'Get Account Info', value: 'getInfo', description: 'Get account information', action: 'Get account info' },
      { name: 'Discover Accounts', value: 'discover', description: 'Discover accounts on device', action: 'Discover accounts' },
    ],
    default: 'getPublicKey',
  },
];

export const accountFields: INodeProperties[] = [
  {
    displayName: 'Coin',
    name: 'coin',
    type: 'options',
    options: [
      { name: 'Bitcoin', value: 'btc' },
      { name: 'Ethereum', value: 'eth' },
      { name: 'Litecoin', value: 'ltc' },
      { name: 'Bitcoin Cash', value: 'bch' },
      { name: 'Dogecoin', value: 'doge' },
      { name: 'Cardano', value: 'ada' },
      { name: 'Solana', value: 'sol' },
    ],
    default: 'btc',
    displayOptions: { show: { resource: ['account'] } },
    description: 'Cryptocurrency to use',
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/0'/0'",
    displayOptions: { show: { resource: ['account'], operation: ['getPublicKey', 'getXpub', 'getInfo'] } },
    description: 'BIP32 derivation path',
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['account'], operation: ['getPublicKey', 'getXpub'] } },
    description: 'Whether to show the key on the device screen',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['account'], operation: ['getInfo', 'discover'] } },
    description: 'Account index to query',
  },
];

export async function executeAccountOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const coin = this.getNodeParameter('coin', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getPublicKey': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getPublicKey(path, coin, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get public key');
        result = {
          publicKey: response.payload.publicKey,
          path: response.payload.serializedPath,
          chainCode: response.payload.node.chainCode,
          coin,
        };
        break;
      }
      case 'getXpub': {
        const path = this.getNodeParameter('path', index) as string;
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const response = await transport.getPublicKey(path, coin, showOnDevice);
        if (!response.success) throw new Error(response.error || 'Failed to get XPUB');
        result = {
          xpub: response.payload.publicKey,
          path: response.payload.serializedPath,
          depth: response.payload.node.depth,
          fingerprint: response.payload.node.fingerprint,
          coin,
        };
        break;
      }
      case 'getInfo': {
        const path = this.getNodeParameter('path', index) as string;
        const accountIndex = this.getNodeParameter('accountIndex', index) as number;
        const response = await transport.getPublicKey(path, coin, false);
        if (!response.success) throw new Error(response.error || 'Failed to get account info');
        result = {
          accountIndex,
          path,
          coin,
          coinType: getSlip44CoinType(coin),
          publicKey: response.payload.publicKey,
        };
        break;
      }
      case 'discover': {
        const basePath = getDefaultPath(coin);
        const accounts: Record<string, unknown>[] = [];
        for (let i = 0; i < 5; i++) {
          const accountPath = basePath.replace("/0'", `/${i}'`);
          const response = await transport.getPublicKey(accountPath, coin, false);
          if (response.success) {
            accounts.push({
              index: i,
              path: accountPath,
              publicKey: response.payload.publicKey,
            });
          }
        }
        result = { coin, accounts };
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
