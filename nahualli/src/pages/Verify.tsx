import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, ExternalLink, Clock, User, Loader2, AlertTriangle } from 'lucide-react'
import { fetchZKProofFromIPFS, getIPFSUrl } from '../lib/ipfs'
import { getExplorerUrl } from '../lib/solana-storage'

interface ProofData {
  id: string
  type: string
  statement: string
  proof: string
  publicInputs: Record<string, string | number | boolean>
  createdAt: number
  walletAddress?: string
  noirProof?: {
    proof: string
    commitment: string
    threshold: number
    trait: string
  }
  ipfsHash?: string
  solanaSignature?: string
  expiresAt?: number
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateAddress(address: string): string {
  if (!address) return 'N/A'
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Verify() {
  const { ipfsHash } = useParams<{ ipfsHash: string }>()
  const [searchParams] = useSearchParams()
  const [proof, setProof] = useState<ProofData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setProofSource] = useState<'ipfs' | 'query'>('ipfs')

  useEffect(() => {
    async function loadProof() {
      // Check for base64 encoded proof in query params first
      const queryProof = searchParams.get('proof')
      
      if (queryProof) {
        try {
          const decoded = JSON.parse(atob(queryProof))
          const proofData: ProofData = {
            id: decoded.id || 'query_proof',
            type: decoded.type || 'unknown',
            statement: decoded.statement || 'Proof statement',
            proof: decoded.proof || '',
            publicInputs: decoded.publicInputs || {},
            createdAt: decoded.publicInputs?.timestamp || Date.now(),
            walletAddress: decoded.walletAddress,
            expiresAt: decoded.expiresAt
          }
          setProof(proofData)
          setProofSource('query')
          setLoading(false)
          return
        } catch (e) {
          console.error('Failed to decode query proof:', e)
        }
      }

      // Fall back to IPFS hash
      if (!ipfsHash) {
        setError('No proof ID provided')
        setLoading(false)
        return
      }

      try {
        const data = await fetchZKProofFromIPFS(ipfsHash)
        
        if (!data.id || !data.statement) {
          setError('Invalid proof data')
          setLoading(false)
          return
        }

        const proofData: ProofData = {
          id: data.id as string,
          type: data.type as string,
          statement: data.statement as string,
          proof: data.proof as string,
          publicInputs: (data.publicInputs as Record<string, string | number | boolean>) || {},
          createdAt: data.createdAt as number,
          walletAddress: data.walletAddress as string,
          noirProof: data.noirProof as ProofData['noirProof'],
          solanaSignature: data.solanaSignature as string | undefined,
          ipfsHash
        }
        setProof(proofData)
        setProofSource('ipfs')
      } catch (e) {
        console.error('Failed to load proof:', e)
        setError('Failed to load proof from IPFS')
      } finally {
        setLoading(false)
      }
    }

    loadProof()
  }, [ipfsHash, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal mx-auto mb-4" />
          <p className="text-brown-light">Loading proof from IPFS...</p>
        </div>
      </div>
    )
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-brown mb-2">
            Proof Not Found
          </h1>
          <p className="text-brown-light mb-6">
            {error || 'The proof you are looking for does not exist or has been removed.'}
          </p>
          <Link
            to="/"
            className="inline-block bg-brown text-cream px-6 py-3 rounded-full font-semibold hover:bg-brown-light transition-colors"
          >
            Go to Nahualli
          </Link>
        </div>
      </div>
    )
  }

  const isNoirProof = !!proof.noirProof
  const proofTypeLabel = {
    'trait_level': 'Trait Level Proof',
    'test_completed': 'Test Completion Proof',
    'role_fit': 'Role Fit Proof'
  }[proof.type] || 'ZK Proof'

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-cream-dark">
        <div className="max-w-4xl mx-auto px-6 py-1 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo1.png" alt="Nahualli" className="w-20 h-20 object-contain" />
            <img src="/images/nahualli.jpg" alt="Nahualli" className="w-50 h-20 object-contain" />
          </Link>
          <span className="text-sm text-brown-light">Proof Verification</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Verification Badge */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <div className="flex items-center justify-center mb-6">
            {isNoirProof ? (
              <div className="flex items-center gap-3 bg-teal/10 text-teal px-6 py-3 rounded-full">
                <CheckCircle className="w-8 h-8" />
                <span className="text-xl font-bold">Verified ZK Proof</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-100 text-amber-700 px-6 py-3 rounded-full">
                <AlertTriangle className="w-8 h-8" />
                <span className="text-xl font-bold">Simulated Proof</span>
              </div>
            )}
          </div>

          {/* Statement */}
          <div className="text-center mb-8">
            <p className="text-sm text-brown-light mb-2">{proofTypeLabel}</p>
            <h1 className="font-serif text-2xl font-bold text-brown">
              "{proof.statement}"
            </h1>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs text-brown-light mb-1">Created</p>
              <p className="font-medium text-brown flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDate(proof.createdAt)}
              </p>
            </div>
            <div className="bg-cream rounded-xl p-4">
              <p className="text-xs text-brown-light mb-1">Wallet</p>
              <p className="font-medium text-brown flex items-center gap-2">
                <User className="w-4 h-4" />
                {truncateAddress(proof.walletAddress || '')}
              </p>
            </div>
          </div>

          {/* Public Inputs */}
          {Object.keys(proof.publicInputs).length > 0 && (
            <div className="mb-8">
              <p className="text-sm text-brown-light mb-3">Public Inputs (Verifiable)</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(proof.publicInputs).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-3 py-2 bg-cream rounded-lg text-sm text-brown"
                  >
                    <span className="text-brown-light">{key}:</span> {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification Links */}
          {(ipfsHash || proof.solanaSignature) && (
            <div className="border-t border-cream-dark pt-6">
              <p className="text-sm text-brown-light mb-3">Verify On-Chain</p>
              <div className="flex flex-wrap gap-3">
                {ipfsHash && (
                  <a
                    href={getIPFSUrl(ipfsHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on IPFS
                  </a>
                )}
                {proof.solanaSignature && (
                  <a
                    href={getExplorerUrl(proof.solanaSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal rounded-lg hover:bg-teal/20 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Solana
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Technical Details (Collapsible) */}
        <details className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <summary className="px-6 py-4 cursor-pointer hover:bg-cream transition-colors font-medium text-brown">
            Technical Details
          </summary>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <p className="text-xs text-brown-light mb-1">Proof ID</p>
              <p className="font-mono text-sm text-brown break-all">{proof.id}</p>
            </div>
            {ipfsHash && (
              <div>
                <p className="text-xs text-brown-light mb-1">IPFS Hash</p>
                <p className="font-mono text-sm text-brown break-all">{ipfsHash}</p>
              </div>
            )}
            {proof.noirProof && (
              <>
                <div>
                  <p className="text-xs text-brown-light mb-1">Commitment Hash</p>
                  <p className="font-mono text-sm text-brown break-all">{proof.noirProof.commitment}</p>
                </div>
                <div>
                  <p className="text-xs text-brown-light mb-1">Noir Proof (Base64)</p>
                  <p className="font-mono text-xs text-brown-light break-all max-h-24 overflow-y-auto">
                    {proof.noirProof.proof.slice(0, 200)}...
                  </p>
                </div>
              </>
            )}
            {proof.solanaSignature && (
              <div>
                <p className="text-xs text-brown-light mb-1">Solana Transaction</p>
                <p className="font-mono text-sm text-brown break-all">{proof.solanaSignature}</p>
              </div>
            )}
          </div>
        </details>

        {/* Footer Note */}
        <p className="text-center text-sm text-brown-light mt-8">
          This proof was generated using Nahualli's zero-knowledge proof system.
          <br />
          The actual test scores remain private and are never revealed.
        </p>
      </main>
    </div>
  )
}
