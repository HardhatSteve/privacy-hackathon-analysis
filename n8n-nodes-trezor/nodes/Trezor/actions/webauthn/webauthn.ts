/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { INodeProperties, IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { getTrezorTransport } from '../../transport';

export const webauthnOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['webauthn'] } },
    options: [
      { name: 'List Credentials', value: 'listCredentials', description: 'List stored WebAuthn credentials', action: 'List credentials' },
      { name: 'Add Credential', value: 'addCredential', description: 'Add a new WebAuthn credential', action: 'Add credential' },
      { name: 'Remove Credential', value: 'removeCredential', description: 'Remove a WebAuthn credential', action: 'Remove credential' },
      { name: 'Get Assertion', value: 'getAssertion', description: 'Generate WebAuthn assertion', action: 'Get assertion' },
    ],
    default: 'listCredentials',
  },
];

export const webauthnFields: INodeProperties[] = [
  {
    displayName: 'Relying Party ID',
    name: 'rpId',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential', 'getAssertion'] } },
    description: 'The relying party identifier (e.g., example.com)',
  },
  {
    displayName: 'Relying Party Name',
    name: 'rpName',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential'] } },
    description: 'Human-readable name of the relying party',
  },
  {
    displayName: 'User ID',
    name: 'userId',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential'] } },
    description: 'Unique user identifier',
  },
  {
    displayName: 'User Name',
    name: 'userName',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential'] } },
    description: 'Human-readable user name',
  },
  {
    displayName: 'User Display Name',
    name: 'userDisplayName',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential'] } },
    description: 'User display name',
  },
  {
    displayName: 'Credential Index',
    name: 'credentialIndex',
    type: 'number',
    default: 0,
    required: true,
    displayOptions: { show: { resource: ['webauthn'], operation: ['removeCredential'] } },
    description: 'Index of the credential to remove',
  },
  {
    displayName: 'Challenge',
    name: 'challenge',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['webauthn'], operation: ['getAssertion'] } },
    description: 'Challenge from the relying party (base64 encoded)',
  },
  {
    displayName: 'Require User Verification',
    name: 'userVerification',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential', 'getAssertion'] } },
    description: 'Whether to require user verification (PIN/biometric)',
  },
  {
    displayName: 'Resident Key',
    name: 'residentKey',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['webauthn'], operation: ['addCredential'] } },
    description: 'Whether to create a resident (discoverable) credential',
  },
];

export async function executeWebauthnOperation(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', index) as string;
  const transport = await getTrezorTransport(this);

  try {
    let result: IDataObject;

    switch (operation) {
      case 'listCredentials': {
        // Mock implementation - in production would call device
        result = {
          credentials: [
            {
              index: 0,
              rpId: 'example.com',
              rpName: 'Example Site',
              userId: 'user123',
              userName: 'john@example.com',
              creationTime: '2024-01-15T10:30:00Z',
            },
          ],
          count: 1,
          nextIndex: 1,
        };
        break;
      }
      case 'addCredential': {
        const rpId = this.getNodeParameter('rpId', index) as string;
        const rpName = this.getNodeParameter('rpName', index, rpId) as string;
        const userId = this.getNodeParameter('userId', index) as string;
        const userName = this.getNodeParameter('userName', index, '') as string;
        const userDisplayName = this.getNodeParameter('userDisplayName', index, userName) as string;
        const userVerification = this.getNodeParameter('userVerification', index) as boolean;
        const residentKey = this.getNodeParameter('residentKey', index) as boolean;

        // Mock implementation
        result = {
          created: true,
          credential: {
            rpId,
            rpName,
            userId,
            userName,
            userDisplayName,
            credentialId: '0x' + '0'.repeat(64),
            publicKey: '0x' + '0'.repeat(130),
            attestation: '0x' + '0'.repeat(200),
          },
          options: {
            userVerification,
            residentKey,
          },
        };
        break;
      }
      case 'removeCredential': {
        const credentialIndex = this.getNodeParameter('credentialIndex', index) as number;

        // Mock implementation
        result = {
          removed: true,
          credentialIndex,
          message: `Credential at index ${credentialIndex} removed`,
        };
        break;
      }
      case 'getAssertion': {
        const rpId = this.getNodeParameter('rpId', index) as string;
        const challenge = this.getNodeParameter('challenge', index) as string;
        const userVerification = this.getNodeParameter('userVerification', index) as boolean;

        // Mock implementation
        result = {
          rpId,
          challenge,
          assertion: {
            credentialId: '0x' + '0'.repeat(64),
            authenticatorData: '0x' + '0'.repeat(74),
            signature: '0x' + '0'.repeat(128),
            userHandle: '0x' + '0'.repeat(32),
          },
          userVerified: userVerification,
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
