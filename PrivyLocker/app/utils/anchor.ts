import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, setProvider, BN } from "@coral-xyz/anchor";
import idl from "./idl.json";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export const PROGRAM_ID = new PublicKey("4TSoksGkK9L1scc8MBqbPwaNuxM7Jfxj49HGF21pX5CG");

export const getProgram = (connection: Connection, wallet: AnchorWallet) => {
    const provider = new AnchorProvider(
        connection,
        wallet,
        { preflightCommitment: "processed" }
    );
    setProvider(provider);
    return new Program(idl as Idl, provider);
};

export const getUserProfilePDA = (user: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("user-profile"), user.toBuffer()],
        PROGRAM_ID
    )[0];
};

export const getDocumentPDA = (userProfile: PublicKey, count: number) => {
    // Note: In Rust we used &to_le_bytes(). Here we need to match that serialization.
    // However, for simplicity in JS, we often use BN or simple buffers.
    // The rust side uses `user_profile.document_count.to_le_bytes()` (u64 = 8 bytes).

    // Fix: Use BN (BigNum) to handle u64 serialization safely in the browser
    const bnCount = new BN(count);
    const buffer = bnCount.toArrayLike(Buffer, "le", 8);

    return PublicKey.findProgramAddressSync(
        [Buffer.from("document"), userProfile.toBuffer(), buffer],
        PROGRAM_ID
    )[0];
};
