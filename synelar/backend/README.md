# SynID Solana Program

Soulbound Identity NFT Program for Synelar.

## Structure

- `programs/synid/` - Anchor/Rust smart contract
- `sdk/` - TypeScript SDK for interacting with the program
- `scripts/` - Deployment and initialization scripts
- `tests/` - Test files
- `target/idl/` - Generated IDL

## Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.29+
- Node.js 18+

## Setup

\`\`\`bash
# Install dependencies
yarn install

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Initialize the program
yarn initialize
\`\`\`

## Program Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize` | Initialize program config |
| `updateConfig` | Update mint price, access fee, pause state |
| `mintSynid` | Mint a new SynID NFT |
| `updateProfile` | Update encrypted profile CID |
| `requestAccess` | Request access to a SynID |
| `approveAccess` | Approve access request |
| `denyAccess` | Deny and refund access request |
| `revokeAccess` | Revoke previously granted access |
| `verifyIdentity` | Mark identity as verified (admin) |
| `updateReputation` | Update reputation score (admin) |
| `burnSynid` | Burn SynID NFT |
| `withdrawTreasury` | Withdraw treasury funds (admin) |

## PDAs

| PDA | Seeds |
|-----|-------|
| Config | `["config"]` |
| SynID Account | `["synid", owner]` |
| Mint Authority | `["mint_authority"]` |
| Escrow | `["escrow"]` |
| Access Request | `["access_request", synid, requester]` |
| Access Grant | `["access_grant", synid, requester]` |

## Events

- `SynidMinted` - Emitted when a new SynID is minted
- `ProfileUpdated` - Emitted when profile is updated
- `AccessRequested` - Emitted when access is requested
- `AccessApproved` - Emitted when access is approved
- `AccessDenied` - Emitted when access is denied
- `AccessRevoked` - Emitted when access is revoked
- `IdentityVerified` - Emitted when identity is verified
- `ReputationUpdated` - Emitted when reputation changes
- `SynidBurned` - Emitted when SynID is burned

## SDK Usage

\`\`\`typescript
import SynidSDK from "./sdk"

const sdk = new SynidSDK({ rpcUrl: "https://api.devnet.solana.com" })

// Get PDAs
const [configPDA] = await sdk.getConfigPDA()
const [synidPDA] = await sdk.getSynidPDA(ownerPublicKey)

// Create mint transaction
const { tx, mint } = await sdk.createMintTransaction(owner, {
  name: "SynID #1",
  uri: "https://...",
  encryptedCid: "Qm...",
  encryptionKeyHash: new Uint8Array(32)
})

// Get account data
const synidAccount = await sdk.getSynidAccount(owner)
const config = await sdk.getConfig()
