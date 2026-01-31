import { Link, useLocation } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'

export function Header() {
  const location = useLocation()
  const { connected } = useWallet()
  const isHome = location.pathname === '/'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-sm border-b border-cream-dark">
      <div className="max-w-7xl mx-auto px-6 py-1 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/logo1.png" alt="Nahualli" className="w-20 h-20 object-contain" />
          <img src="/images/nahualli.jpg" alt="Nahualli" className="w-50 h-20 object-contain" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {isHome ? (
            <>
              <a href="#features" className="text-brown-light hover:text-brown transition-colors">Features</a>
              <a href="#how-it-works" className="text-brown-light hover:text-brown transition-colors">How it Works</a>
              <Link to="/docs" className="text-brown-light hover:text-brown transition-colors">Docs</Link>
            </>
          ) : connected && (
            <>
              <Link 
                to="/tests" 
                className={`transition-colors ${location.pathname === '/tests' || location.pathname.startsWith('/assessment') ? 'text-brown font-medium' : 'text-brown-light hover:text-brown'}`}
              >
                Tests
              </Link>
              <Link 
                to="/history" 
                className={`transition-colors ${location.pathname === '/history' ? 'text-brown font-medium' : 'text-brown-light hover:text-brown'}`}
              >
                History
              </Link>
              <Link 
                to="/proofs" 
                className={`transition-colors ${location.pathname === '/proofs' ? 'text-brown font-medium' : 'text-brown-light hover:text-brown'}`}
              >
                Proofs
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isHome && (
            <Link 
              to="/tests" 
              className="bg-white text-brown border border-cream-dark px-6 rounded-full font-sans text-sm font-medium hover:bg-cream transition-colors h-[36px] flex items-center"
            >
              Enter App
            </Link>
          )}
          <WalletMultiButton 
            style={{ 
              backgroundColor: 'white', 
              color: '#5D4E37', 
              border: '1px solid #E8E4DC',
              borderRadius: '9999px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'sans-serif',
              height: '36px',
              lineHeight: '36px'
            }} 
          />
        </div>
      </div>
    </header>
  )
}
