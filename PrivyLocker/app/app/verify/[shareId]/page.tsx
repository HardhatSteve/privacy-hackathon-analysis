"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, ShieldCheck, Clock, AlertTriangle, Lock } from "lucide-react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import idl from "../../../utils/idl.json";
import { PROGRAM_ID } from "../../../utils/anchor";
import { decrypt } from "@inco/solana-sdk/attested-decrypt";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { useParams } from "next/navigation";

export default function VerifyPage() {
    const params = useParams();
    const shareId = params.shareId as string;
    const { connected, publicKey, signMessage } = useWallet();
    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'revoked' | 'expired'>('loading');
    const [data, setData] = useState<any>(null);
    const [decryptionStatus, setDecryptionStatus] = useState<'idle' | 'decrypting' | 'success' | 'failed'>('idle');
    const [privateData, setPrivateData] = useState<string | null>(null);

    // Initial fetch of public share data
    useEffect(() => {
        const fetchShareInfo = async () => {
            try {
                if (!shareId) return;
                const sharePDA = new PublicKey(shareId);
                const connection = new Connection(clusterApiUrl("devnet"), "processed");

                // Read-only provider for public data
                const provider = new AnchorProvider(
                    connection,
                    { publicKey: PublicKey.default, signTransaction: async (t) => t, signAllTransactions: async (t) => t },
                    { preflightCommitment: "processed" }
                );
                const program = new Program(idl as any, provider) as any;

                // Fetch share account
                const shareAccount = await program.account.shareSession.fetch(sharePDA);

                // @ts-ignore
                const revoked = shareAccount.revoked;
                // @ts-ignore
                const expiresAt = shareAccount.expiresAt.toNumber() * 1000;
                const now = Date.now();

                if (revoked) {
                    setStatus('revoked');
                } else if (now > expiresAt) {
                    setStatus('expired');
                } else {
                    setStatus('valid');
                    setData({
                        // @ts-ignore
                        owner: shareAccount.owner.toString(),
                        expiresAt: new Date(expiresAt).toLocaleString(),
                        allowedFields: ['name', 'dob', 'national_id_number'],
                        // @ts-ignore
                        sessionAadhar: shareAccount.sessionAadhar,
                        // @ts-ignore
                        verifier: shareAccount.verifier.toString()
                    });
                }

            } catch (e) {
                console.error(e);
                setStatus('invalid');
            }
        };
        fetchShareInfo();
    }, [shareId]);

    const [errorDetail, setErrorDetail] = useState<string | null>(null);

    // Effect to handle decryption when wallet is connected and share is valid
    useEffect(() => {
        const decryptData = async () => {
            if (status !== 'valid' || !connected || !publicKey || !signMessage || !data || decryptionStatus !== 'idle') return;

            // Verify if connected wallet matches the authorized verifier
            if (publicKey.toString() !== data.verifier) {
                console.error("Wallet mismatch", publicKey.toString(), data.verifier);
                setDecryptionStatus('failed');
                setErrorDetail(`Wallet mismatch. Connected: ${publicKey.toString().slice(0, 8)}..., Expected: ${data.verifier.slice(0, 8)}...`);
                return;
            }

            setDecryptionStatus('decrypting');
            setErrorDetail(null);

            try {
                // @ts-ignore
                const handleObj = data.sessionAadhar;
                // Assuming tuple struct { "0": BN } because IDL defined it as `Euint128(u128)`
                const handleBN = handleObj["0"] || handleObj;
                const handle = handleBN.toString();

                console.log("Decrypting handle:", handle);

                const result = await decrypt([handle], {
                    address: publicKey,
                    signMessage: async (msg) => {
                        const sig = await signMessage(msg);
                        return sig;
                    }
                });

                if (result && result.plaintexts && result.plaintexts[0]) {
                    setPrivateData(result.plaintexts[0].toString());
                    setDecryptionStatus('success');
                } else {
                    throw new Error("No data returned from decryption query");
                }
            } catch (e: any) {
                console.error("Decryption failed:", e);
                setPrivateData(null);
                setDecryptionStatus('failed');
                setErrorDetail(e.message || String(e));
            }
        };

        if (status === 'valid' && connected && decryptionStatus === 'idle') {
            decryptData();
        }
    }, [status, connected, publicKey, signMessage, data, decryptionStatus]);


    if (status === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
            <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <WalletMultiButton />
            </div>

            <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center shadow-2xl shadow-purple-900/10">
                {status === 'valid' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/20">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verified Credential</h1>
                        <p className="text-slate-400 mb-8">This document is authentic and currently valid.</p>

                        <div className="bg-slate-950 rounded-xl p-4 text-left space-y-3 border border-white/5">
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-slate-500">Status</span>
                                <span className="font-medium text-green-400 flex items-center gap-1">
                                    Active <CheckCircle className="w-3 h-3" />
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-slate-500">Owner</span>
                                <span className="font-medium text-xs text-slate-300 font-mono">{data.owner.slice(0, 4)}...{data.owner.slice(-4)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-slate-500">Expires</span>
                                <span className="font-medium text-xs text-slate-300">{data.expiresAt}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-slate-500">Authorized Verifier</span>
                                <span className="font-medium text-xs text-slate-300 font-mono">{data.verifier.slice(0, 4)}...{data.verifier.slice(-4)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-slate-500">Aadhar Number</span>
                                {decryptionStatus === 'success' ? (
                                    <span className="font-medium text-xs text-purple-300 font-mono">
                                        {privateData}
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {decryptionStatus === 'decrypting' && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
                                        {decryptionStatus === 'failed' && <span className="text-red-400 text-xs">Failed</span>}
                                        {decryptionStatus === 'idle' && <Lock className="w-3 h-3 text-slate-500" />}
                                    </div>
                                )}
                            </div>
                            {decryptionStatus === 'idle' && !connected && (
                                <div className="text-center py-2">
                                    <p className="text-xs text-yellow-400 mb-2">Connect authorized wallet to decrypt</p>
                                </div>
                            )}
                            {decryptionStatus === 'failed' && (
                                <div className="text-center py-2">
                                    <p className="text-xs text-red-400 break-words">{errorDetail || "Decryption failed"}</p>
                                </div>
                            )}


                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5 text-xs text-slate-600">
                            Cryptographically verified on Solana + Inco
                        </div>

                        {/* Debug Info */}

                    </div>
                )}

                {status === 'revoked' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Access Revoked</h1>
                        <p className="text-slate-400">The owner has revoked access to this document.</p>
                    </div>
                )}

                {status === 'expired' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-yellow-500/20">
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
                        <p className="text-slate-400">This share link is no longer valid.</p>
                    </div>
                )}

                {status === 'invalid' && (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                            <AlertTriangle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
                        <p className="text-slate-400">Could not find verification session.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
