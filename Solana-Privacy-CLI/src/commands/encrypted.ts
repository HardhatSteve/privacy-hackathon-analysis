import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { NetworkConfig } from "../types/network";
import { privateMint, privateBurn, privateTransfer, withdraw } from "../helpers";
import { User } from "../user";
import type { EncryptedERC } from "../types/encrypted";

/**
 * Private mint tokens to a recipient
 * @param network Network configuration
 * @param options Mint options
 */
export async function mintPrivate(
    network: NetworkConfig,
    options: {
        amount: string;
        token: string;
        recipient?: string;
    }
): Promise<void> {
    const [signer] = await ethers.getSigners();

    // Get token contract
    const token = (await ethers.getContractAt("EncryptedERC", options.token)) as unknown as EncryptedERC;

    // Get auditor public key
    const auditorPublicKey = await token.auditorPublicKey();

    // Get recipient public key
    const recipient = options.recipient || signer.address;
    const recipientPublicKey = await token.getUserPublicKey(recipient) as [bigint, bigint];

    // Generate mint proof
    const mintAmount = BigInt(options.amount);
    const proof = await privateMint(mintAmount, recipientPublicKey, auditorPublicKey);

    // Execute mint
    const tx = await token.connect(signer).privateMint(recipient, proof);
    await tx.wait();
}

/**
 * Private burn tokens
 * @param network Network configuration
 * @param options Burn options
 */
export async function burnPrivate(
    network: NetworkConfig,
    options: {
        amount: string;
        token: string;
    }
): Promise<void> {
    const [signer] = await ethers.getSigners();

    // Get token contract
    const token = (await ethers.getContractAt("EncryptedERC", options.token)) as unknown as EncryptedERC;

    // Get user's encrypted balance
    const balance = await token.balanceOfStandalone(signer.address);
    const userEncryptedBalance = [...balance.eGCT.c1, ...balance.eGCT.c2];

    // Get auditor public key
    const auditorPublicKey = await token.auditorPublicKey();

    // Create user object
    const user = new User(signer);

    // Generate burn proof
    const burnAmount = BigInt(options.amount);
    const { proof, userBalancePCT } = await privateBurn(
        user,
        BigInt(balance.balancePCT[0]), // Current balance
        burnAmount,
        userEncryptedBalance,
        auditorPublicKey
    );

    // Execute burn
    const tx = await token.connect(signer).privateBurn(proof, userBalancePCT);
    await tx.wait();
}

/**
 * Private transfer tokens
 * @param network Network configuration
 * @param options Transfer options
 */
export async function transferPrivate(
    network: NetworkConfig,
    options: {
        amount: string;
        token: string;
        recipient: string;
    }
): Promise<void> {
    const [signer] = await ethers.getSigners();

    // Get token contract
    const token = (await ethers.getContractAt("EncryptedERC", options.token)) as unknown as EncryptedERC;
 as unknown as EncryptedERC;

    // Get sender's encrypted balance
    const balance = await token.balanceOfStandalone(signer.address);
    const senderEncryptedBalance = [...balance.eGCT.c1, ...balance.eGCT.c2];

    // Get recipient's public key
    const recipientPublicKey = await token.getUserPublicKey(options.recipient) as [bigint, bigint];

    // Get auditor public key
    const auditorPublicKey = await token.auditorPublicKey();

    // Create sender user object
    const sender = new User(signer);

    // Generate transfer proof
    const transferAmount = BigInt(options.amount);
    const { proof, senderBalancePCT } = await privateTransfer(
        sender,
        BigInt(balance.balancePCT[0]), // Current balance
        recipientPublicKey,
        transferAmount,
        senderEncryptedBalance,
        auditorPublicKey
    );

    // Execute transfer
    const tx = await token.connect(signer).transfer(
        options.recipient,
        0n, // No memo
        proof,
        senderBalancePCT
    );
    await tx.wait();
}

/**
 * Withdraw tokens (converter mode only)
 * @param network Network configuration
 * @param options Withdraw options
 */
export async function withdrawPrivate(
    network: NetworkConfig,
    options: {
        amount: string;
        token: string;
        recipient?: string;
    }
): Promise<void> {
    const [signer] = await ethers.getSigners();

    // Get token contract
    const token = await ethers.getContractAt("EncryptedERC", options.token);

    // Get user's encrypted balance
    const balance = await token.balanceOfStandalone(signer.address);
    const userEncryptedBalance = [...balance.eGCT.c1, ...balance.eGCT.c2];

    // Get auditor public key
    const auditorPublicKey = await token.auditorPublicKey();

    // Create user object
    const user = new User(signer);

    // Generate withdraw proof
    const withdrawAmount = BigInt(options.amount);
    const { proof, userBalancePCT } = await withdraw(
        withdrawAmount,
        user,
        userEncryptedBalance,
        BigInt(balance.balancePCT[0]), // Current balance
        auditorPublicKey
    );

    // Execute withdraw
    const recipient = options.recipient || signer.address;
    const tx = await token.connect(signer).withdraw(
        recipient,
        proof,
        userBalancePCT
    );
    await tx.wait();
} 