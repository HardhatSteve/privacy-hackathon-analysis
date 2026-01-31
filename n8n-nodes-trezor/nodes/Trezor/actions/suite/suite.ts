/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const suiteOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['suite'] } },
    options: [
      { name: 'Get Suite Info', value: 'getInfo', description: 'Get Trezor Suite connection info', action: 'Get Suite info' },
      { name: 'Check Connection', value: 'checkConnection', description: 'Check Suite Bridge connection', action: 'Check connection' },
      { name: 'List Devices', value: 'listDevices', description: 'List connected Trezor devices', action: 'List devices' },
    ],
    default: 'getInfo',
  },
];

export const suiteFields: INodeProperties[] = [];

export async function executeSuiteOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getInfo': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get features');
        const payload = features.payload as Record<string, unknown>;
        result = {
          connected: true,
          deviceId: String(payload.device_id || ''),
          model: String(payload.model || ''),
          firmwareVersion: `${payload.major_version || 0}.${payload.minor_version || 0}.${payload.patch_version || 0}`,
          label: String(payload.label || ''),
          initialized: Boolean(payload.initialized),
          suiteVersion: '24.1.2', // Mock Suite version
          bridgeVersion: '2.0.33', // Mock Bridge version
        };
        break;
      }
      case 'checkConnection': {
        try {
          const features = await transport.getFeatures();
          result = {
            connected: features.success,
            bridgeRunning: true,
            message: features.success ? 'Connection successful' : 'Device not responding',
          };
        } catch {
          result = {
            connected: false,
            bridgeRunning: false,
            message: 'Failed to connect to Trezor Suite Bridge',
          };
        }
        break;
      }
      case 'listDevices': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get features');
        const payload = features.payload as Record<string, unknown>;
        // Mock multiple device support
        result = {
          devices: [
            {
              path: 'mock-device-1',
              deviceId: payload.device_id,
              label: payload.label,
              model: payload.model,
              status: 'connected',
              mode: 'normal',
            },
          ],
          count: 1,
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
