import { Lock, Fingerprint, Network } from 'lucide-react'
import { Header } from '../components/Header'
import { FeatureCard } from '../components/FeatureCard'

export function Landing() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Hero Section - Full Width Image with aspect ratio preserved */}
      <section className="relative w-full pt-20">
        <img 
          src="/images/nahualli3.jpg" 
          alt="Nahualli - Your digital guardian" 
          className="w-full h-auto"
        />
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-6 bg-cream-dark/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-semibold text-brown mb-4">
            Your hidden self, cryptographically protected
          </h2>
          <p className="text-brown-light text-lg max-w-2xl mx-auto">
            Own, encrypt, and selectively share your most sensitive data on Solana. 
            Fully private. User controlled.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Lock className="w-10 h-10" />}
              title="End-to-End Encryption"
              description="Your data is locked, only you hold the key."
            />
            <FeatureCard 
              icon={<Fingerprint className="w-10 h-10" />}
              title="Adaptive Identity"
              description="Reveal only what you choose, exactly when you choose."
            />
            <FeatureCard 
              icon={<Network className="w-10 h-10" />}
              title="Zero-Knowledge Proofs"
              description="Prove your credentials without exposing any data."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-cream-dark/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-semibold text-brown text-center mb-12">
            How it Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Connect Wallet', desc: 'Your identity on Solana' },
              { step: '2', title: 'Take Assessment', desc: 'Encrypted on-chain' },
              { step: '3', title: 'Generate Proof', desc: 'Share selectively with ZK' },
              { step: '4', title: 'Verify', desc: 'Recruiter confirms privately' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal text-cream flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-brown mb-1">{item.title}</h3>
                <p className="text-brown-light text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built With */}
      <section className="py-16 px-6 bg-brown/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brown-light text-sm mb-8">BUILT WITH</p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {/* Solana */}
            <a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <svg className="h-10 w-auto" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#solana-a)"/>
                <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#solana-b)"/>
                <path d="M332.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H5.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#solana-c)"/>
                <defs>
                  <linearGradient id="solana-a" x1="360.9" y1="-37.5" x2="141.2" y2="383.6" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
                  </linearGradient>
                  <linearGradient id="solana-b" x1="264.8" y1="-87.6" x2="45.2" y2="333.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
                  </linearGradient>
                  <linearGradient id="solana-c" x1="312.5" y1="-62.7" x2="92.9" y2="358.4" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-sm font-medium text-brown">Solana</span>
            </a>
            
            {/* Noir */}
            <a href="https://noir-lang.org" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/images/noir.png" alt="Noir" className="h-10 w-auto object-contain" />
              <span className="text-sm font-medium text-brown">Noir</span>
            </a>
            
            {/* Arcium */}
            <a href="https://arcium.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/images/arcium.svg" alt="Arcium" className="h-10 w-auto object-contain" />
              <span className="text-sm font-medium text-brown">Arcium</span>
            </a>
            
            {/* Helius */}
            <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/images/helius.png" alt="Helius" className="h-10 w-auto object-contain" />
              <span className="text-sm font-medium text-brown">Helius</span>
            </a>
            
            {/* Pinata */}
            <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <img src="/images/pinata.svg" alt="Pinata" className="h-10 w-auto object-contain" />
              <span className="text-sm font-medium text-brown">Pinata</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-cream-dark">
        <div className="max-w-4xl mx-auto text-center text-brown-light text-sm space-y-2">
          <p>© 2026 Nahualli. Your hidden self, cryptographically protected. Made with ❤️ from 🇲🇽</p>
        </div>
      </footer>
    </div>
  )
}
