/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export interface TrezorConnectConfig {
  manifestEmail: string;
  manifestAppUrl: string;
  bridgeUrl?: string;
  webusb?: boolean;
  debug?: boolean;
  lazyLoad?: boolean;
}

export interface TrezorDevice {
  path: string;
  label: string;
  deviceId: string;
  status: string;
  mode: string;
  firmware: string;
  model: string;
}

export interface TrezorResponse<T> {
  success: boolean;
  payload: T;
  error?: string;
}

export interface PublicKey {
  path: number[];
  serializedPath: string;
  publicKey: string;
  node: {
    depth: number;
    fingerprint: number;
    childNum: number;
    chainCode: string;
    publicKey: string;
  };
}

export interface Address {
  address: string;
  path: number[];
  serializedPath: string;
}

export interface SignedTransaction {
  signatures: string[];
  serializedTx: string;
  txid?: string;
}

export interface SignedMessage {
  address: string;
  signature: string;
}

/**
 * Mock Trezor Connect implementation for n8n environment
 * In production, this would interface with the actual Trezor Connect SDK
 */
export class TrezorTransport {
  private config: TrezorConnectConfig;
  private initialized: boolean = false;

  constructor(config: TrezorConnectConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }

  async getFeatures(): Promise<TrezorResponse<Record<string, unknown>>> {
    return {
      success: true,
      payload: {
        vendor: 'trezor.io',
        major_version: 2,
        minor_version: 6,
        patch_version: 0,
        bootloader_mode: false,
        device_id: 'mock-device-id',
        pin_protection: true,
        passphrase_protection: false,
        language: 'en-US',
        label: 'My Trezor',
        initialized: true,
        model: 'T',
        fw_major: 2,
        fw_minor: 6,
        fw_patch: 0,
      },
    };
  }

  async getPublicKey(
    path: string,
    coin: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<PublicKey>> {
    const pathArray = this.parsePath(path);
    return {
      success: true,
      payload: {
        path: pathArray,
        serializedPath: path,
        publicKey: '0x' + '0'.repeat(66),
        node: {
          depth: pathArray.length,
          fingerprint: 0,
          childNum: pathArray[pathArray.length - 1] || 0,
          chainCode: '0x' + '0'.repeat(64),
          publicKey: '0x' + '0'.repeat(66),
        },
      },
    };
  }

  async getAddress(
    path: string,
    coin: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<Address>> {
    const pathArray = this.parsePath(path);
    return {
      success: true,
      payload: {
        address: this.generateMockAddress(coin),
        path: pathArray,
        serializedPath: path,
      },
    };
  }

  async signTransaction(
    coin: string,
    inputs: unknown[],
    outputs: unknown[],
    options?: Record<string, unknown>,
  ): Promise<TrezorResponse<SignedTransaction>> {
    return {
      success: true,
      payload: {
        signatures: ['0x' + '0'.repeat(128)],
        serializedTx: '0x' + '0'.repeat(200),
        txid: '0x' + '0'.repeat(64),
      },
    };
  }

  async signMessage(
    path: string,
    message: string,
    coin: string,
  ): Promise<TrezorResponse<SignedMessage>> {
    return {
      success: true,
      payload: {
        address: this.generateMockAddress(coin),
        signature: '0x' + '0'.repeat(130),
      },
    };
  }

  async verifyMessage(
    address: string,
    message: string,
    signature: string,
    coin: string,
  ): Promise<TrezorResponse<{ valid: boolean }>> {
    return {
      success: true,
      payload: { valid: true },
    };
  }

  async ethereumSignTransaction(
    path: string,
    transaction: Record<string, unknown>,
  ): Promise<TrezorResponse<{ v: string; r: string; s: string }>> {
    return {
      success: true,
      payload: {
        v: '0x1c',
        r: '0x' + '0'.repeat(64),
        s: '0x' + '0'.repeat(64),
      },
    };
  }

  async ethereumSignMessage(
    path: string,
    message: string,
  ): Promise<TrezorResponse<SignedMessage>> {
    return {
      success: true,
      payload: {
        address: '0x' + '0'.repeat(40),
        signature: '0x' + '0'.repeat(130),
      },
    };
  }

  async ethereumSignTypedData(
    path: string,
    data: Record<string, unknown>,
    metamaskV4Compat: boolean = true,
  ): Promise<TrezorResponse<SignedMessage>> {
    return {
      success: true,
      payload: {
        address: '0x' + '0'.repeat(40),
        signature: '0x' + '0'.repeat(130),
      },
    };
  }

  async cardanoGetAddress(
    path: string,
    stakingPath?: string,
    networkId: number = 1,
  ): Promise<TrezorResponse<Address>> {
    return {
      success: true,
      payload: {
        address: 'addr1' + '0'.repeat(58),
        path: this.parsePath(path),
        serializedPath: path,
      },
    };
  }

  async cardanoSignTransaction(
    inputs: unknown[],
    outputs: unknown[],
    fee: string,
    ttl: string,
    certificates?: unknown[],
    withdrawals?: unknown[],
    metadata?: unknown,
  ): Promise<TrezorResponse<SignedTransaction>> {
    return {
      success: true,
      payload: {
        signatures: ['0x' + '0'.repeat(128)],
        serializedTx: '0x' + '0'.repeat(400),
      },
    };
  }

  async solanaGetAddress(
    path: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<Address>> {
    return {
      success: true,
      payload: {
        address: '0'.repeat(44),
        path: this.parsePath(path),
        serializedPath: path,
      },
    };
  }

  async solanaSignTransaction(
    path: string,
    serializedTx: string,
  ): Promise<TrezorResponse<{ signature: string }>> {
    return {
      success: true,
      payload: {
        signature: '0x' + '0'.repeat(128),
      },
    };
  }

  async rippleGetAddress(
    path: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<Address>> {
    return {
      success: true,
      payload: {
        address: 'r' + '0'.repeat(33),
        path: this.parsePath(path),
        serializedPath: path,
      },
    };
  }

  async rippleSignTransaction(
    path: string,
    transaction: Record<string, unknown>,
  ): Promise<TrezorResponse<SignedTransaction>> {
    return {
      success: true,
      payload: {
        signatures: ['0x' + '0'.repeat(128)],
        serializedTx: '0x' + '0'.repeat(200),
      },
    };
  }

  async stellarGetAddress(
    path: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<Address>> {
    return {
      success: true,
      payload: {
        address: 'G' + '0'.repeat(55),
        path: this.parsePath(path),
        serializedPath: path,
      },
    };
  }

  async stellarSignTransaction(
    path: string,
    networkPassphrase: string,
    transaction: Record<string, unknown>,
  ): Promise<TrezorResponse<{ signature: string }>> {
    return {
      success: true,
      payload: {
        signature: '0x' + '0'.repeat(128),
      },
    };
  }

  async tezosGetAddress(
    path: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<Address>> {
    return {
      success: true,
      payload: {
        address: 'tz1' + '0'.repeat(33),
        path: this.parsePath(path),
        serializedPath: path,
      },
    };
  }

  async tezosSignTransaction(
    path: string,
    branch: string,
    operation: Record<string, unknown>,
  ): Promise<TrezorResponse<{ signature: string; sigOpContents: string }>> {
    return {
      success: true,
      payload: {
        signature: 'edsig' + '0'.repeat(94),
        sigOpContents: '0x' + '0'.repeat(200),
      },
    };
  }

  async eosGetPublicKey(
    path: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<{ wifPublicKey: string; rawPublicKey: string }>> {
    return {
      success: true,
      payload: {
        wifPublicKey: 'EOS' + '0'.repeat(50),
        rawPublicKey: '0x' + '0'.repeat(66),
      },
    };
  }

  async eosSignTransaction(
    path: string,
    transaction: Record<string, unknown>,
  ): Promise<TrezorResponse<{ signature: string }>> {
    return {
      success: true,
      payload: {
        signature: 'SIG_K1_' + '0'.repeat(50),
      },
    };
  }

  async binanceGetAddress(
    path: string,
    showOnDevice: boolean = false,
  ): Promise<TrezorResponse<Address>> {
    return {
      success: true,
      payload: {
        address: 'bnb1' + '0'.repeat(38),
        path: this.parsePath(path),
        serializedPath: path,
      },
    };
  }

  async binanceSignTransaction(
    path: string,
    transaction: Record<string, unknown>,
  ): Promise<TrezorResponse<{ signature: string; publicKey: string }>> {
    return {
      success: true,
      payload: {
        signature: '0x' + '0'.repeat(128),
        publicKey: '0x' + '0'.repeat(66),
      },
    };
  }

  async wipeDevice(): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: 'Device wiped successfully' },
    };
  }

  async resetDevice(options: Record<string, unknown>): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: 'Device reset successfully' },
    };
  }

  async recoverDevice(options: Record<string, unknown>): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: 'Device recovered successfully' },
    };
  }

  async changePin(remove: boolean = false): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: remove ? 'PIN removed' : 'PIN changed successfully' },
    };
  }

  async applySettings(settings: Record<string, unknown>): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: 'Settings applied successfully' },
    };
  }

  async backupDevice(): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: 'Backup completed successfully' },
    };
  }

  async firmwareUpdate(firmware: Buffer): Promise<TrezorResponse<{ message: string }>> {
    return {
      success: true,
      payload: { message: 'Firmware update initiated' },
    };
  }

  private parsePath(path: string): number[] {
    const HARDENED_OFFSET = 0x80000000;
    return path
      .replace(/^m\//, '')
      .split('/')
      .filter((p) => p)
      .map((p) => {
        const hardened = p.endsWith("'") || p.endsWith('h');
        const num = parseInt(p.replace(/['h]$/, ''), 10);
        return hardened ? num + HARDENED_OFFSET : num;
      });
  }

  private generateMockAddress(coin: string): string {
    const prefixes: Record<string, string> = {
      btc: 'bc1q',
      bitcoin: 'bc1q',
      ltc: 'ltc1q',
      litecoin: 'ltc1q',
      eth: '0x',
      ethereum: '0x',
      doge: 'D',
      dogecoin: 'D',
    };
    const prefix = prefixes[coin.toLowerCase()] ?? 'addr';
    const length = coin.toLowerCase().includes('eth') ? 40 : 32;
    return prefix + '0'.repeat(length);
  }
}

export async function getTrezorTransport(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialType: string = 'trezorConnectApi',
): Promise<TrezorTransport> {
  const credentials = await context.getCredentials(credentialType);

  const config: TrezorConnectConfig = {
    manifestEmail: credentials.manifestEmail as string,
    manifestAppUrl: credentials.manifestAppUrl as string,
    bridgeUrl: credentials.bridgeUrl as string,
    webusb: credentials.webusb as boolean,
    debug: credentials.debug as boolean,
    lazyLoad: credentials.lazyLoad as boolean,
  };

  const transport = new TrezorTransport(config);
  await transport.init();

  return transport;
}
