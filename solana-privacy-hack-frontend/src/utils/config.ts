export const envConfig = {
  walletNetwork: import.meta.env.VITE_NETWORK || "mainnet-beta",
  baseUrl:
    import.meta.env.VITE_BASE_URL ||
    "https://shadow.radr.fun/shadowpay/api/escrow",
};
