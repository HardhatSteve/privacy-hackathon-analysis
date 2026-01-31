// Default RPC endpoint (encoded to discourage casual extraction)
const _RPC_ENCODED = 'aHR0cHM6Ly9zZXJlbmUtcm91Z2gtcG9vbC5zb2xhbmEtbWFpbm5ldC5xdWlrbm9kZS5wcm8vYTliM2RkNGRkMzc0MzYwYzQzNzY4YzQyMTI2NmE2ZGNlZDU4MTI3Ny8=';
const DEFAULT_RPC_URL = atob(_RPC_ENCODED);

// Browser-compatible RPC client
export class BrowserRPCClient {
  private endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || DEFAULT_RPC_URL;
  }

  async call(method: string, params: any[] = []) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://solana-privacy-scanner.app',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    })

    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`)
    }

    return data.result
  }

  async getSignaturesForAddress(address: string, options: any = {}) {
    return this.call('getSignaturesForAddress', [address, options])
  }

  async getTransaction(signature: string) {
    return this.call('getTransaction', [signature, { maxSupportedTransactionVersion: 0 }])
  }

  async getMultipleAccountsInfo(pubkeys: string[]) {
    return this.call('getMultipleAccountsInfo', [pubkeys, { encoding: 'jsonParsed' }])
  }
}
