/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const passphraseOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['passphrase'] } },
    options: [
      { name: 'Get Status', value: 'getStatus', description: 'Check if passphrase protection is enabled', action: 'Get passphrase status' },
      { name: 'Enable', value: 'enable', description: 'Enable passphrase protection', action: 'Enable passphrase' },
      { name: 'Disable', value: 'disable', description: 'Disable passphrase protection', action: 'Disable passphrase' },
      { name: 'Set Source', value: 'setSource', description: 'Set passphrase entry source', action: 'Set passphrase source' },
    ],
    default: 'getStatus',
  },
];

export const passphraseFields: INodeProperties[] = [
  {
    displayName: 'Passphrase Source',
    name: 'passphraseSource',
    type: 'options',
    options: [
      { name: 'Ask on Device', value: 'device' },
      { name: 'Ask on Host', value: 'host' },
    ],
    default: 'device',
    displayOptions: { show: { resource: ['passphrase'], operation: ['setSource'] } },
    description: 'Where to enter the passphrase',
  },
  {
    displayName: 'Notice',
    name: 'passphraseNotice',
    type: 'notice',
    default: '',
    displayOptions: { show: { resource: ['passphrase'], operation: ['enable', 'disable'] } },
    // eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
    description: 'WARNING: Changing passphrase settings affects wallet access. Ensure you understand the implications before proceeding.',
  },
];

export async function executePassphraseOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getStatus': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get features');
        const payload = features.payload as Record<string, unknown>;
        result = {
          passphraseProtection: payload.passphrase_protection ?? false,
          passphraseAlwaysOnDevice: payload.passphrase_always_on_device ?? false,
        };
        break;
      }
      case 'enable': {
        const response = await transport.applySettings({ use_passphrase: true });
        if (!response.success) throw new Error(response.error || 'Failed to enable passphrase');
        result = {
          message: 'Passphrase protection enabled',
          enabled: true,
        };
        break;
      }
      case 'disable': {
        const response = await transport.applySettings({ use_passphrase: false });
        if (!response.success) throw new Error(response.error || 'Failed to disable passphrase');
        result = {
          message: 'Passphrase protection disabled',
          enabled: false,
        };
        break;
      }
      case 'setSource': {
        const source = this.getNodeParameter('passphraseSource', index) as string;
        const onDevice = source === 'device';
        const response = await transport.applySettings({ passphrase_always_on_device: onDevice });
        if (!response.success) throw new Error(response.error || 'Failed to set passphrase source');
        result = {
          message: `Passphrase source set to ${source}`,
          source,
          alwaysOnDevice: onDevice,
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
