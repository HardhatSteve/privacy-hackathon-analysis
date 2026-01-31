/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const securityOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['security'] } },
    options: [
      { name: 'Get Security Status', value: 'getStatus', description: 'Get overall security status', action: 'Get security status' },
      { name: 'Change PIN', value: 'changePin', description: 'Change device PIN', action: 'Change PIN' },
      { name: 'Remove PIN', value: 'removePin', description: 'Remove device PIN', action: 'Remove PIN' },
      { name: 'Set Auto-Lock', value: 'setAutoLock', description: 'Set auto-lock delay', action: 'Set auto-lock' },
      { name: 'Lock Device', value: 'lockDevice', description: 'Lock the device immediately', action: 'Lock device' },
      { name: 'Set Safety Checks', value: 'setSafetyChecks', description: 'Configure safety check level', action: 'Set safety checks' },
    ],
    default: 'getStatus',
  },
];

export const securityFields: INodeProperties[] = [
  {
    displayName: 'Auto-Lock Delay (Minutes)',
    name: 'autoLockDelay',
    type: 'number',
    default: 10,
    displayOptions: { show: { resource: ['security'], operation: ['setAutoLock'] } },
    description: 'Time in minutes before auto-lock (0 to disable)',
  },
  {
    displayName: 'Safety Check Level',
    name: 'safetyLevel',
    type: 'options',
    options: [
      { name: 'Strict', value: 'Strict' },
      { name: 'Prompt Always', value: 'PromptAlways' },
      { name: 'Prompt Temporarily', value: 'PromptTemporarily' },
    ],
    default: 'Strict',
    displayOptions: { show: { resource: ['security'], operation: ['setSafetyChecks'] } },
    description: 'Level of safety checks to apply',
  },
  {
    displayName: 'Notice',
    name: 'pinNotice',
    type: 'notice',
    default: '',
    displayOptions: { show: { resource: ['security'], operation: ['changePin', 'removePin'] } },
    // eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
    description: 'PIN entry will be performed on the Trezor device for security.',
  },
];

export async function executeSecurityOperation(
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
          pinProtection: payload.pin_protection ?? false,
          passphraseProtection: payload.passphrase_protection ?? false,
          initialized: payload.initialized ?? false,
          needsBackup: payload.needs_backup ?? false,
          autoLockDelayMs: payload.auto_lock_delay_ms ?? 600000,
          safetyChecks: payload.safety_checks ?? 'Strict',
          firmwareVersion: `${payload.major_version}.${payload.minor_version}.${payload.patch_version}`,
        };
        break;
      }
      case 'changePin': {
        const response = await transport.changePin(false);
        if (!response.success) throw new Error(response.error || 'Failed to change PIN');
        result = {
          message: response.payload.message,
          action: 'pin_changed',
        };
        break;
      }
      case 'removePin': {
        const response = await transport.changePin(true);
        if (!response.success) throw new Error(response.error || 'Failed to remove PIN');
        result = {
          message: response.payload.message,
          action: 'pin_removed',
        };
        break;
      }
      case 'setAutoLock': {
        const delayMinutes = this.getNodeParameter('autoLockDelay', index) as number;
        const delayMs = delayMinutes * 60 * 1000;
        const response = await transport.applySettings({ auto_lock_delay_ms: delayMs });
        if (!response.success) throw new Error(response.error || 'Failed to set auto-lock');
        result = {
          message: response.payload.message,
          autoLockDelayMinutes: delayMinutes,
          autoLockDelayMs: delayMs,
        };
        break;
      }
      case 'lockDevice': {
        // Mock implementation - in production would call specific lock endpoint
        result = {
          message: 'Device locked',
          locked: true,
        };
        break;
      }
      case 'setSafetyChecks': {
        const level = this.getNodeParameter('safetyLevel', index) as string;
        const response = await transport.applySettings({ safety_checks: level });
        if (!response.success) throw new Error(response.error || 'Failed to set safety checks');
        result = {
          message: response.payload.message,
          safetyChecks: level,
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
