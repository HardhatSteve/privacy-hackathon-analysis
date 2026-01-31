import type { ScanContext, PrivacySignal, Evidence } from '../types/index.js';

/**
 * Detect identity metadata exposure
 *
 * NFT creation via Metaplex permanently links a wallet to creator identity.
 * .sol domain registration via Bonfida Name Service creates a direct,
 * public mapping between a wallet address and a human-readable name.
 */

const METAPLEX_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
const BONFIDA_NAME_SERVICE = 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX';

export function detectIdentityMetadataExposure(context: ScanContext): PrivacySignal[] {
  const signals: PrivacySignal[] = [];

  if (!context.instructions || context.instructions.length === 0) {
    return signals;
  }

  // Signal 1: Metaplex NFT program interactions
  const metaplexInstructions = context.instructions.filter(
    inst => inst.programId === METAPLEX_PROGRAM
  );

  if (metaplexInstructions.length > 0) {
    const creationInstructions = metaplexInstructions.filter(inst => {
      if (inst.data && typeof inst.data === 'object') {
        const type = (inst.data as Record<string, unknown>).type;
        return typeof type === 'string' && /create|mint|update/i.test(type);
      }
      // If we can't determine the instruction type, flag all Metaplex interactions
      return true;
    });

    if (creationInstructions.length > 0) {
      const evidence: Evidence[] = creationInstructions.slice(0, 5).map(inst => ({
        description: `Metaplex interaction in tx ${inst.signature.slice(0, 8)}...`,
        severity: 'MEDIUM' as const,
        reference: `https://solscan.io/tx/${inst.signature}`,
      }));

      signals.push({
        id: 'nft-metadata-exposure',
        name: 'NFT Creation Links Wallet to Creator Identity',
        severity: 'MEDIUM',
        category: 'exposure',
        confidence: 0.75,
        reason: `This wallet has ${creationInstructions.length} interaction(s) with the Metaplex NFT program. If you created or updated NFTs, the on-chain metadata permanently links your wallet to that content. Anyone who knows the NFT creator can identify this wallet.`,
        impact: 'NFT metadata is public and permanent. Creating NFTs ties your wallet address to your creator identity forever.',
        mitigation: 'Use a dedicated wallet for NFT creation that is not connected to your other activities. Do not use the same wallet for creating NFTs and personal transactions.',
        evidence,
      });
    }
  }

  // Signal 2: Bonfida Name Service (.sol domain) interactions
  const bonfidaInstructions = context.instructions.filter(
    inst => inst.programId === BONFIDA_NAME_SERVICE
  );

  if (bonfidaInstructions.length > 0) {
    const evidence: Evidence[] = bonfidaInstructions.slice(0, 5).map(inst => ({
      description: `Bonfida Name Service interaction in tx ${inst.signature.slice(0, 8)}...`,
      severity: 'HIGH' as const,
      reference: `https://solscan.io/tx/${inst.signature}`,
    }));

    signals.push({
      id: 'domain-name-linkage',
      name: '.sol Domain Name Links Wallet to Identity',
      severity: 'HIGH',
      category: 'exposure',
      confidence: 0.9,
      reason: `This wallet interacted with the Solana Name Service (Bonfida) ${bonfidaInstructions.length} time(s). If you registered a .sol domain, your wallet address is now publicly tied to that human-readable name. Anyone can look up your domain and find this wallet, or look up this wallet and find your domain.`,
      impact: 'A .sol domain creates a direct, permanent, public link between your wallet and a human-readable identity.',
      mitigation: 'Use a separate wallet for domain registration. Do not register a .sol domain on a wallet you want to keep private. If you already have, consider that wallet permanently identified.',
      evidence,
    });
  }

  return signals;
}
