import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

// Type definitions for Arcium modules
type RescueCipherType = {
  encrypt(data: Uint8Array[]): { encrypted: Uint8Array[]; nonce: Uint8Array };
  decrypt(encrypted: Uint8Array[], nonce: Uint8Array): Uint8Array[];
};

type X25519Type = {
  utils: {
    randomPrivateKey(): Uint8Array;
  };
  getPublicKey(privateKey: Uint8Array): Uint8Array;
  getSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
};

// Use dynamic import to delay loading @arcium-hq/client until needed
// This prevents the curve initialization error
let x25519: X25519Type | null = null;
let RescueCipher: any = null;

// Lazy load Arcium modules to avoid curve initialization issues
const loadArciumModules = async () => {
  if (!x25519 || !RescueCipher) {
    const arcium = await import('@arcium-hq/client');
    x25519 = arcium.x25519;
    RescueCipher = arcium.RescueCipher;
  }
  return { x25519, RescueCipher };
};

interface ArciumContextType {
  connection: any | null;
  cipher: RescueCipherType | null;
  isInitialized: boolean;
  error: string | null;
}

const ArciumContext = createContext<ArciumContextType>({
  connection: null,
  cipher: null,
  isInitialized: false,
  error: null,
});

export const useArcium = () => useContext(ArciumContext);

interface ArciumProviderProps {
  children: ReactNode;
}

export const ArciumProvider: React.FC<ArciumProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [cipher, setCipher] = useState<RescueCipherType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeArcium = async () => {
      if (!publicKey || !connection) {
        setIsInitialized(false);
        return;
      }

      try {
        // Lazy load Arcium modules
        const { x25519: x25519Module, RescueCipher: RescueCipherClass } = await loadArciumModules();
        
        // Generate client's private key for x25519 key exchange
        const clientPrivateKey = x25519Module.utils.randomPrivateKey();
        const clientPublicKey = x25519Module.getPublicKey(clientPrivateKey);
        
        // In production, you would fetch the MXE's public key and perform key exchange
        // For now, we'll create a placeholder shared secret
        const mxePublicKey = new Uint8Array(32); // Placeholder
        const sharedSecret = x25519Module.getSharedSecret(clientPrivateKey, mxePublicKey);
        
        // Initialize Rescue cipher with shared secret
        const rescueCipher = new RescueCipherClass(sharedSecret);
        
        setCipher(rescueCipher);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Arcium:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Arcium');
        setIsInitialized(false);
      }
    };

    initializeArcium();
  }, [connection, publicKey]);

  return (
    <ArciumContext.Provider value={{ connection, cipher, isInitialized, error }}>
      {children}
    </ArciumContext.Provider>
  );
};
