import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Link } from 'react-router-dom'
import { Shield, Clock, ExternalLink, Eye, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { Header } from '../components/Header'
import { useEncryptedStorage } from '../hooks/useEncryptedStorage'
import type { StoredTestResult } from '../lib/ipfs'
import { getIPFSUrl } from '../lib/ipfs'
import { generateInterpretation, type AnyTestResult, type PersonalityInterpretation } from '../lib/interpretations'
// getExplorerUrl available for future use
// import { getExplorerUrl } from '../lib/solana-storage'

const TEST_LABELS: Record<string, string> = {
  big5: 'Big Five',
  disc: 'DISC',
  mbti: 'MBTI',
  enneagram: 'Enneagram'
}

const TEST_ICONS: Record<string, string> = {
  big5: '🧠',
  disc: '📊',
  mbti: '🔮',
  enneagram: '⭐'
}

export function History() {
  const { publicKey, connected } = useWallet()
  const { getMyResults, loadTestResult, syncFromChain } = useEncryptedStorage()
  const [results, setResults] = useState<StoredTestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<StoredTestResult | null>(null)
  const [interpretation, setInterpretation] = useState<PersonalityInterpretation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (publicKey) {
      const myResults = getMyResults()
      setResults(myResults.reverse()) // Most recent first
    }
  }, [publicKey, getMyResults])

  const handleSyncFromChain = async () => {
    setIsSyncing(true)
    try {
      const synced = await syncFromChain()
      setResults(synced.reverse())
    } finally {
      setIsSyncing(false)
    }
  }

  const handleViewInterpretation = async (result: StoredTestResult) => {
    setSelectedResult(result)
    setIsLoading(true)
    
    try {
      const data = await loadTestResult(result.ipfsHash)
      if (data && 'scores' in data) {
        const interp = generateInterpretation(result.testType || 'big5', data.scores as AnyTestResult)
        setInterpretation(interp)
      }
    } catch (error) {
      console.error('Failed to load result:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your local history? This will not delete data from IPFS.')) {
      localStorage.removeItem('nahualli_results')
      setResults([])
      setSelectedResult(null)
      setInterpretation(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            Connect your wallet to view your assessment history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="pt-28 px-6 max-w-6xl mx-auto pb-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brown mb-2">
              Assessment History
            </h1>
            <p className="text-brown-light">
              {results.length} assessment{results.length !== 1 ? 's' : ''} completed
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncFromChain}
              disabled={isSyncing}
              className="flex items-center gap-2 text-teal hover:text-teal/80 text-sm disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync from Solana
            </button>
            {results.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear Local
              </button>
            )}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 mx-auto text-brown-light/50 mb-4" />
            <p className="text-brown-light mb-6">No assessments yet</p>
            <Link
              to="/tests"
              className="inline-block bg-brown text-cream px-6 py-3 rounded-full font-semibold hover:bg-brown-light transition-colors"
            >
              Take Your First Test
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Results List */}
            <div className="lg:col-span-1 space-y-3">
              {results.map((result, index) => (
                <button
                  key={result.ipfsHash + index}
                  onClick={() => handleViewInterpretation(result)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedResult?.ipfsHash === result.ipfsHash
                      ? 'border-teal bg-teal/5'
                      : 'border-cream-dark hover:border-teal/50 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{TEST_ICONS[result.testType] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brown">
                        {TEST_LABELS[result.testType] || result.testType}
                      </p>
                      <p className="text-xs text-brown-light truncate">
                        {formatDate(result.timestamp)}
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-brown-light" />
                  </div>
                </button>
              ))}
            </div>

            {/* Interpretation Panel */}
            <div className="lg:col-span-2">
              {!selectedResult ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <p className="text-brown-light">
                    Select an assessment to view its interpretation
                  </p>
                </div>
              ) : isLoading ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-6 bg-cream-dark rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-cream-dark rounded w-2/3 mx-auto mb-2"></div>
                    <div className="h-4 bg-cream-dark rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : interpretation ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-serif text-xl font-semibold text-brown">
                        {TEST_LABELS[interpretation.testType]} Interpretation
                      </h2>
                      {!selectedResult.ipfsHash.startsWith('local_') && !selectedResult.ipfsHash.startsWith('Qm') && (
                        <a
                          href={getIPFSUrl(selectedResult.ipfsHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-teal text-sm hover:underline"
                        >
                          View on IPFS <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-brown-light leading-relaxed">
                      {interpretation.summary}
                    </p>
                  </div>

                  {/* Strengths & Growth */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-semibold text-brown mb-3 text-sm">Strengths</h3>
                      <ul className="space-y-2">
                        {interpretation.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-brown-light text-sm">
                            <span className="text-teal">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-semibold text-brown mb-3 text-sm">Growth Areas</h3>
                      <ul className="space-y-2">
                        {interpretation.growthAreas.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-brown-light text-sm">
                            <span className="text-gold">•</span> {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Careers */}
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="font-semibold text-brown mb-3 text-sm">Career Recommendations</h3>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.careerRecommendations.map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-teal/10 text-teal rounded-full text-sm">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Styles */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-semibold text-brown mb-2 text-sm">Communication Style</h3>
                      <p className="text-brown-light text-sm">{interpretation.communicationStyle}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-semibold text-brown mb-2 text-sm">Work Style</h3>
                      <p className="text-brown-light text-sm">{interpretation.workStyle}</p>
                    </div>
                  </div>

                  {/* IPFS Info */}
                  <div className="bg-cream-dark/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-brown-light font-mono">
                      CID: {selectedResult.ipfsHash.slice(0, 20)}...
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
