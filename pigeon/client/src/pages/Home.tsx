import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/home/Header";
import Hero from "../components/home/Hero";
import FeaturesSection from "../components/home/FeaturesSection";
import BentoGridSection from "../components/home/BentoGridSection";
import ComparisonSection from "../components/home/ComparisonSection";
import TechStackSection from "../components/home/TechStackSection";
import SecuritySection from "../components/home/SecuritySection";
import StatsSection from "../components/home/StatsSection";
import CTASection from "../components/home/CTASection";
import "./Home.css";

export default function Home() {
  const { connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected) navigate("/chats");
  }, [connected, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-display bg-[#0A0A1A] text-[#E0E0E0]">
      <div className="absolute inset-0 z-0 radial-glow" />
      <div className="absolute inset-0 z-0 subtle-grid" />

      <div className="relative z-10 flex h-full grow flex-col">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Header />

          <main className="py-16 md:py-24 space-y-32">
            <Hero />
            <FeaturesSection />
            <BentoGridSection />
            <ComparisonSection />
            <TechStackSection />
            <SecuritySection />
            <StatsSection />
            <CTASection />
          </main>
        </div>
      </div>
    </div>
  );
}
