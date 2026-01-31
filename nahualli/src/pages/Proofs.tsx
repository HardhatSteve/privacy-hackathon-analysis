import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Shield, Plus, Copy, Check, Clock, Loader2, Zap, ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { useToast } from '../components/Toast'
import { useEncryptedStorage } from '../hooks/useEncryptedStorage'
import { 
  generateZKProofAsync, 
  getProofsByWallet, 
  storeProof, 
  getAvailableRoles,
  generateShareableLink,
  verifyZKProof
} from '../lib/zkproofs'
import { uploadZKProofToIPFS, fetchZKProofFromIPFS } from '../lib/ipfs'
import { storeZKProofOnChain, fetchZKProofsFromChain, getExplorerUrl } from '../lib/solana-storage'
import type { ZKProof, ProofType } from '../lib/zkproofs'
import type { TestResult } from '../lib/big5-questions'

// Generic result type that works with any test
type AnyTestResult = Record<string, number>

// Trait options per test type
const TRAIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  big5: [
    { value: 'openness', label: 'Openness' },
    { value: 'conscientiousness', label: 'Conscientiousness' },
    { value: 'extraversion', label: 'Extraversion' },
    { value: 'agreeableness', label: 'Agreeableness' },
    { value: 'neuroticism', label: 'Neuroticism' },
  ],
  disc: [
    { value: 'dominance', label: 'Dominance' },
    { value: 'influence', label: 'Influence' },
    { value: 'steadiness', label: 'Steadiness' },
    { value: 'conscientiousness', label: 'Conscientiousness' },
  ],
  mbti: [
    { value: 'extraversion', label: 'Extraversion' },
    { value: 'intuition', label: 'Intuition' },
    { value: 'feeling', label: 'Feeling' },
    { value: 'perceiving', label: 'Perceiving' },
  ],
  enneagram: [
    { value: 'type1', label: 'Type 1 (Reformer)' },
    { value: 'type2', label: 'Type 2 (Helper)' },
    { value: 'type3', label: 'Type 3 (Achiever)' },
    { value: 'type4', label: 'Type 4 (Individualist)' },
    { value: 'type5', label: 'Type 5 (Investigator)' },
    { value: 'type6', label: 'Type 6 (Loyalist)' },
    { value: 'type7', label: 'Type 7 (Enthusiast)' },
    { value: 'type8', label: 'Type 8 (Challenger)' },
    { value: 'type9', label: 'Type 9 (Peacemaker)' },
  ],
}

// Loaded test with its data
interface LoadedTest {
  ipfsHash: string
  testType: string
  timestamp: number
  scores: AnyTestResult
}

export function Proofs() {
  const { publicKey, connected, signTransaction } = useWallet()
  const { getMyResults, loadTestResult, syncFromChain } = useEncryptedStorage()
  const { showToast, ToastWrapper } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [proofs, setProofs] = useState<ZKProof[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSavingToChain, setIsSavingToChain] = useState(false)
  
  // All available tests that can be decrypted
  const [availableTests, setAvailableTests] = useState<LoadedTest[]>([])
  const [selectedTestIndex, setSelectedTestIndex] = useState(0)
  
  const [proofType, setProofType] = useState<ProofType>('test_completed')
  const [selectedTrait, setSelectedTrait] = useState<string>('openness')
  const [threshold, setThreshold] = useState(70)
  const [selectedRole, setSelectedRole] = useState(getAvailableRoles()[0])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Current selected test
  const selectedTest = availableTests[selectedTestIndex] || null
  const latestResults = selectedTest?.scores || null
  const latestTestType = selectedTest?.testType || 'big5'
  
  // Get available traits based on test type
  const availableTraits = TRAIT_OPTIONS[latestTestType] || TRAIT_OPTIONS.big5

  useEffect(() => {
    if (publicKey) {
      setProofs(getProofsByWallet(publicKey.toBase58()))
      loadAllTests()
    }
  }, [publicKey])

  // When test selection changes, update default trait
  useEffect(() => {
    if (selectedTest) {
      const traits = TRAIT_OPTIONS[selectedTest.testType] || TRAIT_OPTIONS.big5
      if (traits && traits.length > 0) {
        setSelectedTrait(traits[0].value)
      }
    }
  }, [selectedTestIndex, selectedTest?.testType])

  const loadAllTests = async () => {
    const myResults = getMyResults()
    console.log('Loading all tests, found:', myResults.length)
    
    const loaded: LoadedTest[] = []
    
    // Try to decrypt all results
    for (const result of myResults) {
      try {
        const data = await loadTestResult(result.ipfsHash)
        if (data && 'scores' in data) {
          loaded.push({
            ipfsHash: result.ipfsHash,
            testType: result.testType || 'big5',
            timestamp: result.timestamp,
            scores: data.scores as AnyTestResult
          })
        }
      } catch (error) {
        console.warn('Could not decrypt result:', result.ipfsHash)
      }
    }
    
    // Sort by timestamp descending (most recent first)
    loaded.sort((a, b) => b.timestamp - a.timestamp)
    setAvailableTests(loaded)
    setSelectedTestIndex(0)
    
    console.log('Loaded tests:', loaded.length)
  }

  const handleGenerateProof = async () => {
    console.log('handleGenerateProof called', { publicKey: publicKey?.toBase58(), latestResults, selectedTrait, proofType, threshold })
    if (!publicKey || !latestResults) {
      console.error('Cannot generate proof: missing publicKey or latestResults')
      showToast('No test results found. Please complete a test first.', 'error')
      return
    }

    console.log('Setting isGenerating to true')
    setIsGenerating(true)
    
    try {
      let proof: ZKProof
      
      // Convert to TestResult format for zkproofs compatibility
      const resultsForProof = latestResults as unknown as TestResult
      console.log('proofType:', proofType)

      switch (proofType) {
        case 'test_completed':
          console.log('Generating test_completed proof for', latestTestType)
          proof = await generateZKProofAsync(resultsForProof, { type: 'test_completed', testType: latestTestType }, publicKey.toBase58())
          break
        case 'trait_level':
          // Get the actual score for the selected trait
          const traitScore = latestResults[selectedTrait]
          console.log('Generating trait_level proof:', { trait: selectedTrait, score: traitScore, threshold })
          
          if (traitScore === undefined) {
            throw new Error(`Trait ${selectedTrait} not found in results`)
          }
          
          proof = await generateZKProofAsync(
            resultsForProof, 
            { type: 'trait_level', trait: selectedTrait as keyof TestResult, threshold }, 
            publicKey.toBase58()
          )
          break
        case 'role_fit':
          console.log('Generating role_fit proof')
          proof = await generateZKProofAsync(
            resultsForProof, 
            { type: 'role_fit', role: selectedRole }, 
            publicKey.toBase58()
          )
          break
        default:
          console.log('Unknown proofType, returning')
          return
      }

      console.log('Proof generated:', proof)
      
      // Save to localStorage first
      storeProof(proof)
      setProofs(getProofsByWallet(publicKey.toBase58()))
      setShowGenerator(false)
      
      // Now save to blockchain if we have a real Noir proof
      if (proof.noirProof && signTransaction) {
        setIsSavingToChain(true)
        showToast('ZK Proof generated! Saving to blockchain...', 'info')
        
        try {
          // Upload proof to IPFS
          const proofData = {
            id: proof.id,
            type: proof.type,
            statement: proof.statement,
            proof: proof.proof,
            publicInputs: proof.publicInputs,
            noirProof: proof.noirProof,
            createdAt: proof.createdAt,
            walletAddress: proof.walletAddress,
          }
          const ipfsHash = await uploadZKProofToIPFS(proofData)
          
          // Store reference on Solana
          const signature = await storeZKProofOnChain(
            proof.id,
            proof.type,
            ipfsHash,
            proof.noirProof.commitment,
            signTransaction,
            publicKey
          )
          
          // Update proof with on-chain data
          const updatedProof = {
            ...proof,
            ipfsHash,
            solanaSignature: signature,
          }
          storeProof(updatedProof)
          setProofs(getProofsByWallet(publicKey.toBase58()))
          
          showToast(`ZK Proof saved on-chain! TX: ${signature.slice(0, 8)}...`, 'success')
        } catch (chainError) {
          console.error('Failed to save to blockchain:', chainError)
          showToast('Proof generated locally. Failed to save on-chain (you can retry later).', 'info')
        } finally {
          setIsSavingToChain(false)
        }
      } else {
        showToast('ZK Proof generated successfully!', 'success')
      }
    } catch (error) {
      console.error('Failed to generate proof:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      // Parse Noir assertion errors into user-friendly messages
      if (errorMsg.includes('Not fit for')) {
        const roleMatch = errorMsg.match(/Not fit for (\w+):/)
        const reasonMatch = errorMsg.match(/: (.+)$/)
        const role = roleMatch?.[1] || selectedRole
        const reason = reasonMatch?.[1] || 'requirements not met'
        showToast(`You don't meet the requirements for ${role} role. Reason: ${reason}. Try a different role.`, 'error')
      } else if (errorMsg.includes('Score is below threshold')) {
        showToast(`Your ${selectedTrait} score is below ${threshold}%. You can only generate a proof if your score meets the threshold.`, 'error')
      } else {
        showToast(`Failed to generate proof: ${errorMsg}`, 'error')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (proof: ZKProof) => {
    // Use verify link if proof is on IPFS, otherwise use old shareable link
    const link = proof.ipfsHash 
      ? `${window.location.origin}/verify/${proof.ipfsHash}`
      : generateShareableLink(proof)
    await navigator.clipboard.writeText(link)
    setCopiedId(proof.id)
    showToast('Verification link copied!', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            Connect your wallet to view and generate zero-knowledge proofs.
          </p>
        </div>
      </div>
    )
  }

  const handleSyncFromChain = async () => {
    setIsSyncing(true)
    try {
      await syncFromChain()
      await loadAllTests()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncProofsFromChain = async () => {
    if (!publicKey) return
    
    setIsSyncing(true)
    showToast('Syncing ZK proofs from blockchain...', 'info')
    
    try {
      // Fetch ZK proof references from Solana
      const onChainProofs = await fetchZKProofsFromChain(publicKey.toBase58())
      console.log('Found on-chain proofs:', onChainProofs.length)
      
      let syncedCount = 0
      const existingProofs = getProofsByWallet(publicKey.toBase58())
      const existingIds = new Set(existingProofs.map(p => p.id))
      
      for (const onChainProof of onChainProofs) {
        // Skip if we already have this proof locally
        if (existingIds.has(onChainProof.proofId)) {
          continue
        }
        
        try {
          // Fetch full proof from IPFS
          const proofData = await fetchZKProofFromIPFS(onChainProof.ipfsHash)
          
          // Validate it has required fields
          if (!proofData.id || !proofData.type || !proofData.statement) {
            console.warn('Invalid proof data from IPFS:', onChainProof.ipfsHash)
            continue
          }
          
          // Add on-chain metadata
          const fullProof: ZKProof = {
            id: proofData.id as string,
            type: proofData.type as ProofType,
            statement: proofData.statement as string,
            proof: proofData.proof as string,
            publicInputs: proofData.publicInputs as Record<string, string | number | boolean>,
            createdAt: proofData.createdAt as number,
            expiresAt: (proofData.expiresAt as number | null) ?? null,
            walletAddress: proofData.walletAddress as string,
            noirProof: proofData.noirProof as ZKProof['noirProof'],
            ipfsHash: onChainProof.ipfsHash,
            solanaSignature: onChainProof.signature,
          }
          
          storeProof(fullProof)
          syncedCount++
        } catch (e) {
          console.warn('Failed to fetch proof from IPFS:', onChainProof.ipfsHash, e)
        }
      }
      
      // Refresh proofs list
      setProofs(getProofsByWallet(publicKey.toBase58()))
      
      if (syncedCount > 0) {
        showToast(`Synced ${syncedCount} ZK proof(s) from blockchain!`, 'success')
      } else if (onChainProofs.length > 0) {
        showToast('All proofs already synced.', 'info')
      } else {
        showToast('No ZK proofs found on blockchain.', 'info')
      }
    } catch (error) {
      console.error('Failed to sync proofs:', error)
      showToast('Failed to sync proofs from blockchain.', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const hasLocalResults = getMyResults().length > 0

  if (!latestResults) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="pt-32 px-6 text-center">
          <Shield className="w-16 h-16 mx-auto text-teal mb-6" />
          <h1 className="font-serif text-3xl font-bold text-brown mb-4">
            {hasLocalResults ? 'Cannot Decrypt Old Results' : 'No Assessment Found'}
          </h1>
          <p className="text-brown-light max-w-md mx-auto mb-8">
            {hasLocalResults 
              ? 'Your previous tests were encrypted with a different key. Please take a new test to generate ZK proofs.'
              : 'You need to complete an assessment before generating proofs.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!hasLocalResults && (
              <button
                onClick={handleSyncFromChain}
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 bg-teal text-cream px-8 py-4 rounded-full font-semibold hover:bg-teal/80 transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing from Solana...
                  </>
                ) : (
                  'Sync from Blockchain'
                )}
              </button>
            )}
            <a 
              href="/tests"
              className="inline-block bg-brown text-cream px-8 py-4 rounded-full font-semibold hover:bg-brown-light transition-colors"
            >
              Take New Assessment
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <ToastWrapper />
      <div className="pt-28 px-6 max-w-4xl mx-auto pb-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brown">
              Zero-Knowledge Proofs
            </h1>
            <p className="text-brown-light mt-1">
              Share verified claims without revealing your data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncProofsFromChain}
              disabled={isSyncing}
              className="flex items-center gap-2 border-2 border-teal text-teal px-4 py-2 rounded-full font-semibold hover:bg-teal hover:text-cream transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Sync
            </button>
            <button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-2 bg-brown text-cream px-6 py-3 rounded-full font-semibold hover:bg-brown-light transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Proof
            </button>
          </div>
        </div>

        {/* Proof Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-cream rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif text-2xl font-bold text-brown mb-6">
                Generate New Proof
              </h2>

              <div className="space-y-6">
                {/* Test Selector */}
                {availableTests.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-brown mb-2">
                      Select Test
                    </label>
                    <select
                      value={selectedTestIndex}
                      onChange={(e) => setSelectedTestIndex(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border-2 border-cream-dark bg-white text-brown focus:border-teal outline-none"
                    >
                      {availableTests.map((test, index) => (
                        <option key={test.ipfsHash} value={index}>
                          {test.testType === 'big5' ? 'Big Five' : 
                           test.testType === 'disc' ? 'DISC' : 
                           test.testType === 'mbti' ? 'MBTI' : 
                           test.testType === 'enneagram' ? 'Enneagram' : test.testType} 
                          {' - '}
                          {new Date(test.timestamp).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-brown mb-2">
                    Proof Type
                  </label>
                  <select
                    value={proofType}
                    onChange={(e) => setProofType(e.target.value as ProofType)}
                    className="w-full p-3 rounded-xl border-2 border-cream-dark bg-white text-brown focus:border-teal outline-none"
                  >
                    <option value="test_completed">Test Completed</option>
                    <option value="trait_level">Trait Level</option>
                    <option value="role_fit">Role Fit</option>
                  </select>
                </div>

                {proofType === 'trait_level' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-brown mb-2">
                        Trait ({latestTestType.toUpperCase()})
                      </label>
                      <select
                        value={selectedTrait}
                        onChange={(e) => setSelectedTrait(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-cream-dark bg-white text-brown focus:border-teal outline-none"
                      >
                        {availableTraits.map((trait) => (
                          <option key={trait.value} value={trait.value}>
                            {trait.label} ({latestResults?.[trait.value] ?? 0}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brown mb-2">
                        Threshold: {threshold}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full accent-teal"
                      />
                      <p className="text-xs text-brown-light mt-1">
                        Proves your score is above or below this threshold
                      </p>
                    </div>
                  </>
                )}

                {proofType === 'role_fit' && (
                  <div>
                    <label className="block text-sm font-medium text-brown mb-2">
                      Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-cream-dark bg-white text-brown focus:border-teal outline-none"
                    >
                      {getAvailableRoles().map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-cream-dark/50 rounded-xl p-4">
                  <p className="text-sm text-brown-light">
                    <strong className="text-brown">Preview:</strong>{' '}
                    {proofType === 'test_completed' && `I have completed the ${
                      latestTestType === 'big5' ? 'Big Five' : 
                      latestTestType === 'disc' ? 'DISC' : 
                      latestTestType === 'mbti' ? 'MBTI' : 
                      latestTestType === 'enneagram' ? 'Enneagram' : 'personality'
                    } assessment`}
                    {proofType === 'trait_level' && `My ${selectedTrait} score is HIGH/LOW (threshold: ${threshold})`}
                    {proofType === 'role_fit' && `I am suitable/not suitable for ${selectedRole} role`}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowGenerator(false)}
                    disabled={isGenerating || isSavingToChain}
                    className="flex-1 py-3 rounded-full border-2 border-brown text-brown font-semibold hover:bg-brown hover:text-cream transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateProof}
                    disabled={isGenerating || isSavingToChain}
                    className="flex-1 py-3 rounded-full bg-brown text-cream font-semibold hover:bg-brown-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating ZK Proof...
                      </>
                    ) : isSavingToChain ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving to blockchain...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proofs List */}
        {proofs.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 mx-auto text-cream-dark mb-4" />
            <p className="text-brown-light">No proofs generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proofs.map((proof) => {
              const verification = verifyZKProof(proof)
              const isExpired = proof.expiresAt && Date.now() > proof.expiresAt

              return (
                <div 
                  key={proof.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm ${isExpired ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        verification.valid 
                          ? 'bg-teal/10 text-teal' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {verification.valid ? 'Valid' : 'Invalid'}
                      </span>
                      <h3 className="font-semibold text-brown mt-2">
                        {proof.statement}
                      </h3>
                    </div>
                    <button
                      onClick={() => copyToClipboard(proof)}
                      className="p-2 rounded-lg hover:bg-cream-dark transition-colors"
                      title="Copy shareable link"
                    >
                      {copiedId === proof.id ? (
                        <Check className="w-5 h-5 text-teal" />
                      ) : (
                        <Copy className="w-5 h-5 text-brown-light" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(proof.publicInputs).map(([key, value]) => (
                      <span 
                        key={key}
                        className="px-2 py-1 bg-cream-dark rounded text-xs text-brown-light"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-brown-light">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Created: {formatDate(proof.createdAt)}
                    </span>
                    {proof.expiresAt && (
                      <span className={isExpired ? 'text-red-500' : ''}>
                        {isExpired ? 'Expired' : `Expires: ${formatDate(proof.expiresAt)}`}
                      </span>
                    )}
                    {proof.solanaSignature && (
                      <a
                        href={getExplorerUrl(proof.solanaSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-teal hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Solana
                      </a>
                    )}
                    {proof.ipfsHash && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${proof.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        IPFS
                      </a>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-cream-dark">
                    <div className="flex items-center gap-2 mb-2">
                      {proof.noirProof && (
                        <span className="px-2 py-0.5 bg-teal/10 text-teal text-xs rounded-full">
                          Noir ZK
                        </span>
                      )}
                      {proof.solanaSignature && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                          On-chain
                        </span>
                      )}
                      {proof.ipfsHash && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                          IPFS
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-brown-light/60 break-all">
                      {proof.proof}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
