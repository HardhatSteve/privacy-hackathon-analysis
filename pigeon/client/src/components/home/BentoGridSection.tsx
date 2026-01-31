import BentoCard from "./BentoCard";

const bentoFeatures = [
    {
        title: "Wallet-Native Identity",
        description: "No phone numbers, no email addresses. Your Solana wallet is your identity. Privacy from the start.",
        icon: "account_balance_wallet",
        gradient: "bg-linear-to-br from-violet-600/20 to-purple-600/20",
        size: "large" as const,
    },
    {
        title: "Real-time Sync",
        description: "WebSocket subscriptions ensure your messages arrive instantly without polling.",
        icon: "sync",
        gradient: "bg-linear-to-br from-blue-600/20 to-cyan-600/20",
        size: "small" as const,
    },
    {
        title: "Zero Metadata",
        description: "Only encrypted payloads touch the chain. No tracking, no profiling.",
        icon: "shield",
        gradient: "bg-linear-to-br from-indigo-600/20 to-violet-600/20",
        size: "small" as const,
    },
    {
        title: "Open Source",
        description: "Every line of code is public. Audit it yourself or trust the community review.",
        icon: "code",
        gradient: "bg-linear-to-br from-purple-600/20 to-pink-600/20",
        size: "small" as const,
    },
    {
        title: "ChaCha20-Poly1305",
        description: "Military-grade AEAD encryption using auditable Noble crypto libraries.",
        icon: "encrypted",
        gradient: "bg-linear-to-br from-pink-600/20 to-rose-600/20",
        size: "large" as const,
    },
];

export default function BentoGridSection() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                    Privacy-First Architecture
                </h2>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Every design decision prioritizes your privacy and security.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bentoFeatures.map((feature, index) => (
                    <BentoCard key={index} {...feature} />
                ))}
            </div>
        </div>
    );
}
