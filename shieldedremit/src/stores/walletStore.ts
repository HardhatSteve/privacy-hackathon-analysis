import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WalletBalance,
  NetworkType,
  UserPreferences,
  PrivacyLevel,
  PrivyUser,
  ShieldedBalance,
  ShadowIDProfile,
} from "@/types";
import { PrivacyLevel as PrivacyLevelEnum } from "@/types";

interface WalletState {
  // Connection state
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;

  // Privy user
  privyUser: PrivyUser | null;

  // ShadowID profile
  shadowIdProfile: ShadowIDProfile | null;

  // Balance - regular
  balance: WalletBalance;
  balanceLoading: boolean;

  // Shielded balances (ShadowWire)
  shieldedBalances: ShieldedBalance[];
  shieldedBalancesLoading: boolean;

  // Network
  selectedNetwork: NetworkType;

  // User preferences
  preferences: UserPreferences;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setPublicKey: (publicKey: string | null) => void;
  setPrivyUser: (user: PrivyUser | null) => void;
  setShadowIdProfile: (profile: ShadowIDProfile | null) => void;
  setBalance: (balance: WalletBalance) => void;
  setBalanceLoading: (loading: boolean) => void;
  setShieldedBalances: (balances: ShieldedBalance[]) => void;
  setShieldedBalancesLoading: (loading: boolean) => void;
  setNetwork: (network: NetworkType) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  reset: () => void;
}

const defaultBalance: WalletBalance = {
  sol: 0,
  usdc: 0,
  usdt: 0,
  usd1: 0,
  bonk: 0,
  aol: 0,
  radr: 0,
  ore: 0,
};

const defaultPreferences: UserPreferences = {
  defaultPrivacyLevel: PrivacyLevelEnum.MEDIUM,
  defaultCurrency: "USDC",
  darkMode: false,
  notifications: {
    browser: true,
    email: false,
  },
  locale: "en-US",
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      // Initial state
      connected: false,
      connecting: false,
      publicKey: null,
      privyUser: null,
      shadowIdProfile: null,
      balance: defaultBalance,
      balanceLoading: false,
      shieldedBalances: [],
      shieldedBalancesLoading: false,
      selectedNetwork: "mainnet-beta",
      preferences: defaultPreferences,

      // Actions
      setConnected: (connected) => set({ connected }),
      setConnecting: (connecting) => set({ connecting }),
      setPublicKey: (publicKey) => set({ publicKey }),
      setPrivyUser: (privyUser) => set({ privyUser }),
      setShadowIdProfile: (shadowIdProfile) => set({ shadowIdProfile }),
      setBalance: (balance) => set({ balance }),
      setBalanceLoading: (loading) => set({ balanceLoading: loading }),
      setShieldedBalances: (shieldedBalances) => set({ shieldedBalances }),
      setShieldedBalancesLoading: (loading) =>
        set({ shieldedBalancesLoading: loading }),
      setNetwork: (network) => set({ selectedNetwork: network }),
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
      reset: () =>
        set({
          connected: false,
          connecting: false,
          publicKey: null,
          privyUser: null,
          shadowIdProfile: null,
          balance: defaultBalance,
          balanceLoading: false,
          shieldedBalances: [],
          shieldedBalancesLoading: false,
        }),
    }),
    {
      name: "shielded-remit-wallet",
      partialize: (state) => ({
        selectedNetwork: state.selectedNetwork,
        preferences: state.preferences,
      }),
    }
  )
);
