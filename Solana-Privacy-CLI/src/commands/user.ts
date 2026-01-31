import { ethers } from "ethers";
import { NetworkConfig } from "../types/network";
import { validatePrivateKey } from "../utils/validation";
import { generateViewingKey } from "../utils/crypto";

interface User {
    address: string;
    publicKey: string;
    privateKey: string;
}

interface ViewingKey {
    publicKey: string;
    privateKey: string;
}

export async function registerUser(network: NetworkConfig, privateKey?: string): Promise<User> {
    // Create or validate private key
    let wallet: ethers.Wallet;
    if (privateKey) {
        if (!validatePrivateKey(privateKey)) {
            throw new Error("Invalid private key provided");
        }
        wallet = new ethers.Wallet(privateKey);
    } else {
        const randomWallet = ethers.Wallet.createRandom();
        wallet = new ethers.Wallet(randomWallet.privateKey);
    }

    // Generate viewing key
    const viewingKey: ViewingKey = await generateViewingKey();

    // Connect to network
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const connectedWallet = wallet.connect(provider);

    // Get network details
    const networkDetails = await provider.getNetwork();
    if (networkDetails.chainId !== BigInt(network.chainId)) {
        throw new Error(`Network chain ID mismatch. Expected ${network.chainId}, got ${networkDetails.chainId}`);
    }

    return {
        address: connectedWallet.address,
        publicKey: viewingKey.publicKey,
        privateKey: wallet.privateKey,
    };
} 