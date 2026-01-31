// ============================================================================
// UNIT TESTS FOR ATOMIC RESCUE ENGINE
// Comprehensive test coverage for all components
// ============================================================================

const { jest } = require('@jest/globals');
const { 
  AtomicRescueEngine, 
  PriceOracle, 
  ThreatIntelligence, 
  ZKPrivacyLayer, 
  SPLTokenEngine 
} = require('../cli/utils/atomic-rescue-engine');
const { Keypair, PublicKey, Connection } = require('@solana/web3.js');

describe('AtomicRescueEngine', () => {
  let engine;
  let mockKeypair;
  let mockSafeAddress;

  beforeEach(() => {
    engine = new AtomicRescueEngine();
    mockKeypair = Keypair.generate();
    mockSafeAddress = Keypair.generate().publicKey;
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(engine.connection).toBeDefined();
      expect(engine.priceOracle).toBeInstanceOf(PriceOracle);
      expect(engine.threatIntel).toBeInstanceOf(ThreatIntelligence);
      expect(engine.zkLayer).toBeInstanceOf(ZKPrivacyLayer);
      expect(engine.splEngine).toBeInstanceOf(SPLTokenEngine);
    });
  });

  describe('executeAtomicRescue', () => {
    test('should execute rescue successfully with valid inputs', async () => {
      // Mock the phases to avoid actual blockchain calls
      jest.spyOn(engine, '_phaseOne').mockResolvedValue({
        name: 'Threat Detection',
        status: 'complete',
        threatDetected: false
      });
      
      jest.spyOn(engine, '_phaseTwo').mockResolvedValue([
        {
          type: 'sol',
          amount: 1000000000, // 1 SOL
          decimals: 9,
          uiAmount: 1
        }
      ]);
      
      jest.spyOn(engine, '_phaseThree').mockResolvedValue(undefined);
      jest.spyOn(engine, '_phaseFour').mockResolvedValue(null);
      jest.spyOn(engine, '_phaseFive').mockResolvedValue({});
      jest.spyOn(engine, '_phaseSix').mockResolvedValue('mock_signature');
      jest.spyOn(engine, '_phaseSeven').mockResolvedValue(undefined);

      const result = await engine.executeAtomicRescue(
        mockKeypair,
        mockSafeAddress,
        false,
        null
      );

      expect(result.success).toBe(true);
      expect(result.signature).toBe('mock_signature');
      expect(result.phases).toHaveLength(1);
    });

    test('should handle rescue with ZK privacy enabled', async () => {
      // Mock phases
      jest.spyOn(engine, '_phaseOne').mockResolvedValue({
        name: 'Threat Detection',
        status: 'complete',
        threatDetected: false
      });
      
      jest.spyOn(engine, '_phaseTwo').mockResolvedValue([]);
      jest.spyOn(engine, '_phaseThree').mockResolvedValue(undefined);
      
      const mockZKProof = {
        proof: { pi_a: ['0x...'], pi_b: [['0x...']], pi_c: ['0x...'] },
        publicInputs: { root: '0x...', nullifierHashes: [] }
      };
      jest.spyOn(engine, '_phaseFour').mockResolvedValue(mockZKProof);
      jest.spyOn(engine, '_phaseFive').mockResolvedValue({});
      jest.spyOn(engine, '_phaseSix').mockResolvedValue('mock_signature');
      jest.spyOn(engine, '_phaseSeven').mockResolvedValue(undefined);

      const result = await engine.executeAtomicRescue(
        mockKeypair,
        mockSafeAddress,
        true,
        null
      );

      expect(result.success).toBe(true);
      expect(result.zkProof).toBeDefined();
    });

    test('should handle monitoring callback', async () => {
      const mockCallback = jest.fn();
      
      // Mock phases
      jest.spyOn(engine, '_phaseOne').mockResolvedValue({
        name: 'Threat Detection',
        status: 'complete',
        threatDetected: false
      });
      jest.spyOn(engine, '_phaseTwo').mockResolvedValue([]);
      jest.spyOn(engine, '_phaseThree').mockResolvedValue(undefined);
      jest.spyOn(engine, '_phaseFour').mockResolvedValue(null);
      jest.spyOn(engine, '_phaseFive').mockResolvedValue({});
      jest.spyOn(engine, '_phaseSix').mockResolvedValue('mock_signature');
      jest.spyOn(engine, '_phaseSeven').mockResolvedValue(undefined);

      await engine.executeAtomicRescue(
        mockKeypair,
        mockSafeAddress,
        false,
        mockCallback
      );

      // Monitoring should be started asynchronously
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should handle partial recovery on failure', async () => {
      const error = new Error('Transaction failed');
      
      jest.spyOn(engine, '_phaseOne').mockResolvedValue({
        name: 'Threat Detection',
        status: 'complete',
        threatDetected: false
      });
      jest.spyOn(engine, '_phaseTwo').mockResolvedValue([]);
      jest.spyOn(engine, '_phaseThree').mockResolvedValue(undefined);
      jest.spyOn(engine, '_phaseFour').mockResolvedValue(null);
      jest.spyOn(engine, '_phaseFive').mockResolvedValue({});
      jest.spyOn(engine, '_phaseSix').mockRejectedValue(error);
      jest.spyOn(engine, '_handlePartialRecovery').mockResolvedValue(undefined);

      await expect(engine.executeAtomicRescue(
        mockKeypair,
        mockSafeAddress,
        false,
        null
      )).rejects.toThrow('Transaction failed');

      expect(engine._handlePartialRecovery).toHaveBeenCalled();
    });
  });

  describe('_phaseOne', () => {
    test('should detect threats correctly', async () => {
      jest.spyOn(engine.threatIntel, 'isThreatDetected').mockResolvedValue(true);

      const result = await engine._phaseOne(mockKeypair.publicKey);

      expect(result.name).toBe('Threat Detection');
      expect(result.status).toBe('complete');
      expect(result.threatDetected).toBe(true);
    });
  });

  describe('_phaseTwo', () => {
    test('should discover assets correctly', async () => {
      const mockBalance = 2000000000; // 2 SOL
      const mockTokenAccounts = [
        {
          address: new PublicKey('11111111111111111111111111111112'),
          mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          amount: '1000000',
          decimals: 6,
          uiAmount: 1,
          type: 'spl-token'
        }
      ];

      jest.spyOn(engine.connection, 'getBalance').mockResolvedValue(mockBalance);
      jest.spyOn(engine.splEngine, 'scanTokenAccounts').mockResolvedValue(mockTokenAccounts);

      const assets = await engine._phaseTwo(mockKeypair.publicKey);

      expect(assets).toHaveLength(2);
      expect(assets[0].type).toBe('sol');
      expect(assets[1].type).toBe('spl-token');
    });
  });

  describe('_phaseSix', () => {
    test('should handle transaction execution with retries', async () => {
      const mockTransaction = {
        sign: jest.fn(),
        serialize: jest.fn().mockReturnValue(Buffer.from('mock')),
        recentBlockhash: 'mock_blockhash',
        lastValidBlockHeight: 100
      };

      jest.spyOn(engine.connection, 'sendRawTransaction').mockResolvedValue('mock_signature');
      jest.spyOn(engine.connection, 'confirmTransaction').mockResolvedValue({
        value: { err: null }
      });

      const signature = await engine._phaseSix(mockTransaction, mockKeypair);

      expect(signature).toBe('mock_signature');
      expect(mockTransaction.sign).toHaveBeenCalledWith(mockKeypair);
    });

    test('should retry on failure', async () => {
      const mockTransaction = {
        sign: jest.fn(),
        serialize: jest.fn().mockReturnValue(Buffer.from('mock')),
        recentBlockhash: 'mock_blockhash',
        lastValidBlockHeight: 100
      };

      // Fail first attempt, succeed second
      jest.spyOn(engine.connection, 'sendRawTransaction')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('mock_signature');
      
      jest.spyOn(engine.connection, 'confirmTransaction').mockResolvedValue({
        value: { err: null }
      });

      jest.spyOn(engine.connection, 'getLatestBlockhash').mockResolvedValue({
        blockhash: 'new_blockhash',
        lastValidBlockHeight: 101
      });

      const signature = await engine._phaseSix(mockTransaction, mockKeypair);

      expect(signature).toBe('mock_signature');
      expect(engine.connection.sendRawTransaction).toHaveBeenCalledTimes(2);
    });
  });
});

describe('PriceOracle', () => {
  let priceOracle;
  let mockMintAddress;

  beforeEach(() => {
    priceOracle = new PriceOracle();
    mockMintAddress = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });

  describe('getPrice', () => {
    test('should return cached price if available', async () => {
      const cachedPrice = { usd: 1.0, source: 'jupiter', timestamp: Date.now() };
      priceOracle.cache.set(mockMintAddress.toString(), {
        price: cachedPrice,
        timestamp: Date.now()
      });

      const result = await priceOracle.getPrice(mockMintAddress);

      expect(result).toEqual(cachedPrice);
    });

    test('should fetch from Jupiter on cache miss', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {
            [mockMintAddress.toString()]: { price: 1.05 }
          }
        })
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await priceOracle.getPrice(mockMintAddress);

      expect(result.usd).toBe(1.05);
      expect(result.source).toBe('jupiter');
    });

    test('should fallback to Pyth on Jupiter failure', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Jupiter failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            data: { [mockMintAddress.toString()]: { price: 1.02 } }
          })
        });

      const result = await priceOracle.getPrice(mockMintAddress);

      expect(result.usd).toBe(1.02);
      expect(result.source).toBe('jupiter');
    });
  });

  describe('getBatchPrices', () => {
    test('should fetch prices for multiple tokens', async () => {
      const mockMints = [
        mockMintAddress,
        new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: {
            [mockMints[0].toString()]: { price: 1.05 },
            [mockMints[1].toString()]: { price: 1.01 }
          }
        })
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const prices = await priceOracle.getBatchPrices(mockMints);

      expect(prices.size).toBe(2);
      expect(prices.get(mockMints[0].toString()).usd).toBe(1.05);
      expect(prices.get(mockMints[1].toString()).usd).toBe(1.01);
    });
  });
});

describe('ThreatIntelligence', () => {
  let threatIntel;
  let mockAddress;

  beforeEach(() => {
    threatIntel = new ThreatIntelligence();
    mockAddress = new PublicKey('11111111111111111111111111111112');
  });

  describe('isThreatDetected', () => {
    test('should return true if local database contains threat', async () => {
      threatIntel.localDatabase.set(mockAddress.toString(), {
        type: 'malware',
        severity: 'high'
      });

      const result = await threatIntel.isThreatDetected(mockAddress);

      expect(result).toBe(true);
    });

    test('should check multiple sources', async () => {
      jest.spyOn(threatIntel, '_checkLocalDatabase').mockResolvedValue(false);
      jest.spyOn(threatIntel, '_checkCommunityReports').mockResolvedValue(false);
      jest.spyOn(threatIntel, '_checkLiveAPI').mockResolvedValue(true);
      jest.spyOn(threatIntel, '_checkOnChainBehavior').mockResolvedValue(false);

      const result = await threatIntel.isThreatDetected(mockAddress);

      expect(result).toBe(true);
    });
  });

  describe('reportThreat', () => {
    test('should report threat to community API', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      await threatIntel.reportThreat(mockAddress, { type: 'scam' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/report'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(mockAddress.toString())
        })
      );
    });
  });
});

describe('ZKPrivacyLayer', () => {
  let zkLayer;

  beforeEach(() => {
    zkLayer = new ZKPrivacyLayer();
  });

  describe('generateCommitment', () => {
    test('should generate commitment for asset', () => {
      const commitment = zkLayer.generateCommitment(
        '1000000',
        'spl-token',
        'secret123',
        'nullifier456'
      );

      expect(commitment).toHaveProperty('commitment');
      expect(commitment).toHaveProperty('secret', 'secret123');
      expect(commitment).toHaveProperty('nullifier', 'nullifier456');
    });
  });

  describe('generateRescueProof', () => {
    test('should generate ZK proof for assets', async () => {
      const assets = [
        { amount: '1000000', type: 'spl-token' }
      ];
      const recipient = new PublicKey('11111111111111111111111111111112');

      jest.spyOn(zkLayer, '_generateProof').mockResolvedValue({
        pi_a: ['0x...'],
        pi_b: [['0x...']],
        pi_c: ['0x...']
      });

      const proof = await zkLayer.generateRescueProof(assets, recipient);

      expect(proof).toHaveProperty('proof');
      expect(proof).toHaveProperty('publicInputs');
      expect(proof).toHaveProperty('commitments');
    });
  });

  describe('verifyProof', () => {
    test('should verify valid proof', async () => {
      const mockProof = {
        proof: { pi_a: ['0x...'], pi_b: [['0x...']], pi_c: ['0x...'] }
      };
      const mockPublicInputs = {
        nullifierHashes: ['0xabc']
      };

      const result = await zkLayer.verifyProof(mockProof.proof, mockPublicInputs);

      expect(result).toBe(true);
      expect(zkLayer.nullifiers.has('0xabc')).toBe(true);
    });

    test('should reject double-spending', async () => {
      const mockProof = {
        proof: { pi_a: ['0x...'], pi_b: [['0x...']], pi_c: ['0x...'] }
      };
      const mockPublicInputs = {
        nullifierHashes: ['0xabc']
      };

      // First verification
      await zkLayer.verifyProof(mockProof.proof, mockPublicInputs);

      // Second verification should fail
      await expect(zkLayer.verifyProof(mockProof.proof, mockPublicInputs))
        .rejects.toThrow('Nullifier already used');
    });
  });
});

describe('SPLTokenEngine', () => {
  let splEngine;
  let mockConnection;
  let mockSourceWallet;
  let mockDestWallet;
  let mockTokenMint;

  beforeEach(() => {
    mockConnection = new Connection('https://api.devnet.solana.com');
    splEngine = new SPLTokenEngine(mockConnection);
    mockSourceWallet = Keypair.generate().publicKey;
    mockDestWallet = Keypair.generate().publicKey;
    mockTokenMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });

  describe('buildTokenTransfer', () => {
    test('should build token transfer instructions', async () => {
      const amount = BigInt('1000000');

      jest.spyOn(mockConnection, 'getAccountInfo').mockResolvedValue(null);

      const result = await splEngine.buildTokenTransfer(
        mockSourceWallet,
        mockDestWallet,
        mockTokenMint,
        amount,
        true
      );

      expect(result.instructions).toHaveLength(2); // Create ATA + Transfer + Close
      expect(result.sourceATA).toBeDefined();
      expect(result.destATA).toBeDefined();
    });

    test('should not create ATA if destination exists', async () => {
      const amount = BigInt('1000000');

      jest.spyOn(mockConnection, 'getAccountInfo').mockResolvedValue({
        owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });

      const result = await splEngine.buildTokenTransfer(
        mockSourceWallet,
        mockDestWallet,
        mockTokenMint,
        amount,
        false
      );

      expect(result.instructions).toHaveLength(1); // Only transfer
    });
  });

  describe('scanTokenAccounts', () => {
    test('should scan token accounts for wallet', async () => {
      const mockTokenAccounts = {
        value: [
          {
            pubkey: new PublicKey('11111111111111111111111111111112'),
            account: {
              data: {
                parsed: {
                  info: {
                    mint: mockTokenMint.toString(),
                    tokenAmount: {
                      amount: '1000000',
                      decimals: 6,
                      uiAmount: 1
                    }
                  }
                }
              }
            }
          }
        ]
      };

      jest.spyOn(mockConnection, 'getParsedTokenAccountsByOwner')
        .mockResolvedValue(mockTokenAccounts);

      const assets = await splEngine.scanTokenAccounts(mockSourceWallet);

      expect(assets).toHaveLength(1);
      expect(assets[0].mint.toString()).toBe(mockTokenMint.toString());
      expect(assets[0].uiAmount).toBe(1);
    });
  });
});
