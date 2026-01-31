/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface DeviceModel {
  id: string;
  name: string;
  vendorId: number;
  productId: number;
  supportsBip39Passphrase: boolean;
  supportsShamir: boolean;
  hasSecureElement: boolean;
  hasTouchscreen: boolean;
  maxPinLength: number;
}

export const TREZOR_MODELS: DeviceModel[] = [
  {
    id: '1',
    name: 'Trezor Model One',
    vendorId: 0x534c,
    productId: 0x0001,
    supportsBip39Passphrase: true,
    supportsShamir: false,
    hasSecureElement: false,
    hasTouchscreen: false,
    maxPinLength: 9,
  },
  {
    id: 'T',
    name: 'Trezor Model T',
    vendorId: 0x1209,
    productId: 0x53c1,
    supportsBip39Passphrase: true,
    supportsShamir: true,
    hasSecureElement: false,
    hasTouchscreen: true,
    maxPinLength: 50,
  },
  {
    id: 'Safe3',
    name: 'Trezor Safe 3',
    vendorId: 0x1209,
    productId: 0x53c1,
    supportsBip39Passphrase: true,
    supportsShamir: true,
    hasSecureElement: true,
    hasTouchscreen: false,
    maxPinLength: 50,
  },
  {
    id: 'Safe5',
    name: 'Trezor Safe 5',
    vendorId: 0x1209,
    productId: 0x53c1,
    supportsBip39Passphrase: true,
    supportsShamir: true,
    hasSecureElement: true,
    hasTouchscreen: true,
    maxPinLength: 50,
  },
];

export const DEVICE_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  BOOTLOADER: 'bootloader',
  INITIALIZE: 'initialize',
  SEEDLESS: 'seedless',
  ACQUIRED: 'acquired',
  USED: 'used',
} as const;

export type DeviceState = (typeof DEVICE_STATES)[keyof typeof DEVICE_STATES];

export const DEFAULT_DERIVATION_PATHS: Record<string, string> = {
  bitcoin: "m/84'/0'/0'",
  bitcoinLegacy: "m/44'/0'/0'",
  bitcoinSegwit: "m/49'/0'/0'",
  bitcoinTaproot: "m/86'/0'/0'",
  ethereum: "m/44'/60'/0'/0",
  cardano: "m/1852'/1815'/0'",
  solana: "m/44'/501'/0'/0'",
  ripple: "m/44'/144'/0'/0/0",
  stellar: "m/44'/148'/0'",
  tezos: "m/44'/1729'/0'/0'",
  litecoin: "m/84'/2'/0'",
  dogecoin: "m/44'/3'/0'",
  binance: "m/44'/714'/0'/0/0",
};

export function getDeviceModel(modelId: string): DeviceModel | undefined {
  return TREZOR_MODELS.find((model) => model.id === modelId);
}

export function getDefaultPath(coin: string): string {
  return DEFAULT_DERIVATION_PATHS[coin.toLowerCase()] ?? DEFAULT_DERIVATION_PATHS.bitcoin;
}
