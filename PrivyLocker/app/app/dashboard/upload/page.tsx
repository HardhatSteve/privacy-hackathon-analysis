"use client";

import { useState } from "react";
import { Upload, FileText, Lock, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { encryptFile, generateKey, exportKey } from "@/utils/encryption";
import { encryptValue } from "@inco/solana-sdk/encryption";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import { getProgram, getUserProfilePDA, getDocumentPDA } from "@/utils/anchor";
import { uploadToPinata } from "@/utils/ipfs";

export default function UploadPage() {
    const router = useRouter();
    const wallet = useAnchorWallet();
    const { connection } = useConnection();

    const [file, setFile] = useState<File | null>(null);
    const [aadhar, setAadhar] = useState("");
    const [docName, setDocName] = useState("");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !wallet || !aadhar) return;
        setLoading(true);
        setStatusMsg("Initializing...");

        try {
            // 1. Generate Key & Encrypt
            setStatusMsg("Encrypting file and data...");

            // Inco Encryption
            const encryptedAadharHex = await encryptValue(BigInt(aadhar));
            const encryptedAadharBytes = Buffer.from(encryptedAadharHex, 'hex');

            const key = await generateKey();
            const { encryptedBlob } = await encryptFile(file, key);
            // const keyString = await exportKey(key); // Not used in this mock upload flow yet

            // 2. Upload Encrypted Blob to IPFS (via Pinata)
            setStatusMsg("Uploading to IPFS (Pinata)...");

            // Note: We upload the ENCRYPTED file.
            // The filename will be "{docName}.enc"
            const finalDocName = docName || "Document";
            const cid = await uploadToPinata(encryptedBlob, finalDocName + ".enc");

            if (!cid) throw new Error("IPFS Upload failed");
            const blobUri = cid; // Store CID as URI

            // 3. Register on Solana
            setStatusMsg("Registering on Solana...");
            const program = getProgram(connection, wallet);

            const userProfilePDA = getUserProfilePDA(wallet.publicKey);

            // Check if user profile exists
            try {
                // @ts-ignore
                await program.account.userProfile.fetch(userProfilePDA);
            } catch (e) {
                setStatusMsg("Initializing User Profile...");
                await program.methods.initializeUser()
                    .accounts({
                        userProfile: userProfilePDA,
                        user: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
            }

            // Get current count for PDA derivation
            // @ts-ignore
            const profileAccount = await program.account.userProfile.fetch(userProfilePDA);
            // @ts-ignore
            const count = profileAccount.documentCount.toNumber();

            const documentPDA = getDocumentPDA(userProfilePDA, count);
            const fingerprint = finalDocName; // Use the user-provided name as fingerprint

            await program.methods.uploadDocument(fingerprint, blobUri, encryptedAadharBytes)
                .accounts({
                    document: documentPDA,
                    userProfile: userProfilePDA,
                    user: wallet.publicKey,
                    incoLightningProgram: "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj",
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            setStep(3); // Success
        } catch (error) {
            console.error(error);
            alert("Error: " + (error as any).message);
        } finally {
            setLoading(false);
            setStatusMsg("");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {step === 1 && (
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-8">
                        <h1 className="text-2xl font-bold mb-6">Upload Document</h1>
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-slate-800/50 transition-all">
                            <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} />
                            <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer w-full">
                                {file ? (
                                    <>
                                        <FileText className="w-12 h-12 text-purple-400 mb-4" />
                                        <p className="text-lg font-medium">{file.name}</p>
                                        <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-slate-500 mb-4" />
                                        <p className="text-lg font-medium">Click to upload or drag and drop</p>
                                        <p className="text-sm text-slate-500">PDF, JPG, PNG (Max 5MB)</p>
                                    </>
                                )}
                            </label>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Document Name</label>
                            <input
                                type="text"
                                value={docName}
                                onChange={(e) => setDocName(e.target.value)}
                                placeholder="e.g. My Degree, National ID"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors mb-4"
                            />

                            <label className="block text-sm font-medium text-slate-400 mb-2">Aadhar Number (Confidential)</label>
                            <input
                                type="text"
                                value={aadhar}
                                onChange={(e) => setAadhar(e.target.value)}
                                placeholder="Enter 12-digit Aadhar Number"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Encrypted using Inco FHE (Never visible on-chain)
                            </p>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!file || !wallet || !aadhar}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {!wallet ? "Connect Wallet First" : "Next: Encrypt & Store"}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
                        <h1 className="text-2xl font-bold mb-8">Secure Processing</h1>

                        <div className="space-y-6 max-w-sm mx-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Client-Side Encryption</p>
                                    <p className="text-xs text-slate-500">Generating AES-256 keys locally...</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Upload & Register</p>
                                    <p className="text-xs text-slate-500">Storing blob & creating Solana record...</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            {!loading ? (
                                <button
                                    onClick={handleUpload}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-4 h-4" /> Encrypt & Upload
                                </button>
                            ) : (
                                <div className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium flex flex-col items-center justify-center gap-2 cursor-wait">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                    </div>
                                    <span className="text-xs text-slate-400">{statusMsg}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 text-center">
                        <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4">Upload Complete</h1>
                        <p className="text-slate-400 mb-8">Your document has been encrypted and registered on Solana.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-3 rounded-xl font-medium transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
