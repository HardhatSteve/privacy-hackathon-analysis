
export default function SecuritySection() {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                    Cryptographic Security
                </h2>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Your messages are protected by battle-tested encryption algorithms.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 bg-white/2">
                    <div className="absolute inset-0 bg-linear-to-br from-violet-600/10 to-purple-600/10" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-violet-400 text-2xl">
                                    vpn_key
                                </span>
                            </div>
                            <h3 className="text-white text-xl font-bold">Key Exchange</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-gray-400 text-sm leading-relaxed">
                                <strong className="text-white">X25519 (Curve25519)</strong> elliptic curve Diffie-Hellman for secure key agreement
                            </p>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                <strong className="text-white">HKDF</strong> key derivation function to generate encryption keys
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 bg-white/2">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-indigo-600/10" />
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-400 text-2xl">
                                    enhanced_encryption
                                </span>
                            </div>
                            <h3 className="text-white text-xl font-bold">Encryption</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-gray-400 text-sm leading-relaxed">
                                <strong className="text-white">ChaCha20-Poly1305</strong> AEAD cipher for fast, authenticated encryption
                            </p>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                <strong className="text-white">Noble Crypto</strong> libraries - lightweight, auditable, zero dependencies
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
