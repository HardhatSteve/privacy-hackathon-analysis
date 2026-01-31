import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import pigeon from "../../assets/pigeon.png";

export default function Hero() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className="flex flex-col gap-8 text-center lg:text-left fade-in-up">
        <div className="space-y-4">
          <h1 className="text-white text-5xl md:text-7xl font-bold leading-[0.95] tracking-[-0.03em]">
            The Future of
            <br />
            <span className="bg-linear-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Private Messaging
            </span>
            <br />
            is Here.
          </h1>
          <p className="text-gray-400 text-base md:text-lg font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
            Experience truly secure, serverless chat powered by the speed of the Solana blockchain.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
          <WalletMultiButton className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-base font-semibold leading-normal tracking-[-0.015em] transition-all duration-300 glow-effect bg-gradient-animate">
            <span className="truncate">Launch App</span>
          </WalletMultiButton>
        </div>
      </div>

      <div className="flex items-center justify-center fade-in-up stagger-1">
        <img
          className="holographic-pigeon max-w-xs md:max-w-sm lg:max-w-md"
          src={pigeon}
          alt="Holographic pigeon"
        />
      </div>
    </div>
  );
}
