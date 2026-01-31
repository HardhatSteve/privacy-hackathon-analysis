/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const firmwareOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['firmware'] } },
    options: [
      { name: 'Get Version', value: 'getVersion', description: 'Get current firmware version', action: 'Get firmware version' },
      { name: 'Check Update', value: 'checkUpdate', description: 'Check for firmware updates', action: 'Check for updates' },
      { name: 'Get Release Info', value: 'getReleaseInfo', description: 'Get firmware release information', action: 'Get release info' },
    ],
    default: 'getVersion',
  },
];

export const firmwareFields: INodeProperties[] = [
  {
    displayName: 'Device Model',
    name: 'deviceModel',
    type: 'options',
    options: [
      { name: 'Trezor One', value: '1' },
      { name: 'Trezor Model T', value: 'T' },
      { name: 'Trezor Safe 3', value: 'Safe3' },
      { name: 'Trezor Safe 5', value: 'Safe5' },
    ],
    default: 'T',
    displayOptions: { show: { resource: ['firmware'], operation: ['checkUpdate', 'getReleaseInfo'] } },
    description: 'The Trezor device model',
  },
];

export async function executeFirmwareOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getVersion': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get features');
        const payload = features.payload as Record<string, unknown>;
        result = {
          major: Number(payload.major_version || 0),
          minor: Number(payload.minor_version || 0),
          patch: Number(payload.patch_version || 0),
          version: `${payload.major_version || 0}.${payload.minor_version || 0}.${payload.patch_version || 0}`,
          bootloaderMode: Boolean(payload.bootloader_mode),
          model: String(payload.model || ''),
        };
        break;
      }
      case 'checkUpdate': {
        const deviceModel = this.getNodeParameter('deviceModel', index) as string;
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get features');
        const payload = features.payload as Record<string, unknown>;
        const currentVersion = `${payload.major_version}.${payload.minor_version}.${payload.patch_version}`;
        // Mock latest versions
        const latestVersions: Record<string, string> = {
          '1': '1.12.1',
          'T': '2.6.4',
          'Safe3': '2.6.4',
          'Safe5': '2.6.4',
        };
        const latestVersion = latestVersions[deviceModel] || '2.6.4';
        result = {
          currentVersion,
          latestVersion,
          updateAvailable: currentVersion !== latestVersion,
          deviceModel,
        };
        break;
      }
      case 'getReleaseInfo': {
        const deviceModel = this.getNodeParameter('deviceModel', index) as string;
        // Mock release info
        result = {
          deviceModel,
          releases: [
            {
              version: '2.6.4',
              releaseDate: '2024-01-15',
              changelog: 'Security improvements and bug fixes',
              required: false,
            },
            {
              version: '2.6.3',
              releaseDate: '2023-11-20',
              changelog: 'Added Taproot support improvements',
              required: false,
            },
          ],
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
