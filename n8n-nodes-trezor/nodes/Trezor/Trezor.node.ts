/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Import action operations and fields
import { deviceOperations, deviceFields, executeDeviceOperation } from './actions/device/device';
import { accountOperations, accountFields, executeAccountOperation } from './actions/account/account';
import { bitcoinOperations, bitcoinFields, executeBitcoinOperation } from './actions/bitcoin/bitcoin';
import { bitcoinLikeOperations, bitcoinLikeFields, executeBitcoinLikeOperation } from './actions/bitcoinLike/bitcoinLike';
import { ethereumOperations, ethereumFields, executeEthereumOperation } from './actions/ethereum/ethereum';
import { evmChainsOperations, evmChainsFields, executeEvmChainsOperation } from './actions/evmChains/evmChains';
import { cardanoOperations, cardanoFields, executeCardanoOperation } from './actions/cardano/cardano';
import { rippleOperations, rippleFields, executeRippleOperation } from './actions/ripple/ripple';
import { stellarOperations, stellarFields, executeStellarOperation } from './actions/stellar/stellar';
import { tezosOperations, tezosFields, executeTezosOperation } from './actions/tezos/tezos';
import { eosOperations, eosFields, executeEosOperation } from './actions/eos/eos';
import { binanceChainOperations, binanceChainFields, executeBinanceChainOperation } from './actions/binanceChain/binanceChain';
import { solanaOperations, solanaFields, executeSolanaOperation } from './actions/solana/solana';
import { multiCurrencyOperations, multiCurrencyFields, executeMultiCurrencyOperation } from './actions/multiCurrency/multiCurrency';
import { transactionOperations, transactionFields, executeTransactionOperation } from './actions/transaction/transaction';
import { addressOperations, addressFields, executeAddressOperation } from './actions/address/address';
import { signingOperations, signingFields, executeSigningOperation } from './actions/signing/signing';
import { passphraseOperations, passphraseFields, executePassphraseOperation } from './actions/passphrase/passphrase';
import { backupOperations, backupFields, executeBackupOperation } from './actions/backup/backup';
import { securityOperations, securityFields, executeSecurityOperation } from './actions/security/security';
import { coinjoinOperations, coinjoinFields, executeCoinjoinOperation } from './actions/coinjoin/coinjoin';
import { firmwareOperations, firmwareFields, executeFirmwareOperation } from './actions/firmware/firmware';
import { labelOperations, labelFields, executeLabelOperation } from './actions/label/label';
import { webauthnOperations, webauthnFields, executeWebauthnOperation } from './actions/webauthn/webauthn';
import { suiteOperations, suiteFields, executeSuiteOperation } from './actions/suite/suite';
import { utilityOperations, utilityFields, executeUtilityOperation } from './actions/utility/utility';

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

export class Trezor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Trezor',
		name: 'trezor',
		icon: 'file:trezor.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Trezor hardware wallet for cryptocurrency operations',
		defaults: {
			name: 'Trezor',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'trezorConnectApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Address', value: 'address' },
					{ name: 'Backup', value: 'backup' },
					{ name: 'Binance Chain', value: 'binanceChain' },
					{ name: 'Bitcoin', value: 'bitcoin' },
					{ name: 'Bitcoin-Like', value: 'bitcoinLike' },
					{ name: 'Cardano', value: 'cardano' },
					{ name: 'CoinJoin', value: 'coinjoin' },
					{ name: 'Device', value: 'device' },
					{ name: 'EOS', value: 'eos' },
					{ name: 'Ethereum', value: 'ethereum' },
					{ name: 'EVM Chains', value: 'evmChains' },
					{ name: 'Firmware', value: 'firmware' },
					{ name: 'Label', value: 'label' },
					{ name: 'Multi-Currency', value: 'multiCurrency' },
					{ name: 'Passphrase', value: 'passphrase' },
					{ name: 'Ripple (XRP)', value: 'ripple' },
					{ name: 'Security', value: 'security' },
					{ name: 'Signing', value: 'signing' },
					{ name: 'Solana', value: 'solana' },
					{ name: 'Stellar', value: 'stellar' },
					{ name: 'Suite', value: 'suite' },
					{ name: 'Tezos', value: 'tezos' },
					{ name: 'Transaction', value: 'transaction' },
					{ name: 'Utility', value: 'utility' },
					{ name: 'WebAuthn (FIDO2)', value: 'webauthn' },
				],
				default: 'device',
			},
			// Operations
			...deviceOperations,
			...accountOperations,
			...bitcoinOperations,
			...bitcoinLikeOperations,
			...ethereumOperations,
			...evmChainsOperations,
			...cardanoOperations,
			...rippleOperations,
			...stellarOperations,
			...tezosOperations,
			...eosOperations,
			...binanceChainOperations,
			...solanaOperations,
			...multiCurrencyOperations,
			...transactionOperations,
			...addressOperations,
			...signingOperations,
			...passphraseOperations,
			...backupOperations,
			...securityOperations,
			...coinjoinOperations,
			...firmwareOperations,
			...labelOperations,
			...webauthnOperations,
			...suiteOperations,
			...utilityOperations,
			// Fields
			...deviceFields,
			...accountFields,
			...bitcoinFields,
			...bitcoinLikeFields,
			...ethereumFields,
			...evmChainsFields,
			...cardanoFields,
			...rippleFields,
			...stellarFields,
			...tezosFields,
			...eosFields,
			...binanceChainFields,
			...solanaFields,
			...multiCurrencyFields,
			...transactionFields,
			...addressFields,
			...signingFields,
			...passphraseFields,
			...backupFields,
			...securityFields,
			...coinjoinFields,
			...firmwareFields,
			...labelFields,
			...webauthnFields,
			...suiteFields,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		logLicenseNotice();

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let result: INodeExecutionData[];

				switch (resource) {
					case 'device':
						result = await executeDeviceOperation.call(this, i);
						break;
					case 'account':
						result = await executeAccountOperation.call(this, i);
						break;
					case 'bitcoin':
						result = await executeBitcoinOperation.call(this, i);
						break;
					case 'bitcoinLike':
						result = await executeBitcoinLikeOperation.call(this, i);
						break;
					case 'ethereum':
						result = await executeEthereumOperation.call(this, i);
						break;
					case 'evmChains':
						result = await executeEvmChainsOperation.call(this, i);
						break;
					case 'cardano':
						result = await executeCardanoOperation.call(this, i);
						break;
					case 'ripple':
						result = await executeRippleOperation.call(this, i);
						break;
					case 'stellar':
						result = await executeStellarOperation.call(this, i);
						break;
					case 'tezos':
						result = await executeTezosOperation.call(this, i);
						break;
					case 'eos':
						result = await executeEosOperation.call(this, i);
						break;
					case 'binanceChain':
						result = await executeBinanceChainOperation.call(this, i);
						break;
					case 'solana':
						result = await executeSolanaOperation.call(this, i);
						break;
					case 'multiCurrency':
						result = await executeMultiCurrencyOperation.call(this, i);
						break;
					case 'transaction':
						result = await executeTransactionOperation.call(this, i);
						break;
					case 'address':
						result = await executeAddressOperation.call(this, i);
						break;
					case 'signing':
						result = await executeSigningOperation.call(this, i);
						break;
					case 'passphrase':
						result = await executePassphraseOperation.call(this, i);
						break;
					case 'backup':
						result = await executeBackupOperation.call(this, i);
						break;
					case 'security':
						result = await executeSecurityOperation.call(this, i);
						break;
					case 'coinjoin':
						result = await executeCoinjoinOperation.call(this, i);
						break;
					case 'firmware':
						result = await executeFirmwareOperation.call(this, i);
						break;
					case 'label':
						result = await executeLabelOperation.call(this, i);
						break;
					case 'webauthn':
						result = await executeWebauthnOperation.call(this, i);
						break;
					case 'suite':
						result = await executeSuiteOperation.call(this, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
