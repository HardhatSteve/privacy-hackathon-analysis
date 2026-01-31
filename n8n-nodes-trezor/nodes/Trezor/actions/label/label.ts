/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const labelOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['label'] } },
    options: [
      { name: 'Get Label', value: 'getLabel', description: 'Get device label', action: 'Get device label' },
      { name: 'Set Label', value: 'setLabel', description: 'Set device label', action: 'Set device label' },
      { name: 'Clear Label', value: 'clearLabel', description: 'Clear device label', action: 'Clear device label' },
    ],
    default: 'getLabel',
  },
];

export const labelFields: INodeProperties[] = [
  {
    displayName: 'Device Label',
    name: 'deviceLabel',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['label'], operation: ['setLabel'] } },
    description: 'The label to set for the device (max 16 characters)',
  },
];

export async function executeLabelOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'getLabel': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get features');
        const payload = features.payload as Record<string, unknown>;
        result = {
          label: String(payload.label || ''),
          deviceId: String(payload.device_id || ''),
        };
        break;
      }
      case 'setLabel': {
        const label = this.getNodeParameter('deviceLabel', index) as string;
        if (label.length > 16) {
          throw new Error('Device label must be 16 characters or less');
        }
        const response = await transport.applySettings({ label });
        if (!response.success) throw new Error(response.error || 'Failed to set label');
        result = {
          message: response.payload.message,
          label,
        };
        break;
      }
      case 'clearLabel': {
        const response = await transport.applySettings({ label: '' });
        if (!response.success) throw new Error(response.error || 'Failed to clear label');
        result = {
          message: 'Label cleared successfully',
          label: '',
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
