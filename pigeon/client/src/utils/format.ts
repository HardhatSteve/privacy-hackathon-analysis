/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Truncates a Solana wallet address for display.
 * @param address - Full base58 encoded address
 * @param chars - Number of characters to show at start (default: 6)
 * @returns Truncated address like "ABC123...XYZ9"
 */
export const truncateAddress = (
    address: string | undefined,
    chars = 6
): string => {
    if (!address) return "-";
    if (address.length <= 12) return address;
    return `${address.slice(0, chars)}...${address.slice(-4)}`;
};

/**
 * Gets a human-readable network label from an RPC endpoint URL.
 * @param endpoint - RPC endpoint URL
 * @returns Network label (e.g., "Devnet", "Mainnet", "Localnet")
 */
export const getNetworkLabel = (endpoint: string): string => {
    try {
        const url = new URL(endpoint);
        if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
            return "Localnet";
        }
        if (url.hostname.includes("devnet")) return "Devnet";
        if (url.hostname.includes("mainnet")) return "Mainnet";
        return url.hostname;
    } catch {
        return endpoint;
    }
};

/**
 * Formats a Unix timestamp (seconds) to a localized time string.
 * @param timestampSeconds - Unix timestamp in seconds
 * @returns Localized time string
 */
export const formatMessageTime = (timestampSeconds: number): string => {
    return new Date(timestampSeconds * 1000).toLocaleTimeString();
};
