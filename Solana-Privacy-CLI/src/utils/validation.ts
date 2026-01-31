import { NetworkConfig } from "../types/network";
import { ethers } from "ethers";

const NETWORKS: { [key: string]: NetworkConfig } = {
    fuji: {
        name: "Avalanche Fuji Testnet",
        rpcUrl: process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
        chainId: 43113,
    },
    mainnet: {
        name: "Avalanche Mainnet",
        rpcUrl: process.env.MAINNET_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
        chainId: 43114,
    },
    local: {
        name: "Local Network",
        rpcUrl: "http://localhost:8545",
        chainId: 31337,
    },
};

export async function validateNetwork(networkName: string): Promise<NetworkConfig> {
    const network = NETWORKS[networkName.toLowerCase()];
    if (!network) {
        throw new Error(`Invalid network: ${networkName}. Supported networks: ${Object.keys(NETWORKS).join(", ")}`);
    }

    // Validate RPC connection
    try {
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        await provider.getNetwork();
    } catch (error: any) {
        throw new Error(`Failed to connect to ${network.name} RPC: ${error?.message || "Unknown error"}`);
    }

    return network;
}

export function validateAddress(address: string): boolean {
    return ethers.isAddress(address);
}

export function validateAmount(amount: string): boolean {
    try {
        const value = ethers.parseEther(amount);
        return value > 0n;
    } catch {
        return false;
    }
}

export function validatePrivateKey(key: string): boolean {
    try {
        new ethers.Wallet(key);
        return true;
    } catch {
        return false;
    }
} 