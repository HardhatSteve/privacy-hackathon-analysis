import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function CTASection() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-violet-600/20 via-purple-600/20 to-indigo-600/20" />
            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
                <h2 className="text-white text-4xl md:text-5xl font-bold tracking-[-0.02em]">
                    Ready to Take Back Your Privacy?
                </h2>
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
                    Join the decentralized messaging revolution. No servers, no surveillance, no compromises.
                </p>
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                    <WalletMultiButton className="flex min-w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-base font-semibold leading-normal tracking-[-0.015em] transition-all duration-300 glow-effect bg-gradient-animate">
                        <span className="truncate">Get Started Now</span>
                    </WalletMultiButton>
                    <a
                        href="https://github.com/some1uknow/pigeon"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-40 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-base font-semibold leading-normal tracking-[-0.015em] transition-all duration-300"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span className="truncate">View on GitHub</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
