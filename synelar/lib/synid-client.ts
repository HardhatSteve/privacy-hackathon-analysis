import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { type PhantomProvider, SOLANA_CONFIG } from "./solana"

export class SynidClient {
  private connection: Connection
  private provider: PhantomProvider | null

  constructor() {
    this.connection = new Connection(SOLANA_CONFIG.rpcUrl, "confirmed")
    this.provider = null
  }

  setProvider(provider: PhantomProvider) {
    this.provider = provider
  }

  getProvider(): PhantomProvider | null {
    return this.provider
  }

  async getBalance(): Promise<number> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")
    const balance = await this.connection.getBalance(new PublicKey(this.provider.publicKey.toString()))
    return balance / LAMPORTS_PER_SOL
  }

  async requestAirdrop(amount = 1): Promise<string> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")
    const response = await fetch("/api/synid/airdrop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: this.provider.publicKey.toString() }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    return data.signature
  }

  async mintSynid(metadataUri: string, encryptedCid: string): Promise<{ signature: string; mint: string }> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")

    const ownerPubkey = new PublicKey(this.provider.publicKey.toString())
    const { blockhash } = await this.connection.getLatestBlockhash()

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = ownerPubkey

    tx.add(
      SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: ownerPubkey,
        lamports: 0,
      }),
    )

    const signedTx = await this.provider.signTransaction(tx)
    const signature = await this.connection.sendRawTransaction(signedTx.serialize())
    await this.connection.confirmTransaction(signature)

    return {
      signature,
      mint: ownerPubkey.toString().slice(0, 44),
    }
  }

  async updateProfile(encryptedCid: string): Promise<string> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")

    const ownerPubkey = new PublicKey(this.provider.publicKey.toString())
    const { blockhash } = await this.connection.getLatestBlockhash()

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = ownerPubkey

    tx.add(
      SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: ownerPubkey,
        lamports: 0,
      }),
    )

    const signedTx = await this.provider.signTransaction(tx)
    const signature = await this.connection.sendRawTransaction(signedTx.serialize())
    await this.connection.confirmTransaction(signature)

    return signature
  }

  async requestAccess(synidOwner: string, fields: string[], paymentLamports: number): Promise<string> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")

    const requesterPubkey = new PublicKey(this.provider.publicKey.toString())
    const ownerPubkey = new PublicKey(synidOwner)
    const { blockhash } = await this.connection.getLatestBlockhash()

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = requesterPubkey

    tx.add(
      SystemProgram.transfer({
        fromPubkey: requesterPubkey,
        toPubkey: ownerPubkey,
        lamports: paymentLamports,
      }),
    )

    const signedTx = await this.provider.signTransaction(tx)
    const signature = await this.connection.sendRawTransaction(signedTx.serialize())
    await this.connection.confirmTransaction(signature)

    return signature
  }

  async approveAccess(requester: string): Promise<string> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")

    const ownerPubkey = new PublicKey(this.provider.publicKey.toString())
    const { blockhash } = await this.connection.getLatestBlockhash()

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = ownerPubkey

    tx.add(
      SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: ownerPubkey,
        lamports: 0,
      }),
    )

    const signedTx = await this.provider.signTransaction(tx)
    const signature = await this.connection.sendRawTransaction(signedTx.serialize())
    await this.connection.confirmTransaction(signature)

    await fetch("/api/synid/approve-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        synidOwner: this.provider.publicKey.toString(),
        requester,
        signature,
      }),
    })

    return signature
  }

  async denyAccess(requester: string): Promise<string> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")

    const ownerPubkey = new PublicKey(this.provider.publicKey.toString())
    const { blockhash } = await this.connection.getLatestBlockhash()

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = ownerPubkey

    tx.add(
      SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: ownerPubkey,
        lamports: 0,
      }),
    )

    const signedTx = await this.provider.signTransaction(tx)
    const signature = await this.connection.sendRawTransaction(signedTx.serialize())
    await this.connection.confirmTransaction(signature)

    await fetch("/api/synid/deny-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        synidOwner: this.provider.publicKey.toString(),
        requester,
        signature,
      }),
    })

    return signature
  }

  async revokeAccess(requester: string): Promise<string> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")

    const ownerPubkey = new PublicKey(this.provider.publicKey.toString())
    const { blockhash } = await this.connection.getLatestBlockhash()

    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = ownerPubkey

    tx.add(
      SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: ownerPubkey,
        lamports: 0,
      }),
    )

    const signedTx = await this.provider.signTransaction(tx)
    const signature = await this.connection.sendRawTransaction(signedTx.serialize())
    await this.connection.confirmTransaction(signature)

    await fetch("/api/synid/revoke-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        synidOwner: this.provider.publicKey.toString(),
        requester,
        signature,
      }),
    })

    return signature
  }

  async getEarnings(): Promise<any> {
    if (!this.provider?.publicKey) throw new Error("Wallet not connected")
    const response = await fetch(`/api/synid/earnings?wallet=${this.provider.publicKey.toString()}`)
    return response.json()
  }

  async fetchProfile(cid: string): Promise<any> {
    const response = await fetch(`/api/synid/profile?cid=${cid}`)
    return response.json()
  }

  async verifySynid(signature: string): Promise<boolean> {
    const tx = await this.connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 })
    return tx?.meta?.err === null
  }

  getExplorerUrl(signature: string): string {
    return `${SOLANA_CONFIG.explorerUrl}/tx/${signature}?cluster=${SOLANA_CONFIG.network}`
  }

  getAddressExplorerUrl(address: string): string {
    return `${SOLANA_CONFIG.explorerUrl}/address/${address}?cluster=${SOLANA_CONFIG.network}`
  }
}

export const synidClient = new SynidClient()
