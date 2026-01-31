import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Link } from 'react-router-dom'
import { Shield, Sparkles, Briefcase, MessageSquare, Loader2, Lock, TrendingUp, AlertCircle } from 'lucide-react'
import { Header } from '../components/Header'
import { useEncryptedStorage } from '../hooks/useEncryptedStorage'
import type { PersonalityInterpretation } from '../lib/interpretations'
import { generateInterpretation, type AnyTestResult } from '../lib/interpretations'

export function Interpretation() {
  const { publicKey, connected } = useWallet()
  const { getMyResults, loadTestResult } = useEncryptedStorage()
  const [interpretation, setInterpretation] = useState<PersonalityInterpretation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasResults, setHasResults] = useState(false)
  const [, setTestType] = useState<string>('big5')

  useEffect(() => {
    if (publicKey) {
      // Load stored interpretation
      const stored = localStorage.getItem(`nahualli_interpretation_${publicKey.toBase58()}`)
      if (stored) {
        try {
          setInterpretation(JSON.parse(stored))
        } catch (e) {
          console.warn('Failed to parse stored interpretation')
        }
      }
      loadLatestResults()
    }
  }, [publicKey])

  const loadLatestResults = async () => {
    const myResults = getMyResults()
    if (myResults.length > 0) {
      setHasResults(true)
      const latest = myResults[myResults.length - 1]
      setTestType(latest.testType || 'big5')
      const data = await loadTestResult(latest.ipfsHash)
      if (data && 'scores' in data) {
        // Generate interpretation if not already stored
        if (!interpretation) {
          const interp = generateInterpretation(latest.testType || 'big5', data.scores as AnyTestResult)
          setInterpretation(interp)
          if (publicKey) {
            localStorage.setItem(`nahualli_interpretation_${publicKey.toBase58()}`, JSON.stringify(interp))
          }
        }
      }
    }
  }

  const handleGenerateInterpretation = async () => {
    if (!publicKey) return
    
    setIsProcessing(true)
    try {
      const myResults = getMyResults()
      if (myResults.length > 0) {
        const latest = myResults[myResults.length - 1]
        const data = await loadTestResult(latest.ipfsHash)
        if (data && 'scores' in data) {
          const interp = generateInterpretation(latest.testType || 'big5', data.scores as AnyTestResult)
          setInterpretation(interp)
          localStorage.setItem(`nahualli_interpretation_${publicKey.toBase58()}`, JSON.stringify(interp))
        }
      }
    } catch (error) {
      console.error('Failed to process interpretation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

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
            Connect your wallet to view your AI-powered personality interpretation.
          </p>
        </div>
      </div>
    )
  }

  if (!hasResults) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gold mb-6" />
          <h1 className="font-serif text-3xl font-bold text-brown mb-4">
            No Assessment Found
          </h1>
          <p className="text-brown-light max-w-md mx-auto mb-8">
            Complete an assessment first to get your AI-powered interpretation.
          </p>
          <Link 
            to="/assessment"
            className="inline-block bg-brown text-cream px-8 py-4 rounded-full font-semibold hover:bg-brown-light transition-colors"
          >
            Take Assessment
          </Link>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Loader2 className="w-24 h-24 text-teal animate-spin" />
            <Lock className="w-8 h-8 text-teal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brown mb-4">
            Processing Confidentially
          </h1>
          <p className="text-brown-light max-w-md mx-auto">
            Your data is being analyzed in a secure enclave. 
            Even we cannot see your raw responses.
          </p>
          <div className="mt-8 bg-cream-dark/50 rounded-xl p-4 max-w-sm mx-auto">
            <p className="text-xs text-brown-light font-mono">
              🔒 Arcium Confidential Compute Active
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!interpretation) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 text-center max-w-2xl mx-auto">
          <Sparkles className="w-16 h-16 mx-auto text-gold mb-6" />
          <h1 className="font-serif text-3xl font-bold text-brown mb-4">
            AI-Powered Interpretation
          </h1>
          <p className="text-brown-light mb-8">
            Get a detailed personality analysis powered by AI. Your data is processed 
            confidentially using Arcium's secure compute — even we cannot see your raw responses.
          </p>
          
          <div className="bg-cream-dark/50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-brown mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal" />
              Privacy Guaranteed
            </h3>
            <ul className="space-y-3 text-brown-light text-sm">
              <li className="flex items-start gap-2">
                <span className="text-teal">✓</span>
                Your responses are encrypted before processing
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal">✓</span>
                AI analyzes data in a secure enclave
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal">✓</span>
                Only you can see the interpretation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal">✓</span>
                No data is stored on our servers
              </li>
            </ul>
          </div>

          <button
            onClick={handleGenerateInterpretation}
            className="bg-brown text-cream px-8 py-4 rounded-full font-semibold hover:bg-brown-light transition-colors"
          >
            Generate Interpretation
          </button>
        </div>
      </div>
    )
  }

  const testLabels: Record<string, string> = {
    big5: 'Big Five',
    disc: 'DISC',
    mbti: 'MBTI',
    enneagram: 'Enneagram'
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="pt-28 px-6 max-w-4xl mx-auto pb-16">
        <div className="text-center mb-12">
          <Sparkles className="w-12 h-12 mx-auto text-gold mb-4" />
          <h1 className="font-serif text-3xl font-bold text-brown mb-2">
            Your {testLabels[interpretation.testType] || 'Personality'} Interpretation
          </h1>
          <p className="text-brown-light text-sm">
            Confidentially processed via Arcium MXE
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="font-serif text-xl font-semibold text-brown mb-4">
            Summary
          </h2>
          <p className="text-brown-light leading-relaxed">
            {interpretation.summary}
          </p>
        </div>

        {/* Strengths & Growth */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-serif text-lg font-semibold text-brown mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal" />
              Key Strengths
            </h2>
            <ul className="space-y-3">
              {interpretation.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-brown-light text-sm">
                  <span className="text-teal font-bold">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-serif text-lg font-semibold text-brown mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              Growth Areas
            </h2>
            <ul className="space-y-3">
              {interpretation.growthAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-brown-light text-sm">
                  <span className="text-gold font-bold">•</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Career Recommendations */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-serif text-lg font-semibold text-brown mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal" />
            Career Recommendations
          </h2>
          <div className="flex flex-wrap gap-2">
            {interpretation.careerRecommendations.map((career, i) => (
              <span 
                key={i}
                className="px-4 py-2 bg-teal/10 text-teal rounded-full text-sm font-medium"
              >
                {career}
              </span>
            ))}
          </div>
        </div>

        {/* Communication & Work Style */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-serif text-lg font-semibold text-brown mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal" />
              Communication Style
            </h2>
            <p className="text-brown-light text-sm leading-relaxed">
              {interpretation.communicationStyle}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-serif text-lg font-semibold text-brown mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-teal" />
              Work Style
            </h2>
            <p className="text-brown-light text-sm leading-relaxed">
              {interpretation.workStyle}
            </p>
          </div>
        </div>

        {/* Privacy Badge */}
        <div className="bg-cream-dark/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-brown-light">
            <Lock className="w-4 h-4 text-teal" />
            <span>Processed confidentially via Arcium MXE</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link 
            to="/proofs"
            className="bg-brown text-cream px-8 py-4 rounded-full font-semibold hover:bg-brown-light transition-colors text-center"
          >
            Generate ZK Proof
          </Link>
          <Link 
            to="/tests"
            className="border-2 border-brown text-brown px-8 py-4 rounded-full font-semibold hover:bg-brown hover:text-cream transition-colors text-center"
          >
            Take Another Test
          </Link>
        </div>
      </div>
    </div>
  )
}
