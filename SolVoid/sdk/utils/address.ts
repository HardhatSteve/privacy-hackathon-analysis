import { PublicKey } from "@solana/web3.js";

/**
 * Universal address-to-string conversion.
 */
export const toAddressString = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address.toBase58 === 'function') return address.toBase58();
    if (typeof address.toString === 'function') return address.toString();
    return String(address);
};

/**
 * Universal conversion to a PublicKey-compatible object.
 * This ensures the object has toBase58() which internal web3.js methods often call.
 */
export const toPublicKey = (address: any): any => {
    if (!address) return null;

    // If it already has toBase58, it might work directly
    if (typeof address.toBase58 === 'function') return address;

    try {
        return new PublicKey(toAddressString(address));
    } catch (e) {
        // Fallback for objects that might be PublicKeys but lost their prototype
        const str = toAddressString(address);
        return {
            toBase58: () => str,
            toString: () => str,
            equals: (other: any) => toAddressString(other) === str,
            toBuffer: () => Buffer.from([]) // Dummy buffer as some methods might call it
        };
    }
};
