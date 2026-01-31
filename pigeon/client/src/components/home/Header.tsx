import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import pigeon from "../../assets/pigeon.png";

export default function Header() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap py-6 border-b border-solid border-white/10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10">
          <img src={pigeon} alt="Pigeon" className="w-10 h-10 object-contain" />
        </div>
        <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
          Pigeon Protocol
        </h2>
      </div>

      <div className="hidden md:flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <a
            className="text-sm font-medium leading-normal text-gray-400 hover:text-white transition-colors"
            href="#"
          >
            Features
          </a>
          <a
            className="text-sm font-medium leading-normal text-gray-400 hover:text-white transition-colors"
            href="#"
          >
            Roadmap
          </a>
          <a
            className="text-sm font-medium leading-normal text-gray-400 hover:text-white transition-colors"
            href="#"
          >
            Docs
          </a>
          <a
            className="text-gray-400 hover:text-white transition-colors"
            href="https://github.com/some1uknow/pigeon"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
        <WalletMultiButton className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold leading-normal tracking-[-0.015em] transition-all duration-300 glow-effect bg-gradient-animate">
          <span className="truncate">Launch App</span>
        </WalletMultiButton>
      </div>
    </header>
  );
}
