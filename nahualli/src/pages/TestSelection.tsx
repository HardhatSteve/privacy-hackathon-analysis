import { useWallet } from '@solana/wallet-adapter-react'
import { Link } from 'react-router-dom'
import { Shield, Clock, BarChart3, ArrowRight } from 'lucide-react'
import { Header } from '../components/Header'
import { getAllTests } from '../lib/tests-config'

// Background images for each test type
const TEST_BACKGROUNDS: Record<string, string> = {
  enneagram: '/images/enneagram-bg.jpg',
  // Add more as needed:
   big5: '/images/big5-bg.jpg',
   disc: '/images/disc-bg.jpg',
   mbti: '/images/mbti-bg.jpg',
}

export function TestSelection() {
  const { connected } = useWallet()
  const tests = getAllTests()

  if (!connected) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 text-center">
          <Shield className="w-16 h-16 mx-auto text-teal mb-6" />
          <h1 className="font-serif text-3xl font-bold text-brown mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-brown-light max-w-md mx-auto">
            To take assessments and own your results on-chain, please connect your Solana wallet first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="pt-28 px-6 max-w-4xl mx-auto pb-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold text-brown mb-4">
            Choose Your Assessment
          </h1>
          <p className="text-brown-light max-w-2xl mx-auto">
            Select a psychometric test to discover insights about your personality. 
            All results are encrypted and processed confidentially using Arcium MXE.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const bgImage = TEST_BACKGROUNDS[test.id]
            
            return (
              <Link
                key={test.id}
                to={`/assessment/${test.id}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                {/* Card Image */}
                {bgImage && (
                  <div 
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  />
                )}
                
                {/* Card Content */}
                <div className="p-6">
                  <h3 className="font-serif text-xl font-semibold text-brown mb-2 group-hover:text-teal transition-colors">
                    {test.name}
                  </h3>
                  <p className="text-sm text-brown-light mb-4">
                    {test.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-brown-light">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {test.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.estimatedTime}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {test.dimensions.map((dim) => (
                      <span
                        key={dim}
                        className="px-2 py-1 rounded-full text-xs bg-cream-dark/50 text-brown-light"
                      >
                        {dim}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center text-teal text-sm font-medium">
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 bg-teal/10 rounded-2xl p-6 text-center">
          <Shield className="w-10 h-10 mx-auto text-teal mb-3" />
          <h3 className="font-semibold text-brown mb-2">Your Data, Your Control</h3>
          <p className="text-brown-light text-sm max-w-lg mx-auto">
            All assessments are processed using Arcium's confidential computing. 
            Your raw answers never leave your device unencrypted, and only you can access your results.
          </p>
        </div>
      </div>
    </div>
  )
}
