import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { Header } from '../components/Header';
import { ProofGenerator } from '../components/ProofGenerator';
import { ReputationDashboard } from '../components/ReputationDashboard';
import DonationBox from '../components/DonationBox';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-black text-lime-500 font-mono selection:bg-lime-500 selection:text-black">
      <Head>
        <title>Shadow Fence | Hard Hat TechBones</title>
        <meta name="description" content="Zero-Knowledge Location Verification" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        {/* Main Banner Image */}
        <div className="w-full max-w-lg mb-6 relative">
             <Image
                src="/banner.png"
                alt="Shadow Fence Banner"
                width={600}
                height={400}
                priority
                className="w-full h-auto object-contain"
              />
        </div>

        {/* Sub-banner Text from Screenshot */}
        <div className="text-center mb-12 space-y-1">
          <p className="text-white text-sm md:text-base tracking-wider uppercase">
            PRIVACY-PRESERVING GEOLOCATION VERIFIER //
          </p>
          <p className="text-lime-500 text-sm md:text-base tracking-wider uppercase font-bold glow-text">
            SECURE CONNECTION ESTABLISHED
          </p>
        </div>

        {/* Terminal Uplink Section */}
        <div className="w-full max-w-2xl">
          <ProofGenerator />
        </div>
        
        <div className="w-full max-w-2xl mt-12">
            <ReputationDashboard />
        </div>

        {/* Donation Section */}
        <DonationBox />
      </main>
    </div>
  );
};

export default Home;
