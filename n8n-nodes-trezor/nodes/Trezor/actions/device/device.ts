/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const deviceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['device'] } },
    options: [
      { name: 'Get Features', value: 'getFeatures', description: 'Get device features and info', action: 'Get device features' },
      { name: 'Ping', value: 'ping', description: 'Ping the device', action: 'Ping device' },
      { name: 'Wipe', value: 'wipe', description: 'Wipe device to factory state', action: 'Wipe device' },
      { name: 'Reset', value: 'reset', description: 'Initialize device with new seed', action: 'Reset device' },
      { name: 'Recover', value: 'recover', description: 'Recover device from seed', action: 'Recover device' },
      { name: 'Apply Settings', value: 'applySettings', description: 'Apply device settings', action: 'Apply settings' },
      { name: 'Get Device ID', value: 'getDeviceId', description: 'Get unique device identifier', action: 'Get device ID' },
    ],
    default: 'getFeatures',
  },
];

export const deviceFields: INodeProperties[] = [
  {
    displayName: 'Seed Strength',
    name: 'seedStrength',
    type: 'options',
    options: [
      { name: '12 Words (128-bit)', value: 128 },
      { name: '18 Words (192-bit)', value: 192 },
      { name: '24 Words (256-bit)', value: 256 },
    ],
    default: 256,
    displayOptions: { show: { resource: ['device'], operation: ['reset'] } },
    description: 'Strength of the seed phrase',
  },
  {
    displayName: 'Use Passphrase',
    name: 'usePassphrase',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['device'], operation: ['reset', 'applySettings'] } },
    description: 'Whether to enable passphrase protection',
  },
  {
    displayName: 'Device Label',
    name: 'deviceLabel',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['device'], operation: ['reset', 'applySettings'] } },
    description: 'Label to set for the device',
  },
  {
    displayName: 'Word Count',
    name: 'wordCount',
    type: 'options',
    options: [
      { name: '12 Words', value: 12 },
      { name: '18 Words', value: 18 },
      { name: '24 Words', value: 24 },
    ],
    default: 24,
    displayOptions: { show: { resource: ['device'], operation: ['recover'] } },
    description: 'Number of words in the seed phrase',
  },
  {
    displayName: 'Auto Lock Delay (Seconds)',
    name: 'autoLockDelay',
    type: 'number',
    default: 600,
    displayOptions: { show: { resource: ['device'], operation: ['applySettings'] } },
    description: 'Auto-lock delay in seconds',
  },
];

export async function executeDeviceOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getFeatures': {
        const response = await transport.getFeatures();
        if (!response.success) throw new Error(response.error || 'Failed to get features');
        result = { features: response.payload };
        break;
      }
      case 'ping': {
        result = { status: 'connected', timestamp: Date.now() };
        break;
      }
      case 'wipe': {
        const response = await transport.wipeDevice();
        if (!response.success) throw new Error(response.error || 'Failed to wipe device');
        result = { message: response.payload.message };
        break;
      }
      case 'reset': {
        const strength = this.getNodeParameter('seedStrength', index) as number;
        const usePassphrase = this.getNodeParameter('usePassphrase', index) as boolean;
        const label = this.getNodeParameter('deviceLabel', index) as string;
        const response = await transport.resetDevice({
          strength,
          passphrase_protection: usePassphrase,
          label,
        });
        if (!response.success) throw new Error(response.error || 'Failed to reset device');
        result = { message: response.payload.message };
        break;
      }
      case 'recover': {
        const wordCount = this.getNodeParameter('wordCount', index) as number;
        const usePassphrase = this.getNodeParameter('usePassphrase', index) as boolean;
        const response = await transport.recoverDevice({
          word_count: wordCount,
          passphrase_protection: usePassphrase,
        });
        if (!response.success) throw new Error(response.error || 'Failed to recover device');
        result = { message: response.payload.message };
        break;
      }
      case 'applySettings': {
        const settings: Record<string, unknown> = {};
        const label = this.getNodeParameter('deviceLabel', index, '') as string;
        const usePassphrase = this.getNodeParameter('usePassphrase', index, false) as boolean;
        const autoLockDelay = this.getNodeParameter('autoLockDelay', index, 600) as number;
        if (label) settings.label = label;
        settings.use_passphrase = usePassphrase;
        settings.auto_lock_delay_ms = autoLockDelay * 1000;
        const response = await transport.applySettings(settings);
        if (!response.success) throw new Error(response.error || 'Failed to apply settings');
        result = { message: response.payload.message };
        break;
      }
      case 'getDeviceId': {
        const response = await transport.getFeatures();
        if (!response.success) throw new Error(response.error || 'Failed to get device ID');
        result = { deviceId: String((response.payload as Record<string, unknown>).device_id || '') };
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
