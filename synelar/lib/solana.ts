import {
  type Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js"
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from "@solana/spl-token"

export const SOLANA_CONFIG = {
  network: "devnet" as const,
  rpcUrl: "https://api.devnet.solana.com",
  explorerUrl: "https://explorer.solana.com",
}

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

export interface PhantomProvider {
  isPhantom: boolean
  publicKey: { toString: () => string; toBytes: () => Uint8Array }
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  signTransaction: (transaction: any) => Promise<any>
  signAllTransactions: (transactions: any[]) => Promise<any[]>
  on: (event: string, callback: (args: any) => void) => void
  off: (event: string, callback: (args: any) => void) => void
}

export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") return null
  const provider = (window as any).phantom?.solana
  if (provider?.isPhantom) {
    return provider as PhantomProvider
  }
  return null
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function createSolanaMetadata(
  name: string,
  bio: string,
  twitter: string,
  github: string,
  walletAddress: string,
  encryptedCid: string,
) {
  return {
    name: `SynID #${walletAddress.slice(-6)}`,
    symbol: "SYNID",
    description: `Soulbound Identity NFT for ${name}. Encrypted profile data stored on IPFS.`,
    image: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
    external_url: `https://gateway.pinata.cloud/ipfs/${encryptedCid}`,
    attributes: [
      { trait_type: "Type", value: "SynID" },
      { trait_type: "Soulbound", value: "true" },
      { trait_type: "Chain", value: "Solana" },
      { trait_type: "Network", value: "Devnet" },
      { trait_type: "Encrypted", value: "AES-256-GCM" },
      { trait_type: "IPFS CID", value: encryptedCid },
    ],
    properties: {
      files: [],
      category: "identity",
      creators: [{ address: walletAddress, share: 100 }],
    },
  }
}

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )
  return pda
}

function serializeString(str: string): Buffer {
  const strBuffer = Buffer.from(str, "utf8")
  const lenBuffer = Buffer.alloc(4)
  lenBuffer.writeUInt32LE(strBuffer.length, 0)
  return Buffer.concat([lenBuffer, strBuffer])
}

function serializeCreators(creators: Array<{ address: PublicKey; verified: boolean; share: number }>): Buffer {
  const hasCreators = Buffer.from([1])
  const creatorsLen = Buffer.alloc(4)
  creatorsLen.writeUInt32LE(creators.length, 0)

  const creatorBuffers = creators.map((c) => {
    return Buffer.concat([c.address.toBuffer(), Buffer.from([c.verified ? 1 : 0]), Buffer.from([c.share])])
  })

  return Buffer.concat([hasCreators, creatorsLen, ...creatorBuffers])
}

function createCreateMetadataAccountV3Instruction(
  metadataPDA: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string,
): TransactionInstruction {
  const trimmedName = name.substring(0, 32)
  const trimmedSymbol = symbol.substring(0, 10)
  const trimmedUri = uri.substring(0, 200)

  const instructionDiscriminator = Buffer.from([33])
  const nameData = serializeString(trimmedName)
  const symbolData = serializeString(trimmedSymbol)
  const uriData = serializeString(trimmedUri)
  const sellerFeeBasisPoints = Buffer.alloc(2)
  sellerFeeBasisPoints.writeUInt16LE(0, 0)
  const creators = serializeCreators([{ address: payer, verified: true, share: 100 }])
  const collection = Buffer.from([0])
  const uses = Buffer.from([0])
  const isMutable = Buffer.from([0])
  const collectionDetails = Buffer.from([0])

  const data = Buffer.concat([
    instructionDiscriminator,
    nameData,
    symbolData,
    uriData,
    sellerFeeBasisPoints,
    creators,
    collection,
    uses,
    isMutable,
    collectionDetails,
  ])

  const keys = [
    { pubkey: metadataPDA, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: mintAuthority, isSigner: true, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: updateAuthority, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: new PublicKey("Sysvar1nstructions1111111111111111111111111"), isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({
    keys,
    programId: TOKEN_METADATA_PROGRAM_ID,
    data,
  })
}

export async function createMintNFTTransaction(
  connection: Connection,
  payer: PublicKey,
  metadataUri: string,
  name: string,
  symbol: string,
): Promise<{ transaction: Transaction; mint: Keypair }> {
  console.log("[v0] Creating mint NFT transaction...")
  console.log("[v0] Payer:", payer.toString())
  console.log("[v0] Metadata URI:", metadataUri)

  const mint = Keypair.generate()
  console.log("[v0] Generated mint keypair:", mint.publicKey.toString())

  const lamports = await getMinimumBalanceForRentExemptMint(connection)
  console.log("[v0] Rent exempt lamports:", lamports)

  const associatedTokenAccount = await getAssociatedTokenAddress(mint.publicKey, payer)
  console.log("[v0] Associated token account:", associatedTokenAccount.toString())

  const metadataPDA = getMetadataPDA(mint.publicKey)
  console.log("[v0] Metadata PDA:", metadataPDA.toString())

  const transaction = new Transaction()

  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
  )

  transaction.add(createInitializeMintInstruction(mint.publicKey, 0, payer, payer, TOKEN_PROGRAM_ID))

  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAccount,
      payer,
      mint.publicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
  )

  transaction.add(createMintToInstruction(mint.publicKey, associatedTokenAccount, payer, 1, [], TOKEN_PROGRAM_ID))

  const metadataInstruction = createCreateMetadataAccountV3Instruction(
    metadataPDA,
    mint.publicKey,
    payer,
    payer,
    payer,
    name,
    symbol,
    metadataUri,
  )
  transaction.add(metadataInstruction)

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
  transaction.recentBlockhash = blockhash
  transaction.lastValidBlockHeight = lastValidBlockHeight
  transaction.feePayer = payer

  transaction.partialSign(mint)
  console.log("[v0] Transaction created and partially signed")

  return { transaction, mint }
}

export async function checkBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(publicKey)
  return balance / LAMPORTS_PER_SOL
}

export async function requestAirdrop(connection: Connection, publicKey: PublicKey): Promise<string> {
  const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL)
  const latestBlockhash = await connection.getLatestBlockhash()
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  })
  return signature
}
