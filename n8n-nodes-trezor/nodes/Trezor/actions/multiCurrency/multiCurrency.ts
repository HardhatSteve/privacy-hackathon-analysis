/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const multiCurrencyOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['multiCurrency'] } },
    options: [
      { name: 'Get All Addresses', value: 'getAllAddresses', description: 'Get addresses for multiple coins', action: 'Get all addresses' },
      { name: 'Get Portfolio Public Keys', value: 'getPortfolioKeys', description: 'Get public keys for portfolio tracking', action: 'Get portfolio keys' },
      { name: 'Discover Accounts', value: 'discoverAccounts', description: 'Discover accounts across multiple coins', action: 'Discover accounts' },
    ],
    default: 'getAllAddresses',
  },
];

export const multiCurrencyFields: INodeProperties[] = [
  {
    displayName: 'Coins',
    name: 'coins',
    type: 'multiOptions',
    options: [
      { name: 'Bitcoin', value: 'btc' },
      { name: 'Ethereum', value: 'eth' },
      { name: 'Litecoin', value: 'ltc' },
      { name: 'Dogecoin', value: 'doge' },
      { name: 'Bitcoin Cash', value: 'bch' },
      { name: 'Cardano', value: 'ada' },
      { name: 'Solana', value: 'sol' },
      { name: 'Ripple', value: 'xrp' },
      { name: 'Stellar', value: 'xlm' },
      { name: 'Tezos', value: 'xtz' },
    ],
    default: ['btc', 'eth'],
    displayOptions: { show: { resource: ['multiCurrency'] } },
    description: 'The cryptocurrencies to include',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['multiCurrency'] } },
    description: 'The account index to use for derivation',
  },
  {
    displayName: 'Show on Device',
    name: 'showOnDevice',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['multiCurrency'], operation: ['getAllAddresses'] } },
    description: 'Whether to show addresses on device for verification',
  },
];

export async function executeMultiCurrencyOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);
  const coins = this.getNodeParameter('coins', index) as string[];
  const accountIndex = this.getNodeParameter('accountIndex', index) as number;

  try {
    let result: IDataObject;

    const coinPaths: Record<string, string> = {
      btc: `m/84'/0'/${accountIndex}'/0/0`,
      eth: `m/44'/60'/${accountIndex}'/0/0`,
      ltc: `m/84'/2'/${accountIndex}'/0/0`,
      doge: `m/44'/3'/${accountIndex}'/0/0`,
      bch: `m/44'/145'/${accountIndex}'/0/0`,
      ada: `m/1852'/1815'/${accountIndex}'/0/0`,
      sol: `m/44'/501'/${accountIndex}'/0'`,
      xrp: `m/44'/144'/${accountIndex}'/0/0`,
      xlm: `m/44'/148'/${accountIndex}'`,
      xtz: `m/44'/1729'/${accountIndex}'/0'`,
    };

    switch (operation) {
      case 'getAllAddresses': {
        const showOnDevice = this.getNodeParameter('showOnDevice', index) as boolean;
        const addresses: Record<string, unknown>[] = [];

        for (const coin of coins) {
          const path = coinPaths[coin] || `m/44'/0'/${accountIndex}'/0/0`;
          const response = await transport.getAddress(path, coin, showOnDevice);
          if (response.success) {
            addresses.push({
              coin,
              address: response.payload.address,
              path,
            });
          }
        }
        result = { addresses, count: addresses.length };
        break;
      }
      case 'getPortfolioKeys': {
        const publicKeys: Record<string, unknown>[] = [];

        for (const coin of coins) {
          const path = coinPaths[coin] || `m/44'/0'/${accountIndex}'/0/0`;
          const response = await transport.getPublicKey(path, coin, false);
          if (response.success) {
            publicKeys.push({
              coin,
              publicKey: response.payload.publicKey,
              path,
            });
          }
        }
        result = { publicKeys, count: publicKeys.length };
        break;
      }
      case 'discoverAccounts': {
        const accounts: Record<string, unknown>[] = [];

        for (const coin of coins) {
          const path = coinPaths[coin] || `m/44'/0'/${accountIndex}'/0/0`;
          const addressResponse = await transport.getAddress(path, coin, false);
          const keyResponse = await transport.getPublicKey(path, coin, false);

          if (addressResponse.success && keyResponse.success) {
            accounts.push({
              coin,
              accountIndex,
              address: addressResponse.payload.address,
              publicKey: keyResponse.payload.publicKey,
              path,
              discovered: true,
            });
          }
        }
        result = { accounts, count: accounts.length };
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
