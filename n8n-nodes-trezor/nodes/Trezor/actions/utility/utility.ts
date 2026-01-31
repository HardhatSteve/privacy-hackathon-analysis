/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const utilityOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['utility'] } },
    options: [
      { name: 'Convert Units', value: 'convertUnits', description: 'Convert between cryptocurrency units', action: 'Convert units' },
      { name: 'Parse Derivation Path', value: 'parsePath', description: 'Parse a BIP32 derivation path', action: 'Parse derivation path' },
      { name: 'Generate Path', value: 'generatePath', description: 'Generate a derivation path', action: 'Generate path' },
      { name: 'Validate Mnemonic', value: 'validateMnemonic', description: 'Validate a mnemonic phrase', action: 'Validate mnemonic' },
    ],
    default: 'convertUnits',
  },
];

export const utilityFields: INodeProperties[] = [
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'number',
    default: 0,
    required: true,
    displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
    description: 'The amount to convert',
  },
  {
    displayName: 'From Unit',
    name: 'fromUnit',
    type: 'options',
    options: [
      { name: 'BTC', value: 'btc' },
      { name: 'Satoshi', value: 'satoshi' },
      { name: 'mBTC', value: 'mbtc' },
      { name: 'ETH', value: 'eth' },
      { name: 'Wei', value: 'wei' },
      { name: 'Gwei', value: 'gwei' },
    ],
    default: 'btc',
    displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
    description: 'The source unit',
  },
  {
    displayName: 'To Unit',
    name: 'toUnit',
    type: 'options',
    options: [
      { name: 'BTC', value: 'btc' },
      { name: 'Satoshi', value: 'satoshi' },
      { name: 'mBTC', value: 'mbtc' },
      { name: 'ETH', value: 'eth' },
      { name: 'Wei', value: 'wei' },
      { name: 'Gwei', value: 'gwei' },
    ],
    default: 'satoshi',
    displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
    description: 'The target unit',
  },
  {
    displayName: 'Derivation Path',
    name: 'path',
    type: 'string',
    default: "m/84'/0'/0'/0/0",
    required: true,
    displayOptions: { show: { resource: ['utility'], operation: ['parsePath'] } },
    description: 'BIP32 derivation path to parse',
  },
  {
    displayName: 'Purpose',
    name: 'purpose',
    type: 'options',
    options: [
      { name: 'BIP44 (Legacy)', value: '44' },
      { name: 'BIP49 (SegWit Compatible)', value: '49' },
      { name: 'BIP84 (Native SegWit)', value: '84' },
      { name: 'BIP86 (Taproot)', value: '86' },
    ],
    default: '84',
    displayOptions: { show: { resource: ['utility'], operation: ['generatePath'] } },
    description: 'BIP purpose for the path',
  },
  {
    displayName: 'Coin Type',
    name: 'coinType',
    type: 'options',
    options: [
      { name: 'Bitcoin', value: '0' },
      { name: 'Testnet', value: '1' },
      { name: 'Litecoin', value: '2' },
      { name: 'Dogecoin', value: '3' },
      { name: 'Ethereum', value: '60' },
    ],
    default: '0',
    displayOptions: { show: { resource: ['utility'], operation: ['generatePath'] } },
    description: 'SLIP-0044 coin type',
  },
  {
    displayName: 'Account',
    name: 'account',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['utility'], operation: ['generatePath'] } },
    description: 'Account index',
  },
  {
    displayName: 'Change',
    name: 'change',
    type: 'options',
    options: [
      { name: 'External (Receiving)', value: '0' },
      { name: 'Internal (Change)', value: '1' },
    ],
    default: '0',
    displayOptions: { show: { resource: ['utility'], operation: ['generatePath'] } },
    description: 'Change chain (0 = external, 1 = internal)',
  },
  {
    displayName: 'Address Index',
    name: 'addressIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['utility'], operation: ['generatePath'] } },
    description: 'Address index',
  },
  {
    displayName: 'Mnemonic',
    name: 'mnemonic',
    type: 'string',
    typeOptions: { password: true },
    default: '',
    required: true,
    displayOptions: { show: { resource: ['utility'], operation: ['validateMnemonic'] } },
    description: 'The mnemonic phrase to validate (not stored, only validated)',
  },
];

export async function executeUtilityOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'convertUnits': {
        const amount = this.getNodeParameter('amount', index) as number;
        const fromUnit = this.getNodeParameter('fromUnit', index) as string;
        const toUnit = this.getNodeParameter('toUnit', index) as string;

        const toSatoshi: Record<string, number> = {
          btc: 100000000,
          satoshi: 1,
          mbtc: 100000,
        };
        const toWei: Record<string, bigint> = {
          eth: BigInt('1000000000000000000'),
          wei: BigInt(1),
          gwei: BigInt('1000000000'),
        };

        let converted: number | string;
        if (fromUnit in toSatoshi && toUnit in toSatoshi) {
          const inSatoshi = amount * toSatoshi[fromUnit];
          converted = inSatoshi / toSatoshi[toUnit];
        } else if (fromUnit in toWei && toUnit in toWei) {
          const inWei = BigInt(Math.floor(amount)) * toWei[fromUnit];
          converted = (Number(inWei) / Number(toWei[toUnit])).toString();
        } else {
          throw new Error('Cannot convert between different cryptocurrency types');
        }

        result = { amount, fromUnit, toUnit, converted };
        break;
      }
      case 'parsePath': {
        const path = this.getNodeParameter('path', index) as string;
        const HARDENED = 0x80000000;
        const components = path.replace(/^m\//, '').split('/');
        const parsed = components.map((c) => {
          const hardened = c.endsWith("'") || c.endsWith('h');
          const value = parseInt(c.replace(/['h]$/, ''), 10);
          return {
            value,
            hardened,
            fullValue: hardened ? value + HARDENED : value,
          };
        });

        result = {
          path,
          components: parsed,
          purpose: parsed[0]?.value,
          coinType: parsed[1]?.value,
          account: parsed[2]?.value,
          change: parsed[3]?.value,
          addressIndex: parsed[4]?.value,
          depth: parsed.length,
        };
        break;
      }
      case 'generatePath': {
        const purpose = this.getNodeParameter('purpose', index) as string;
        const coinType = this.getNodeParameter('coinType', index) as string;
        const account = this.getNodeParameter('account', index) as number;
        const change = this.getNodeParameter('change', index) as string;
        const addressIndex = this.getNodeParameter('addressIndex', index) as number;

        const path = `m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`;
        result = {
          path,
          purpose: parseInt(purpose),
          coinType: parseInt(coinType),
          account,
          change: parseInt(change),
          addressIndex,
        };
        break;
      }
      case 'validateMnemonic': {
        const mnemonic = this.getNodeParameter('mnemonic', index) as string;
        const words = mnemonic.trim().split(/\s+/);
        const validLengths = [12, 15, 18, 21, 24];
        const isValidLength = validLengths.includes(words.length);

        // Basic validation (in production, would use bip39 library)
        result = {
          valid: isValidLength,
          wordCount: words.length,
          expectedLengths: validLengths,
          message: isValidLength
            ? 'Mnemonic has valid word count'
            : `Invalid word count: ${words.length}. Expected: ${validLengths.join(', ')}`,
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
