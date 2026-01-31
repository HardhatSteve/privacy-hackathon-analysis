/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const backupOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['backup'] } },
    options: [
      { name: 'Start Backup', value: 'startBackup', description: 'Initiate seed backup process', action: 'Start backup' },
      { name: 'Verify Backup', value: 'verifyBackup', description: 'Verify existing backup', action: 'Verify backup' },
      { name: 'Get Backup Status', value: 'getStatus', description: 'Check backup status', action: 'Get backup status' },
    ],
    default: 'getStatus',
  },
];

export const backupFields: INodeProperties[] = [
  {
    displayName: 'Notice',
    name: 'backupNotice',
    type: 'notice',
    default: '',
    displayOptions: { show: { resource: ['backup'], operation: ['startBackup'] } },
    // eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
    description: 'WARNING: The backup process will display your seed phrase on the device. Ensure you are in a private location and ready to write down your seed phrase.',
  },
];

export async function executeBackupOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'startBackup': {
        const response = await transport.backupDevice();
        if (!response.success) throw new Error(response.error || 'Failed to start backup');
        result = { message: response.payload.message, status: 'backup_initiated' };
        break;
      }
      case 'verifyBackup': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get device features');
        const payload = features.payload as Record<string, unknown>;
        const needsBackup = payload.needs_backup as boolean;
        result = {
          verified: !needsBackup,
          message: needsBackup ? 'Backup not completed' : 'Backup verified',
        };
        break;
      }
      case 'getStatus': {
        const features = await transport.getFeatures();
        if (!features.success) throw new Error(features.error || 'Failed to get device features');
        const payload = features.payload as Record<string, unknown>;
        result = {
          needsBackup: payload.needs_backup ?? false,
          unfinishedBackup: payload.unfinished_backup ?? false,
          noBackup: payload.no_backup ?? false,
          initialized: payload.initialized ?? false,
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
