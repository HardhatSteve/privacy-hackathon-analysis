"use client";

import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { useEffect, useState } from "react";
import { Plus, Loader2, FileText, Share2, Trash2, X, Lock } from "lucide-react";
import Link from "next/link";
import { getProgram, getUserProfilePDA, getDocumentPDA, PROGRAM_ID } from "../../utils/anchor";
import { PublicKey, SystemProgram, TransactionInstruction, Transaction } from "@solana/web3.js";

interface DocData {
    pda: PublicKey;
    fingerprint: string;
    description: string;
    encryptedBlobUri: string;
    createdAt: number;
    shareCount: number; // For demo
}

export default function Dashboard() {
    const { connected } = useWallet();
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<DocData[]>([]);
    const [initStatus, setInitStatus] = useState("Checking wallet...");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (!connected || !wallet) {
            setLoading(false);
            setInitStatus("Connect Wallet");
            return;
        }

        const fetchDocs = async () => {
            setInitStatus("Fetching profile...");
            setLoading(true);
            try {
                const program = getProgram(connection, wallet);
                const userProfilePDA = getUserProfilePDA(wallet.publicKey);

                let profile;
                try {
                    // @ts-ignore
                    profile = await program.account.userProfile.fetch(userProfilePDA);
                } catch (e) {
                    // Profile doesn't exist
                    setLoading(false);
                    return;
                }

                // @ts-ignore
                const count = profile.documentCount.toNumber();
                const docs: DocData[] = [];

                for (let i = 0; i < count; i++) {
                    try {
                        const docPDA = getDocumentPDA(userProfilePDA, i);
                        // @ts-ignore
                        const docAccount = await program.account.document.fetch(docPDA);
                        docs.push({
                            pda: docPDA,
                            // @ts-ignore
                            fingerprint: docAccount.docFingerprint,
                            description: `Document ${docAccount.docFingerprint.slice(0, 8)}...`,
                            // @ts-ignore
                            encryptedBlobUri: docAccount.encryptedBlobUri,
                            // @ts-ignore
                            createdAt: docAccount.createdAt.toNumber() * 1000,
                            shareCount: 0
                        });
                    } catch (e) {
                        console.error("Failed to fetch doc", i, e);
                    }
                }
                setDocuments(docs.filter(d => {
                    const hidden = JSON.parse(localStorage.getItem("hiddenDocs") || "[]");
                    return !hidden.includes(d.pda.toString());
                }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [connected, wallet, connection]);

    const createShare = async (doc: DocData) => {
        if (!wallet) return;

        const AUTHORIZED_VERIFIER = "91B1JkkWTN3r2y5RYY3Cugq6ZGLoonLLT8JYytbu5dp7";

        const verifierPubkey = prompt("Enter Verifier Public Key:");
        if (!verifierPubkey) return;

        if (verifierPubkey !== AUTHORIZED_VERIFIER) {
            alert(`Access Denied. You are not authorised to verify. \n${verifierPubkey}`);
            return;
        }

        try {
            const verifierKey = new PublicKey(verifierPubkey);
            const program = getProgram(connection, wallet);

            // Derive Share Session PDA
            // seeds = [b"share", document.key().as_ref(), verifier.as_ref()]
            const [sharePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from("share"), doc.pda.toBuffer(), verifierKey.toBuffer()],
                PROGRAM_ID
            );

            await program.methods.createShareSession(verifierKey, new BN(3600)) // 1 hour expiry duration
                .accounts({
                    shareSession: sharePDA,
                    document: doc.pda,
                    user: wallet.publicKey,
                    verifier: verifierKey, // AccountInfo unchecked in program but needs to be passed
                    incoLightningProgram: new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"),
                    systemProgram: SystemProgram.programId
                })
                .rpc();

            // --- Step 2: Grant Access (Allow) on Inco Network ---
            // @ts-ignore
            const shareAccount = await program.account.shareSession.fetch(sharePDA);
            // @ts-ignore
            const handleObj = shareAccount.sessionAadhar;
            const handleBN = handleObj["0"] || handleObj;
            // Ensure 16 bytes LE
            const handleBytes = handleBN.toArrayLike(Buffer, 'le', 16);

            const INCO_LIGHTNING_ID = new PublicKey("5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj");

            const [allowancePDA] = PublicKey.findProgramAddressSync(
                [handleBytes, verifierKey.toBuffer()],
                INCO_LIGHTNING_ID
            );

            const allowIx = new TransactionInstruction({
                programId: INCO_LIGHTNING_ID,
                keys: [
                    { pubkey: allowancePDA, isSigner: false, isWritable: true },
                    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                    { pubkey: verifierKey, isSigner: false, isWritable: false }, // allowed_address
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
                ],
                data: Buffer.concat([
                    Buffer.from([60, 103, 140, 65, 110, 109, 147, 164]), // global:allow discriminator
                    handleBytes,
                    Buffer.from([1]), // true (allow)
                    verifierKey.toBuffer()
                ])
            });

            const tx = new Transaction().add(allowIx);
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = wallet.publicKey;

            const signedTx = await wallet.signTransaction(tx);
            const sig = await connection.sendRawTransaction(signedTx.serialize());
            await connection.confirmTransaction(sig, "confirmed");

            console.log("Allow transaction confirmed:", sig);

            alert(`Share created & Access Granted! Link: /verify/${sharePDA.toString()}`);
        } catch (e) {
            console.error(e);
            alert("Failed to create share: " + (e as any).message);
        }
    };

    const handleRevoke = (doc: DocData) => {
        if (!confirm("Are you sure you want to remove this document ?")) return;

        const hidden = JSON.parse(localStorage.getItem("hiddenDocs") || "[]");
        const newHidden = [...hidden, doc.pda.toString()];
        localStorage.setItem("hiddenDocs", JSON.stringify(newHidden));

        setDocuments(documents.filter(d => d.pda.toString() !== doc.pda.toString()));
    };

    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white">
            <Loader2 className="animate-spin w-8 h-8 text-purple-500 mb-2" />
            <p className="text-slate-400 text-sm">{initStatus}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold">My Documents</h1>
                    <p className="text-slate-400 mt-1">Manage your encrypted documents and sharing.</p>
                </div>
                <Link href="/dashboard/upload">
                    <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-purple-500/20">
                        <Plus className="w-5 h-5" />
                        <span>Upload Document</span>
                    </button>
                </Link>
            </header>

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc, idx) => (
                    <div key={idx} className="group relative bg-slate-900 border border-white/5 hover:border-purple-500/30 rounded-xl p-6 transition-all hover:bg-slate-800/50">
                        <div className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer" title="Create Share Link" onClick={() => createShare(doc)}>
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div
                            className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform cursor-pointer"
                            onClick={() => setSelectedImage(`https://gateway.pinata.cloud/ipfs/${doc.encryptedBlobUri}`)}
                        >
                            <FileText className="w-6 h-6" />
                        </div>

                        {/* Image Preview (IPFS) */}
                        <div className="w-full h-32 bg-slate-800 rounded-lg mb-4 overflow-hidden border border-white/5 relative group/img">
                            <img
                                src={`https://gateway.pinata.cloud/ipfs/${doc.encryptedBlobUri}`}
                                alt="Encrypted Content"
                                className="w-full h-full object-cover opacity-50 blur-sm group-hover/img:opacity-75 transition-all cursor-pointer"
                                onClick={() => setSelectedImage(`https://gateway.pinata.cloud/ipfs/${doc.encryptedBlobUri}`)}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <Lock className="w-8 h-8 text-slate-400 mb-1" />
                                <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED ON IPFS</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-1 truncate" title={doc.fingerprint}>{doc.fingerprint}</h3>
                        <p className="text-xs text-slate-500 mb-4 whitespace-nowrap overflow-hidden text-ellipsis" title={doc.fingerprint}>
                            Hash: {doc.fingerprint}
                        </p>
                        <div className="flex gap-2">
                            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20">On-Chain</span>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">Encrypted</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-500 flex justify-between">
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            <button
                                onClick={() => handleRevoke(doc)}
                                className="text-red-400 hover:text-red-300 flex items-center gap-1"
                                title="Remove from Dashboard"
                            >
                                <Trash2 className="w-3 h-3" /> Remove
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {documents.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                        <p className="text-slate-400 mb-4">No documents found.</p>
                        <p className="text-sm text-slate-500">Upload your National ID or Degree to get started.</p>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Full Preview"
                            className="w-full h-full object-contain max-h-[85vh]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
