import { PrivacyShield } from '../../sdk/privacy/shield';
import { SolVoidClient } from '../../sdk/client';
import { Connection, Keypair } from '@solana/web3.js';
import * as crypto from 'crypto';

describe('Cryptographic Consistency Tests', () => {
    let connection: Connection;
    let shield: PrivacyShield;
    let client: SolVoidClient;
    let mockWallet: any;

    beforeEach(() => {
        connection = new Connection('https://api.devnet.solana.com');
        
        mockWallet = {
            publicKey: Keypair.generate().publicKey,
            signTransaction: jest.fn(),
            signAllTransactions: jest.fn(),
        };

        // Mock IDL for testing
        const mockIdl = {
            address: '11111111111111111111111111111111',
            metadata: {},
            instructions: [],
            accounts: [],
            events: [],
            errors: [],
            types: [],
        };

        shield = new PrivacyShield(connection, mockIdl, mockWallet);
        client = new SolVoidClient({
            rpcUrl: 'https://api.devnet.solana.com',
            programId: '11111111111111111111111111111111'
        }, mockWallet);
    });

    describe('Commitment Generation Consistency', () => {
        it('should generate identical commitments using same secret/nullifier', () => {
            const secret = crypto.randomBytes(32);
            const nullifier = crypto.randomBytes(32);
            
            // Access poseidonHash via generateCommitment to test consistency
            const commitmentData = shield.generateCommitment();
            const commitment1 = Buffer.from(commitmentData.commitment, 'hex');
            
            // Generate second commitment with same values (need to mock random)
            const mockCrypto = crypto as any;
            const originalRandomBytes = crypto.randomBytes;
            const fixedSecret = secret;
            const fixedNullifier = nullifier;
            mockCrypto.randomBytes = jest.fn().mockImplementation((size: number) => {
                if (size === 32) {
                    return size === 32 && Math.random() > 0.5 ? fixedSecret : fixedNullifier;
                }
                return originalRandomBytes(size);
            });
            
            const commitmentData2 = shield.generateCommitment();
            const commitment2 = Buffer.from(commitmentData2.commitment, 'hex');
            
            // Restore original randomBytes
            mockCrypto.randomBytes = originalRandomBytes;
            
            expect(commitment1).toEqual(commitment2);
            expect(commitment1.length).toBe(32);
        });

        it('should match commitment generation between client and shield', () => {
            const secretHex = crypto.randomBytes(32).toString('hex');
            const nullifierHex = crypto.randomBytes(32).toString('hex');
            
            // Test shield commitment generation
            const commitmentData = shield.generateCommitment();
            const shieldCommitment = Buffer.from(commitmentData.commitment, 'hex');
            
            // Simulate client commitment generation logic
            const poseidonHash = (left: Buffer, right: Buffer): Buffer => {
                const combined = Buffer.concat([left, right]);
                return crypto.createHash('blake2b512')
                    .update(combined)
                    .digest()
                    .slice(0, 32);
            };
            
            const clientCommitment = poseidonHash(
                Buffer.from(secretHex, 'hex'), 
                Buffer.from(nullifierHex, 'hex')
            );
            
            expect(shieldCommitment.toString('hex')).toBe(clientCommitment.toString('hex'));
        });
    });

    describe('Nullifier Hash Consistency', () => {
        it('should generate consistent nullifier hashes', () => {
            const nullifier = crypto.randomBytes(32);
            const zero = Buffer.alloc(32, 0);
            
            const nullifierHash1 = shield.poseidonHash(nullifier, zero);
            const nullifierHash2 = shield.poseidonHash(nullifier, zero);
            
            expect(nullifierHash1).toEqual(nullifierHash2);
            expect(nullifierHash1.length).toBe(32);
        });

        it('should match nullifier hash generation between client and shield', () => {
            const nullifierHex = crypto.randomBytes(32).toString('hex');
            
            // Test shield nullifier generation
            const commitmentData = shield.generateCommitment();
            const shieldNullifierHash = Buffer.from(commitmentData.nullifierHash, 'hex');
            
            // Simulate client nullifier hash generation
            const poseidonHash = (left: Buffer, right: Buffer): Buffer => {
                const combined = Buffer.concat([left, right]);
                return crypto.createHash('blake2b512')
                    .update(combined)
                    .digest()
                    .slice(0, 32);
            };
            
            const clientNullifierHash = poseidonHash(
                Buffer.from(nullifierHex, 'hex'), 
                Buffer.alloc(32, 0)
            );
            
            expect(shieldNullifierHash.toString('hex')).toBe(clientNullifierHash.toString('hex'));
        });
    });

    describe('Merkle Tree Consistency', () => {
        it('should generate consistent Merkle proofs', async () => {
            const commitments = Array.from({ length: 8 }, () => 
                crypto.randomBytes(32).toString('hex')
            );
            
            const proof1 = await shield.getMerkleProof(0, commitments);
            const proof2 = await shield.getMerkleProof(0, commitments);
            
            expect(proof1.proof).toEqual(proof2.proof);
            expect(proof1.indices).toEqual(proof2.indices);
        });

        it('should calculate correct Merkle root', async () => {
            const commitments = Array.from({ length: 4 }, () => 
                crypto.randomBytes(32).toString('hex')
            );
            
            const proof = await shield.getMerkleProof(0, commitments);
            
            // Calculate root using same logic as client
            const poseidonHash = (left: Buffer, right: Buffer): Buffer => {
                const combined = Buffer.concat([left, right]);
                return crypto.createHash('blake2b512')
                    .update(combined)
                    .digest()
                    .slice(0, 32);
            };
            
            let currentHash = Buffer.from(commitments[0], 'hex');
            
            for (let i = 0; i < proof.proof.length; i++) {
                const sibling = Buffer.from(proof.proof[i], 'hex');
                if (proof.indices[i] === 0) {
                    const leftCopy = Buffer.alloc(32);
                    const rightCopy = Buffer.alloc(32);
                    currentHash.copy(leftCopy);
                    sibling.copy(rightCopy);
                    currentHash = poseidonHash(leftCopy, rightCopy);
                } else {
                    const leftCopy = Buffer.alloc(32);
                    const rightCopy = Buffer.alloc(32);
                    sibling.copy(leftCopy);
                    currentHash.copy(rightCopy);
                    currentHash = poseidonHash(leftCopy, rightCopy);
                }
            }
            
            const calculatedRoot = currentHash.toString('hex');
            expect(calculatedRoot).toMatch(/^[0-9a-fA-F]{64}$/);
            expect(calculatedRoot).not.toBe('00'.repeat(32)); // Should not be zero
        });
    });

    describe('ZK Proof Input Consistency', () => {
        it('should use consistent nullifierHash in ZK proof generation', async () => {
            const secretHex = crypto.randomBytes(32).toString('hex');
            const nullifierHex = crypto.randomBytes(32).toString('hex');
            const rootHex = '00'.repeat(32);
            const mockMerklePath = {
                proof: ['00'.repeat(32)],
                indices: [0]
            };
            
            // Mock snarkjs to capture inputs
            const mockSnarkjs = {
                groth16: {
                    fullProve: jest.fn().mockResolvedValue({
                        proof: { pi_a: [], pi_b: [[]], pi_c: [] },
                        publicSignals: []
                    })
                }
            };
            
            // Temporarily replace require
            const originalRequire = require;
            require = jest.fn().mockReturnValue(mockSnarkjs);
            
            try {
                await shield.generateZKProof(
                    secretHex,
                    nullifierHex,
                    rootHex,
                    mockMerklePath,
                    'mock.wasm',
                    'mock.zkey'
                );
                
                // Test expected nullifier hash using same logic as shield
            const poseidonHash = (left: Buffer, right: Buffer): Buffer => {
                const combined = Buffer.concat([left, right]);
                return crypto.createHash('blake2b512')
                    .update(combined)
                    .digest()
                    .slice(0, 32);
            };
            
            const expectedNullifierHash = poseidonHash(
                Buffer.from(nullifierHex, 'hex'), 
                Buffer.alloc(32, 0)
            ).toString('hex');
                
                expect(mockSnarkjs.groth16.fullProve).toHaveBeenCalledWith(
                    expect.objectContaining({
                        nullifierHash: expectedNullifierHash
                    }),
                    'mock.wasm',
                    'mock.zkey'
                );
            } finally {
                require = originalRequire;
            }
        });
    });
});
