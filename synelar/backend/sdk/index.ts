import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token"
import { BN } from "bn.js"

export const PROGRAM_ID = new PublicKey("SYNiD1111111111111111111111111111111111111")
export const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

export interface SynidConfig {
  rpcUrl: string
  programId?: PublicKey
}

export interface MintParams {
  name: string
  uri: string
  encryptedCid: string
  encryptionKeyHash: Uint8Array
}

export interface AccessRequestParams {
  synid: PublicKey
  fields: string[]
  offeredPayment: number
  expiresAt: number
}

export interface UpdateProfileParams {
  encryptedCid?: string
  encryptionKeyHash?: Uint8Array
}

export enum AccessStatus {
  Pending = 0,
  Approved = 1,
  Denied = 2,
  Expired = 3,
}

export interface SynidAccountData {
  owner: PublicKey
  mint: PublicKey
  encryptedCid: string
  encryptionKeyHash: Uint8Array
  createdAt: number
  updatedAt: number
  tokenId: number
  soulbound: boolean
  accessCount: number
  totalEarnings: number
  reputationScore: number
  verified: boolean
}

export interface AccessRequestData {
  synid: PublicKey
  requester: PublicKey
  fields: string[]
  offeredPayment: number
  createdAt: number
  expiresAt: number
  status: AccessStatus
}

export interface AccessGrantData {
  synid: PublicKey
  requester: PublicKey
  fields: string[]
  payment: number
  grantedAt: number
  expiresAt: number
  active: boolean
}

export class SynidSDK {
  private connection: Connection
  private programId: PublicKey

  constructor(config: SynidConfig) {
    this.connection = new Connection(config.rpcUrl, "confirmed")
    this.programId = config.programId || PROGRAM_ID
  }

  async getConfigPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync([Buffer.from("config")], this.programId)
  }

  async getSynidPDA(owner: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync([Buffer.from("synid"), owner.toBuffer()], this.programId)
  }

  async getMintAuthorityPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync([Buffer.from("mint_authority")], this.programId)
  }

  async getEscrowPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync([Buffer.from("escrow")], this.programId)
  }

  async getAccessRequestPDA(synid: PublicKey, requester: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("access_request"), synid.toBuffer(), requester.toBuffer()],
      this.programId,
    )
  }

  async getAccessGrantPDA(synid: PublicKey, requester: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("access_grant"), synid.toBuffer(), requester.toBuffer()],
      this.programId,
    )
  }

  async getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      METADATA_PROGRAM_ID,
    )
    return pda
  }

  async createInitializeTransaction(
    authority: PublicKey,
    treasury: PublicKey,
    mintPrice: number,
    accessFee: number,
  ): Promise<Transaction> {
    const [configPDA] = await this.getConfigPDA()

    const data = Buffer.concat([
      Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
      new BN(mintPrice).toArrayLike(Buffer, "le", 8),
      new BN(accessFee).toArrayLike(Buffer, "le", 8),
    ])

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = authority
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    return tx
  }

  async createMintTransaction(owner: PublicKey, params: MintParams): Promise<{ tx: Transaction; mint: Keypair }> {
    const [configPDA] = await this.getConfigPDA()
    const [synidPDA] = await this.getSynidPDA(owner)
    const [mintAuthority, mintAuthorityBump] = await this.getMintAuthorityPDA()

    const mint = Keypair.generate()
    const tokenAccount = await getAssociatedTokenAddress(mint.publicKey, owner)
    const metadata = await this.getMetadataPDA(mint.publicKey)

    const config = await this.getConfig()
    const treasury = config?.treasury || owner

    const data = this.encodeMintInstruction(params)

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: true },
        { pubkey: synidPDA, isSigner: false, isWritable: true },
        { pubkey: mint.publicKey, isSigner: true, isWritable: true },
        { pubkey: tokenAccount, isSigner: false, isWritable: true },
        { pubkey: mintAuthority, isSigner: false, isWritable: false },
        { pubkey: metadata, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = owner
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.partialSign(mint)

    return { tx, mint }
  }

  async createUpdateProfileTransaction(owner: PublicKey, params: UpdateProfileParams): Promise<Transaction> {
    const [synidPDA] = await this.getSynidPDA(owner)

    const data = this.encodeUpdateProfileInstruction(params)

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: synidPDA, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = owner
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    return tx
  }

  async createAccessRequestTransaction(requester: PublicKey, params: AccessRequestParams): Promise<Transaction> {
    const [configPDA] = await this.getConfigPDA()
    const [accessRequestPDA] = await this.getAccessRequestPDA(params.synid, requester)
    const [escrowPDA] = await this.getEscrowPDA()

    const data = this.encodeAccessRequestInstruction(params)

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: false },
        { pubkey: params.synid, isSigner: false, isWritable: false },
        { pubkey: accessRequestPDA, isSigner: false, isWritable: true },
        { pubkey: escrowPDA, isSigner: false, isWritable: true },
        { pubkey: requester, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = requester
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    return tx
  }

  async createApproveAccessTransaction(owner: PublicKey, synid: PublicKey, requester: PublicKey): Promise<Transaction> {
    const [configPDA] = await this.getConfigPDA()
    const [synidPDA] = await this.getSynidPDA(owner)
    const [accessRequestPDA] = await this.getAccessRequestPDA(synidPDA, requester)
    const [accessGrantPDA] = await this.getAccessGrantPDA(synidPDA, requester)
    const [escrowPDA] = await this.getEscrowPDA()
    const config = await this.getConfig()
    const treasury = config?.treasury || owner

    const data = Buffer.from([132, 77, 212, 59, 38, 167, 219, 127])

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: configPDA, isSigner: false, isWritable: false },
        { pubkey: synidPDA, isSigner: false, isWritable: true },
        { pubkey: accessRequestPDA, isSigner: false, isWritable: true },
        { pubkey: accessGrantPDA, isSigner: false, isWritable: true },
        { pubkey: escrowPDA, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: treasury, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = owner
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    return tx
  }

  async createDenyAccessTransaction(owner: PublicKey, synid: PublicKey, requester: PublicKey): Promise<Transaction> {
    const [synidPDA] = await this.getSynidPDA(owner)
    const [accessRequestPDA] = await this.getAccessRequestPDA(synidPDA, requester)
    const [escrowPDA] = await this.getEscrowPDA()

    const data = Buffer.from([149, 162, 129, 34, 185, 69, 102, 53])

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: synidPDA, isSigner: false, isWritable: false },
        { pubkey: accessRequestPDA, isSigner: false, isWritable: true },
        { pubkey: escrowPDA, isSigner: false, isWritable: true },
        { pubkey: requester, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = owner
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    return tx
  }

  async createRevokeAccessTransaction(owner: PublicKey, synid: PublicKey, requester: PublicKey): Promise<Transaction> {
    const [synidPDA] = await this.getSynidPDA(owner)
    const [accessGrantPDA] = await this.getAccessGrantPDA(synidPDA, requester)

    const data = Buffer.from([170, 200, 67, 147, 160, 184, 194, 12])

    const ix = new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: synidPDA, isSigner: false, isWritable: false },
        { pubkey: accessGrantPDA, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
      ],
      data,
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = owner
    const { blockhash } = await this.connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash

    return tx
  }

  private encodeMintInstruction(params: MintParams): Buffer {
    const discriminator = Buffer.from([51, 57, 225, 47, 182, 146, 137, 166])
    const nameLen = Buffer.alloc(4)
    nameLen.writeUInt32LE(params.name.length)
    const nameData = Buffer.from(params.name)
    const uriLen = Buffer.alloc(4)
    uriLen.writeUInt32LE(params.uri.length)
    const uriData = Buffer.from(params.uri)
    const cidLen = Buffer.alloc(4)
    cidLen.writeUInt32LE(params.encryptedCid.length)
    const cidData = Buffer.from(params.encryptedCid)
    const keyHash = Buffer.from(params.encryptionKeyHash)

    return Buffer.concat([discriminator, nameLen, nameData, uriLen, uriData, cidLen, cidData, keyHash])
  }

  private encodeUpdateProfileInstruction(params: UpdateProfileParams): Buffer {
    const discriminator = Buffer.from([98, 132, 12, 177, 193, 157, 95, 45])
    const buffers: Buffer[] = [discriminator]

    if (params.encryptedCid) {
      buffers.push(Buffer.from([1]))
      const cidLen = Buffer.alloc(4)
      cidLen.writeUInt32LE(params.encryptedCid.length)
      buffers.push(cidLen, Buffer.from(params.encryptedCid))
    } else {
      buffers.push(Buffer.from([0]))
    }

    if (params.encryptionKeyHash) {
      buffers.push(Buffer.from([1]), Buffer.from(params.encryptionKeyHash))
    } else {
      buffers.push(Buffer.from([0]))
    }

    return Buffer.concat(buffers)
  }

  private encodeAccessRequestInstruction(params: AccessRequestParams): Buffer {
    const discriminator = Buffer.from([233, 62, 224, 119, 117, 238, 114, 11])
    const fieldsLen = Buffer.alloc(4)
    fieldsLen.writeUInt32LE(params.fields.length)
    const fieldsData: Buffer[] = []
    for (const field of params.fields) {
      const fieldLen = Buffer.alloc(4)
      fieldLen.writeUInt32LE(field.length)
      fieldsData.push(fieldLen, Buffer.from(field))
    }
    const payment = new BN(params.offeredPayment).toArrayLike(Buffer, "le", 8)
    const expiresAt = new BN(params.expiresAt).toArrayLike(Buffer, "le", 8)

    return Buffer.concat([discriminator, fieldsLen, ...fieldsData, payment, expiresAt])
  }

  async getConfig(): Promise<{
    authority: PublicKey
    mintCount: number
    mintPrice: number
    accessFee: number
    treasury: PublicKey
    paused: boolean
    totalRevenue: number
  } | null> {
    const [configPDA] = await this.getConfigPDA()
    const account = await this.connection.getAccountInfo(configPDA)
    if (!account) return null

    const data = account.data
    return {
      authority: new PublicKey(data.slice(8, 40)),
      mintCount: new BN(data.slice(40, 48), "le").toNumber(),
      mintPrice: new BN(data.slice(48, 56), "le").toNumber(),
      accessFee: new BN(data.slice(56, 64), "le").toNumber(),
      treasury: new PublicKey(data.slice(64, 96)),
      paused: data[96] === 1,
      totalRevenue: new BN(data.slice(97, 105), "le").toNumber(),
    }
  }

  async getSynidAccount(owner: PublicKey): Promise<SynidAccountData | null> {
    const [synidPDA] = await this.getSynidPDA(owner)
    const account = await this.connection.getAccountInfo(synidPDA)
    if (!account) return null
    return this.decodeSynidAccount(account.data)
  }

  async getAccessRequest(synid: PublicKey, requester: PublicKey): Promise<AccessRequestData | null> {
    const [accessRequestPDA] = await this.getAccessRequestPDA(synid, requester)
    const account = await this.connection.getAccountInfo(accessRequestPDA)
    if (!account) return null
    return this.decodeAccessRequest(account.data)
  }

  async getAccessGrant(synid: PublicKey, requester: PublicKey): Promise<AccessGrantData | null> {
    const [accessGrantPDA] = await this.getAccessGrantPDA(synid, requester)
    const account = await this.connection.getAccountInfo(accessGrantPDA)
    if (!account) return null
    return this.decodeAccessGrant(account.data)
  }

  private decodeSynidAccount(data: Buffer): SynidAccountData {
    let offset = 8
    const owner = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    const mint = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    const cidLen = data.readUInt32LE(offset)
    offset += 4
    const encryptedCid = data.slice(offset, offset + cidLen).toString()
    offset += 128
    const encryptionKeyHash = new Uint8Array(data.slice(offset, offset + 32))
    offset += 32
    const createdAt = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const updatedAt = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const tokenId = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const soulbound = data[offset] === 1
    offset += 1
    const accessCount = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const totalEarnings = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const reputationScore = data.readUInt16LE(offset)
    offset += 2
    const verified = data[offset] === 1

    return {
      owner,
      mint,
      encryptedCid,
      encryptionKeyHash,
      createdAt,
      updatedAt,
      tokenId,
      soulbound,
      accessCount,
      totalEarnings,
      reputationScore,
      verified,
    }
  }

  private decodeAccessRequest(data: Buffer): AccessRequestData {
    let offset = 8
    const synid = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    const requester = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    const fieldsLen = data.readUInt32LE(offset)
    offset += 4
    const fields: string[] = []
    for (let i = 0; i < fieldsLen; i++) {
      const fieldLen = data.readUInt32LE(offset)
      offset += 4
      fields.push(data.slice(offset, offset + fieldLen).toString())
      offset += fieldLen
    }
    offset = 8 + 32 + 32 + 260
    const offeredPayment = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const createdAt = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const expiresAt = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const status = data[offset] as AccessStatus

    return { synid, requester, fields, offeredPayment, createdAt, expiresAt, status }
  }

  private decodeAccessGrant(data: Buffer): AccessGrantData {
    let offset = 8
    const synid = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    const requester = new PublicKey(data.slice(offset, offset + 32))
    offset += 32
    const fieldsLen = data.readUInt32LE(offset)
    offset += 4
    const fields: string[] = []
    for (let i = 0; i < fieldsLen; i++) {
      const fieldLen = data.readUInt32LE(offset)
      offset += 4
      fields.push(data.slice(offset, offset + fieldLen).toString())
      offset += fieldLen
    }
    offset = 8 + 32 + 32 + 260
    const payment = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const grantedAt = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const expiresAt = new BN(data.slice(offset, offset + 8), "le").toNumber()
    offset += 8
    const active = data[offset] === 1

    return { synid, requester, fields, payment, grantedAt, expiresAt, active }
  }

  async getBalance(address: PublicKey): Promise<number> {
    return this.connection.getBalance(address)
  }

  async requestAirdrop(address: PublicKey, amount = LAMPORTS_PER_SOL): Promise<string> {
    const sig = await this.connection.requestAirdrop(address, amount)
    await this.connection.confirmTransaction(sig)
    return sig
  }

  async getAllSynids(limit = 100): Promise<SynidAccountData[]> {
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [{ dataSize: 8 + 273 }],
    })

    return accounts.slice(0, limit).map((a) => this.decodeSynidAccount(a.account.data))
  }

  async getAccessHistory(synid: PublicKey): Promise<AccessGrantData[]> {
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [{ dataSize: 8 + 350 }, { memcmp: { offset: 8, bytes: synid.toBase58() } }],
    })

    return accounts.map((a) => this.decodeAccessGrant(a.account.data))
  }

  async getPendingRequests(synid: PublicKey): Promise<AccessRequestData[]> {
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [{ dataSize: 8 + 351 }, { memcmp: { offset: 8, bytes: synid.toBase58() } }],
    })

    return accounts
      .map((a) => this.decodeAccessRequest(a.account.data))
      .filter((r) => r.status === AccessStatus.Pending)
  }
}

export default SynidSDK
