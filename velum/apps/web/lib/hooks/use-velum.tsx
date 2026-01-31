import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { SUPPORTED_TOKENS } from "../config/tokens";
import bs58 from "bs58";

// Lazy load the heavy Velum SDK only when needed
// This reduces initial bundle size significantly (snarkjs + WASM modules)
type VelumType = Awaited<typeof import("@velumdotcash/sdk")>["Velum"];
type VelumInstance = InstanceType<VelumType>;

// Types for the SDK integration
interface ShieldedKeys {
  utxoPubkey: string;
  encryptionPubkey: string;
}

interface PrivateBalance {
  sol: bigint;
  usdc: bigint;
  usdt: bigint;
}

interface VelumContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  shieldedKeys: ShieldedKeys | null;
  privateBalance: PrivateBalance | null;
  refreshBalance: () => Promise<void>;
  initialize: () => void;
  velum: VelumInstance | null;
}

const VelumContext = createContext<VelumContextType | null>(null);

export function VelumProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shieldedKeys, setShieldedKeys] = useState<ShieldedKeys | null>(null);
  const [privateBalance, setPrivateBalance] = useState<PrivateBalance | null>(
    null,
  );

  // Ref to hold the SDK instance to avoid re-renders or dependency cycles
  const velumRef = useRef<VelumInstance | null>(null);
  // Ref to track if initialization is in progress (prevents race conditions)
  const initializingRef = useRef(false);
  // Ref to store the last initialized wallet address
  const lastInitializedWalletRef = useRef<string | null>(null);

  // Reset state if wallet disconnects
  useEffect(() => {
    if (!publicKey) {
      velumRef.current = null;
      initializingRef.current = false;
      lastInitializedWalletRef.current = null;
      setIsInitialized(false);
      setError(null);
      setShieldedKeys(null);
      setPrivateBalance(null);
    }
  }, [publicKey]);

  // Use refs for wallet functions to avoid recreating the initialize callback
  // These are stable per wallet connection but ESLint can't verify this
  const signMessageRef = useRef(signMessage);
  const signTransactionRef = useRef(signTransaction);
  const connectionRef = useRef(connection);

  // Keep refs up to date
  signMessageRef.current = signMessage;
  signTransactionRef.current = signTransaction;
  connectionRef.current = connection;

  // Sync balance to backend for persistence across browser clears
  const syncBalanceToBackend = useCallback(
    async (
      utxoPubkey: string,
      balances: { sol: bigint; usdc: bigint; usdt: bigint }
    ) => {
      if (!publicKey || !signMessage) return;

      try {
        const nonce = crypto.randomUUID();
        const timestamp = Date.now();
        const message = `Velum Balance Sync

Wallet: ${publicKey.toBase58()}
Nonce: ${nonce}
Timestamp: ${timestamp}`;

        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = await signMessage(messageBytes);
        const signature = bs58.encode(signatureBytes);

        // Get current slot for lastBlockSlot
        let lastBlockSlot = "0";
        try {
          const slot = await connectionRef.current.getSlot("confirmed");
          lastBlockSlot = slot.toString();
        } catch {
          // Non-critical, use 0 as fallback
        }

        // Fire-and-forget sync to backend
        fetch("/api/internal/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth: {
              walletAddress: publicKey.toBase58(),
              signature,
              message,
              nonce,
              timestamp,
            },
            utxoPubkey,
            balances: [
              { token: "SOL", balanceLamports: balances.sol.toString(), utxoCount: 0 },
              { token: "USDC", balanceLamports: balances.usdc.toString(), utxoCount: 0 },
              { token: "USDT", balanceLamports: balances.usdt.toString(), utxoCount: 0 },
            ],
            lastBlockSlot,
          }),
        }).catch((e) => console.warn("Balance sync failed:", e));
      } catch (e) {
        console.warn("Failed to sign balance sync:", e);
      }
    },
    [publicKey, signMessage]
  );

  // Store shieldedKeys in a ref to avoid re-creating the callback
  const shieldedKeysRef = useRef(shieldedKeys);
  shieldedKeysRef.current = shieldedKeys;

  const refreshBalanceInternal = useCallback(
    async (sdk: VelumInstance, shouldSync = true) => {
      if (!sdk) return;
      try {
        // Get token configurations from SUPPORTED_TOKENS
        const usdtToken = SUPPORTED_TOKENS.find((t) => t.symbol === "USDT");
        if (!usdtToken) {
          throw new Error("USDT token configuration not found");
        }

        // Fetch balances from blockchain
        const solRes = await sdk.getPrivateBalance();
        const usdcRes = await sdk.getPrivateBalanceUSDC();
        const usdtRes = await sdk.getPrivateBalanceSpl(usdtToken.mintAddress);

        const newBalance = {
          sol: BigInt(Math.floor(solRes.lamports)),
          usdc: BigInt(Math.floor(usdcRes.base_units)),
          usdt: BigInt(Math.floor(usdtRes.base_units)),
        };

        setPrivateBalance(newBalance);

        // Sync to backend for persistence (non-blocking)
        if (shouldSync && shieldedKeysRef.current?.utxoPubkey) {
          syncBalanceToBackend(shieldedKeysRef.current.utxoPubkey, newBalance);
        }
      } catch (e) {
        console.error("Error fetching private balance", e);
      }
    },
    [syncBalanceToBackend]
  );

  // Explicit initialization - pages that need the SDK call this
  const initialize = useCallback(() => {
    if (!publicKey || !signMessageRef.current || !signTransactionRef.current) return;

    const walletAddress = publicKey.toBase58();

    // Don't re-initialize if already initialized with the same wallet
    if (lastInitializedWalletRef.current === walletAddress && velumRef.current) {
      return;
    }

    // Don't start another initialization if one is already in progress
    if (initializingRef.current) {
      return;
    }

    const initializeSDK = async () => {
      // Mark initialization as in progress
      initializingRef.current = true;

      setIsLoading(true);
      setError(null);

      try {
        // Capture current values from refs
        const currentSignMessage = signMessageRef.current!;
        const currentSignTransaction = signTransactionRef.current!;
        const currentConnection = connectionRef.current;

        // 1. Sign a DETERMINISTIC message to derive encryption keys
        // IMPORTANT: This message must be identical every time for the same wallet
        // to ensure the derived encryption keys are always the same.
        // DO NOT add nonce, timestamp, or any variable data here!
        const signatureMessage = `Welcome to Velum

Sign this message to derive your private encryption keys.

This request will not trigger a blockchain transaction or cost any fees.

Wallet: ${publicKey.toBase58()}`;

        const message = new TextEncoder().encode(signatureMessage);
        const signature = await currentSignMessage(message);

        // 2. Dynamically import the heavy Velum SDK only when needed
        const { Velum } = await import("@velumdotcash/sdk");

        // 3. Initialize Velum SDK with derived keys
        const sdk = new Velum({
          RPC_url: currentConnection.rpcEndpoint,
          publicKey: publicKey,
          signature: signature,
          transactionSigner: async (tx: VersionedTransaction) => {
            return (await currentSignTransaction(tx)) as VersionedTransaction;
          },
        });

        velumRef.current = sdk;

        // 4. Get shielded public keys
        const encryptionPubkeyBytes = sdk.getAsymmetricPublicKey();
        const encryptionPubkey = Buffer.from(encryptionPubkeyBytes).toString(
          "base64",
        );
        const utxoPubkey = await sdk.getShieldedPublicKey();

        setShieldedKeys({
          utxoPubkey: utxoPubkey,
          encryptionPubkey: encryptionPubkey,
        });

        // Mark initialization as complete
        lastInitializedWalletRef.current = walletAddress;
        setIsInitialized(true);

        // Initial balance fetch
        await refreshBalanceInternal(sdk);
      } catch (err) {
        console.error("Failed to initialize SDK", err);
        setError(
          err instanceof Error ? err : new Error("Failed to initialize SDK"),
        );
      } finally {
        initializingRef.current = false;
        setIsLoading(false);
      }
    };

    initializeSDK();
  }, [publicKey, refreshBalanceInternal]);

  const refreshBalance = useCallback(async () => {
    if (!velumRef.current) return;
    setIsLoading(true);
    try {
      await refreshBalanceInternal(velumRef.current, false);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch balance"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalanceInternal]);

  return (
    <VelumContext.Provider
      value={{
        isInitialized,
        isLoading,
        error,
        shieldedKeys,
        privateBalance,
        refreshBalance,
        initialize,
        velum: velumRef.current,
      }}
    >
      {children}
    </VelumContext.Provider>
  );
}

export function useVelum() {
  const context = useContext(VelumContext);
  if (!context) {
    throw new Error("useVelum must be used within a VelumProvider");
  }
  return context;
}
