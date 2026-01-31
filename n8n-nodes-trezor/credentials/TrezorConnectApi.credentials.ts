/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TrezorConnectApi implements ICredentialType {
  name = 'trezorConnectApi';
  displayName = 'Trezor Connect';
  documentationUrl = 'https://docs.trezor.io/trezor-suite/packages/connect/';

  properties: INodeProperties[] = [
    {
      displayName: 'Manifest Email',
      name: 'manifestEmail',
      type: 'string',
      default: '',
      required: true,
      description: 'Contact email for the application (required by Trezor Connect)',
    },
    {
      displayName: 'Manifest App URL',
      name: 'manifestAppUrl',
      type: 'string',
      default: '',
      required: true,
      description: 'URL of the application using Trezor Connect',
    },
    {
      displayName: 'Bridge URL',
      name: 'bridgeUrl',
      type: 'string',
      default: 'http://127.0.0.1:21325',
      description: 'URL of the Trezor Bridge service',
    },
    {
      displayName: 'Webusb',
      name: 'webusb',
      type: 'boolean',
      default: false,
      description: 'Whether to use WebUSB for device communication',
    },
    {
      displayName: 'Debug Mode',
      name: 'debug',
      type: 'boolean',
      default: false,
      description: 'Whether to enable debug logging',
    },
    {
      displayName: 'Lazy Load',
      name: 'lazyLoad',
      type: 'boolean',
      default: true,
      description: 'Whether to lazy load Trezor Connect',
    },
  ];
}
