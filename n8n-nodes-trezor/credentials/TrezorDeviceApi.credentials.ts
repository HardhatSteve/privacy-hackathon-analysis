/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TrezorDeviceApi implements ICredentialType {
  name = 'trezorDeviceApi';
  displayName = 'Trezor Device';
  documentationUrl = 'https://docs.trezor.io/trezor-suite/packages/connect/';

  properties: INodeProperties[] = [
    {
      displayName: 'Device Label',
      name: 'deviceLabel',
      type: 'string',
      default: '',
      description: 'Optional label to identify the Trezor device',
    },
    {
      displayName: 'Device Path',
      name: 'devicePath',
      type: 'string',
      default: '',
      description: 'USB path to the device (leave empty for auto-detection)',
    },
    {
      displayName: 'Use Passphrase',
      name: 'usePassphrase',
      type: 'boolean',
      default: false,
      description: 'Whether to use passphrase protection for this device',
    },
    {
      displayName: 'Default Account Index',
      name: 'defaultAccountIndex',
      type: 'number',
      default: 0,
      description: 'Default account index to use for operations',
    },
  ];
}
