/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	IDataObject,
} from 'n8n-workflow';

// Log licensing notice once per node load
let licenseNoticeLogged = false;
function logLicenseNotice(): void {
	if (!licenseNoticeLogged) {
		console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
		licenseNoticeLogged = true;
	}
}

export class TrezorTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trezor Trigger',
		name: 'trezorTrigger',
		icon: 'file:trezor.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["eventType"]}}',
		description: 'Trigger workflows on Trezor device events',
		defaults: {
			name: 'Trezor Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'trezorConnectApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{
						name: 'Device Connected',
						value: 'device-connect',
						description: 'Triggers when a Trezor device is connected',
					},
					{
						name: 'Device Disconnected',
						value: 'device-disconnect',
						description: 'Triggers when a Trezor device is disconnected',
					},
					{
						name: 'Device Changed',
						value: 'device-changed',
						description: 'Triggers when device state changes',
					},
					{
						name: 'Button Request',
						value: 'button',
						description: 'Triggers when device requests button confirmation',
					},
					{
						name: 'PIN Request',
						value: 'pin',
						description: 'Triggers when device requests PIN entry',
					},
					{
						name: 'Passphrase Request',
						value: 'passphrase',
						description: 'Triggers when device requests passphrase',
					},
					{
						name: 'Transport Error',
						value: 'transport-error',
						description: 'Triggers on transport/connection errors',
					},
				],
				default: 'device-connect',
				description: 'The type of event to listen for',
			},
			{
				displayName: 'Device Filter',
				name: 'deviceFilter',
				type: 'options',
				options: [
					{ name: 'Any Device', value: 'any' },
					{ name: 'Specific Device ID', value: 'specific' },
				],
				default: 'any',
				description: 'Filter events by device',
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						deviceFilter: ['specific'],
					},
				},
				description: 'The specific device ID to listen for',
			},
			{
				displayName: 'Include Device Info',
				name: 'includeDeviceInfo',
				type: 'boolean',
				default: true,
				description: 'Whether to include full device information in the event data',
			},
			{
				displayName: 'Poll Interval (Seconds)',
				name: 'pollInterval',
				type: 'number',
				default: 5,
				description: 'How often to check for device events',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		logLicenseNotice();

		const eventType = this.getNodeParameter('eventType') as string;
		const deviceFilter = this.getNodeParameter('deviceFilter') as string;
		const deviceId = this.getNodeParameter('deviceId', '') as string;
		const includeDeviceInfo = this.getNodeParameter('includeDeviceInfo') as boolean;
		const pollInterval = this.getNodeParameter('pollInterval') as number;

		let lastDeviceState: string | null = null;

		const checkForEvents = async () => {
			try {
				// Mock event detection - in production would use Trezor Connect events
				const currentState = 'connected';
				const hasChanged = lastDeviceState !== currentState;

				if (hasChanged) {
					lastDeviceState = currentState;

					// Generate event based on type
					let eventData: IDataObject = {
						eventType,
						timestamp: new Date().toISOString(),
					};

					if (includeDeviceInfo) {
						eventData = {
							...eventData,
							device: {
								deviceId: deviceId || 'mock-device-id',
								model: 'T',
								label: 'My Trezor',
								firmwareVersion: '2.6.0',
								status: currentState,
							},
						};
					}

					// Check device filter
					if (deviceFilter === 'specific' && deviceId) {
						if (eventData.device && (eventData.device as Record<string, unknown>).deviceId !== deviceId) {
							return; // Skip if device doesn't match
						}
					}

					switch (eventType) {
						case 'device-connect':
							eventData.message = 'Trezor device connected';
							break;
						case 'device-disconnect':
							eventData.message = 'Trezor device disconnected';
							break;
						case 'device-changed':
							eventData.message = 'Trezor device state changed';
							eventData.previousState = lastDeviceState;
							eventData.currentState = currentState;
							break;
						case 'button':
							eventData.message = 'Button confirmation requested on device';
							eventData.buttonCode = 'ButtonRequest_ConfirmOutput';
							break;
						case 'pin':
							eventData.message = 'PIN entry requested';
							break;
						case 'passphrase':
							eventData.message = 'Passphrase entry requested';
							eventData.onDevice = true;
							break;
						case 'transport-error':
							eventData.message = 'Transport error occurred';
							eventData.error = 'Connection lost';
							break;
					}

					this.emit([this.helpers.returnJsonArray([eventData])]);
				}
			} catch (error) {
				// Emit error event
				this.emit([
					this.helpers.returnJsonArray([
						{
							eventType: 'error',
							error: (error as Error).message,
							timestamp: new Date().toISOString(),
						},
					]),
				]);
			}
		};

		// Start polling
		const intervalId = setInterval(checkForEvents, pollInterval * 1000);

		// Initial check
		await checkForEvents();

		// Cleanup function
		const closeFunction = async () => {
			clearInterval(intervalId);
		};

		return {
			closeFunction,
		};
	}
}
