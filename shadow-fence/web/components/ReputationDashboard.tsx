'use client';

import React, { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface UserProfile {
  authority: string;
  reputation_score: number;
}

export function ReputationDashboard() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey || !connection) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
        const [userProfilePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('user-profile'), publicKey.toBuffer()],
          programId
        );

        const account = await connection.getAccountInfo(userProfilePda);
        if (account) {
          // Simple parsing - in production use @coral-xyz/anchor to decode
          setProfile({
            authority: publicKey.toBase58(),
            reputation_score: Math.floor(Math.random() * 100), // Demo data
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [publicKey, connection]);

  if (!publicKey) {
    return (
      <div className="card text-center">
        <p className="text-gray-400">Connect your wallet to view your reputation</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card text-center">
        <span className="loading-spinner mx-auto" />
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Reputation Dashboard</h2>
      
      <div className="space-y-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Wallet Address</p>
          <p className="text-sm font-mono break-all text-cyan-400">{publicKey?.toBase58()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-xs text-cyan-400 font-medium">Reputation Score</p>
            <p className="text-3xl font-bold text-cyan-300 mt-2">{profile?.reputation_score || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <p className="text-xs text-purple-400 font-medium">Proofs Verified</p>
            <p className="text-3xl font-bold text-purple-300 mt-2">
              {Math.floor((profile?.reputation_score || 0) / 5)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
            <p className="text-xs text-green-400 font-medium">Account Status</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <p className="text-sm font-bold text-green-300">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
