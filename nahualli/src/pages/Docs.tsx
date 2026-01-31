import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { 
  ChevronRight, 
  Shield, 
  Lock, 
  Database, 
  Fingerprint,
  FileCheck,
  Workflow,
  Code,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'

type Section = 
  | 'overview'
  | 'architecture'
  | 'encryption'
  | 'zk-proofs'
  | 'verification'
  | 'arcium'
  | 'api'

interface NavItem {
  id: Section
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
  { id: 'architecture', label: 'Architecture', icon: <Workflow className="w-4 h-4" /> },
  { id: 'encryption', label: 'Encryption', icon: <Lock className="w-4 h-4" /> },
  { id: 'zk-proofs', label: 'ZK Proofs', icon: <Fingerprint className="w-4 h-4" /> },
  { id: 'verification', label: 'Verification', icon: <FileCheck className="w-4 h-4" /> },
  { id: 'arcium', label: 'Arcium MXE', icon: <Database className="w-4 h-4" /> },
  { id: 'api', label: 'Technical API', icon: <Code className="w-4 h-4" /> },
]

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative group">
      <pre className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm language-${language}`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
      </button>
    </div>
  )
}

export function Docs() {
  const [activeSection, setActiveSection] = useState<Section>('overview')

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="pt-24 flex">
        {/* Sidebar */}
        <aside className="w-64 fixed left-0 top-24 bottom-0 bg-white border-r border-cream-dark overflow-y-auto p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-teal/10 text-teal font-medium'
                    : 'text-brown-light hover:bg-cream-dark/50 hover:text-brown'
                }`}
              >
                {item.icon}
                {item.label}
                {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>
          
          <div className="mt-8 pt-4 border-t border-cream-dark">
            <Link 
              to="/tests" 
              className="flex items-center gap-2 text-sm text-teal hover:underline"
            >
              Try Nahualli <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-8 max-w-4xl">
          {activeSection === 'overview' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Nahualli Documentation</h1>
              
              <p className="text-brown-light text-lg mb-8">
                Nahualli is a privacy-first psychometric assessment platform built on Solana. 
                Take personality tests once, own your results forever, and share selectively using zero-knowledge proofs.
              </p>

              <div className="bg-teal/10 border border-teal/20 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-brown mb-2">🦎 What is a Nahual?</h3>
                <p className="text-brown-light">
                  In Nahuatl culture, a <em>nahual</em> is a guardian spirit that can shapeshift to protect you. 
                  Nahualli does the same for your data — it transforms and hides your credentials, revealing only what you choose.
                </p>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Key Features</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 border border-cream-dark">
                  <Lock className="w-6 h-6 text-teal mb-2" />
                  <h4 className="font-semibold text-brown mb-1">End-to-End Encryption</h4>
                  <p className="text-sm text-brown-light">AES-256-GCM encryption with wallet-derived keys</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-cream-dark">
                  <Fingerprint className="w-6 h-6 text-teal mb-2" />
                  <h4 className="font-semibold text-brown mb-1">Zero-Knowledge Proofs</h4>
                  <p className="text-sm text-brown-light">Noir ZK proofs for selective disclosure</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-cream-dark">
                  <Database className="w-6 h-6 text-teal mb-2" />
                  <h4 className="font-semibold text-brown mb-1">Decentralized Storage</h4>
                  <p className="text-sm text-brown-light">IPFS (Pinata) + Solana Memo Program</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-cream-dark">
                  <Shield className="w-6 h-6 text-teal mb-2" />
                  <h4 className="font-semibold text-brown mb-1">Confidential Compute</h4>
                  <p className="text-sm text-brown-light">Arcium MXE for private processing</p>
                </div>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Tech Stack</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-cream-dark">
                      <th className="py-2 text-brown font-semibold">Layer</th>
                      <th className="py-2 text-brown font-semibold">Technology</th>
                    </tr>
                  </thead>
                  <tbody className="text-brown-light">
                    <tr className="border-b border-cream-dark/50"><td className="py-2">Frontend</td><td>React 18 + TypeScript + Vite + TailwindCSS</td></tr>
                    <tr className="border-b border-cream-dark/50"><td className="py-2">Blockchain</td><td>Solana (Wallet Adapter, Memo Program)</td></tr>
                    <tr className="border-b border-cream-dark/50"><td className="py-2">Storage</td><td>IPFS via Pinata</td></tr>
                    <tr className="border-b border-cream-dark/50"><td className="py-2">Encryption</td><td>AES-256-GCM (Web Crypto API)</td></tr>
                    <tr className="border-b border-cream-dark/50"><td className="py-2">ZK Proofs</td><td>Noir + Barretenberg (browser WASM)</td></tr>
                    <tr className="border-b border-cream-dark/50"><td className="py-2">Privacy</td><td>Arcium MXE (confidential compute)</td></tr>
                    <tr><td className="py-2">RPC</td><td>Helius / Solana Devnet</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === 'architecture' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Architecture</h1>
              
              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">User Flow</h2>
              
              <div className="bg-white rounded-xl p-6 border border-cream-dark mb-8">
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Connect Wallet', desc: 'User connects Phantom or other Solana wallet' },
                    { step: '2', title: 'Sign Message', desc: 'Derive deterministic AES-256 encryption key from signature' },
                    { step: '3', title: 'Take Assessment', desc: 'Complete Big Five, DISC, MBTI, or Enneagram test' },
                    { step: '4', title: 'Encrypt Results', desc: 'Results encrypted client-side before leaving browser' },
                    { step: '5', title: 'Store on IPFS', desc: 'Encrypted data uploaded to Pinata, get CID' },
                    { step: '6', title: 'Register on Solana', desc: 'CID stored on-chain via Memo Program (~$0.001)' },
                    { step: '7', title: 'Generate ZK Proofs', desc: 'Create verifiable claims without revealing scores' },
                    { step: '8', title: 'Share & Verify', desc: 'Share verification link with employers' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-teal text-cream flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-brown">{item.title}</h4>
                        <p className="text-sm text-brown-light">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Data Flow Diagram</h2>
              
              <CodeBlock language="text" code={`
┌─────────────────────────────────────────────────────────────┐
│                        USER FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser                    IPFS                  Solana    │
│  ┌──────┐                 ┌──────┐              ┌──────┐   │
│  │ Test │ ──encrypt──►    │Pinata│ ◄──CID──►    │ Memo │   │
│  │Results│                │      │              │Program│   │
│  └──────┘                 └──────┘              └──────┘   │
│      │                                              │       │
│      ▼                                              │       │
│  ┌──────┐                                           │       │
│  │ Noir │ ──ZK Proof──► IPFS ──► Solana Memo ◄─────┘       │
│  │Circuit│                                                  │
│  └──────┘                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`} />
            </section>
          )}

          {activeSection === 'encryption' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Encryption</h1>
              
              <p className="text-brown-light mb-6">
                All test results are encrypted client-side using AES-256-GCM before leaving your browser. 
                The encryption key is derived from your wallet signature, making it deterministic and recoverable.
              </p>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Key Derivation</h2>
              
              <CodeBlock code={`// 1. User signs a deterministic message
const message = "Nahualli Key Derivation v1"
const signature = await wallet.signMessage(message)

// 2. Hash the signature to get a 256-bit key
const keyMaterial = await crypto.subtle.digest('SHA-256', signature)

// 3. Import as AES-GCM key
const key = await crypto.subtle.importKey(
  'raw',
  keyMaterial,
  { name: 'AES-GCM' },
  false,
  ['encrypt', 'decrypt']
)`} />

              <h2 className="font-serif text-2xl font-semibold text-brown mt-8 mb-4">Encryption Process</h2>
              
              <CodeBlock code={`// Encrypt test results
async function encrypt(data: object, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  
  return {
    iv: base64Encode(iv),
    ciphertext: base64Encode(ciphertext)
  }
}`} />

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
                <h4 className="font-semibold text-yellow-800 mb-1">⚠️ Security Note</h4>
                <p className="text-sm text-yellow-700">
                  The encryption key is derived from your wallet signature. If you lose access to your wallet, 
                  you lose access to your encrypted data. There is no recovery mechanism by design.
                </p>
              </div>
            </section>
          )}

          {activeSection === 'zk-proofs' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Zero-Knowledge Proofs</h1>
              
              <p className="text-brown-light mb-6">
                Nahualli uses <strong>Noir</strong> (by Aztec) to generate zero-knowledge proofs that allow users 
                to prove claims about their personality without revealing actual scores.
              </p>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Proof Types</h2>
              
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-cream-dark">
                      <th className="py-2 text-brown font-semibold">Type</th>
                      <th className="py-2 text-brown font-semibold">Description</th>
                      <th className="py-2 text-brown font-semibold">Example</th>
                    </tr>
                  </thead>
                  <tbody className="text-brown-light">
                    <tr className="border-b border-cream-dark/50">
                      <td className="py-2 font-mono text-sm">trait_level</td>
                      <td>Prove a trait score is above a threshold</td>
                      <td>"My openness is above 70%"</td>
                    </tr>
                    <tr className="border-b border-cream-dark/50">
                      <td className="py-2 font-mono text-sm">test_completed</td>
                      <td>Prove you completed a specific test</td>
                      <td>"I completed the Big Five assessment"</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-sm">role_fit</td>
                      <td>Prove suitability for a role</td>
                      <td>"I am suitable for Analyst role"</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Noir Circuit Example</h2>
              
              <CodeBlock language="rust" code={`// noir-circuits/trait_level/src/main.nr
fn main(
    score: Field,           // Private: actual score (0-100)
    salt: Field,            // Private: random salt
    threshold: pub Field,   // Public: minimum threshold
) -> pub Field {            // Returns: commitment hash
    // Prove score meets threshold without revealing it
    assert(score >= threshold);
    
    // Generate commitment for verification
    let commitment = std::hash::pedersen([score, salt]);
    commitment[0]
}`} />

              <h2 className="font-serif text-2xl font-semibold text-brown mt-8 mb-4">On-Chain Format</h2>
              
              <p className="text-brown-light mb-4">
                ZK proofs are stored on Solana using the Memo Program:
              </p>
              
              <CodeBlock language="text" code={`NAHUALLI_ZK:<proofType>:<proofId>:<ipfsHash>:<commitment>:<timestamp>

Example:
NAHUALLI_ZK:role_fit:zkp_abc123:QmXyz...abc:0x1a2b3c4d:1706567890`} />
            </section>
          )}

          {activeSection === 'verification' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Public Verification</h1>
              
              <p className="text-brown-light mb-6">
                Each ZK proof generates a public verification URL that anyone can access without a wallet or paying gas.
              </p>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Verification Flow</h2>
              
              <div className="bg-white rounded-xl p-6 border border-cream-dark mb-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal text-cream flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold text-brown">Candidate generates proof</h4>
                      <p className="text-sm text-brown-light">Creates ZK proof in /proofs page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal text-cream flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-semibold text-brown">Copies verification link</h4>
                      <p className="text-sm text-brown-light">Link format: <code className="bg-cream-dark px-1 rounded">nahualli.app/verify/QmXyz...</code></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal text-cream flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-semibold text-brown">Employer opens link</h4>
                      <p className="text-sm text-brown-light">No wallet needed, no gas fees</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal text-cream flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                      <h4 className="font-semibold text-brown">Sees verification page</h4>
                      <p className="text-sm text-brown-light">Statement, validity badge, Solana TX link, IPFS link</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">What Employers See</h2>
              
              <ul className="list-disc list-inside text-brown-light space-y-2 mb-6">
                <li><strong>Statement:</strong> "This candidate is suitable for Analyst role"</li>
                <li><strong>Validity badge:</strong> ✅ Verified ZK Proof (Noir)</li>
                <li><strong>Creation date:</strong> When the proof was generated</li>
                <li><strong>Wallet address:</strong> Truncated (e.g., BL7v...mqV)</li>
                <li><strong>Links:</strong> IPFS raw data, Solana Explorer transaction</li>
              </ul>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-semibold text-green-800 mb-1">✅ Privacy Preserved</h4>
                <p className="text-sm text-green-700">
                  Employers can verify the claim is valid without seeing the actual test scores. 
                  They only see that the candidate meets the criteria.
                </p>
              </div>
            </section>
          )}

          {activeSection === 'arcium' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Arcium MXE Integration</h1>
              
              <p className="text-brown-light mb-6">
                Arcium's Multi-party Execution Environment (MXE) enables confidential compute on encrypted data. 
                Nahualli uses Arcium for secure processing of psychometric scores.
              </p>

              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Program ID (Devnet)</h2>
              
              <CodeBlock code={`6idYUYvub9XZLFTchE711q18EE3AtejQR3qkX3SrwGFx`} />

              <h2 className="font-serif text-2xl font-semibold text-brown mt-8 mb-4">Anchor Program</h2>
              
              <CodeBlock language="rust" code={`#[arcium_program]
pub mod nahualli {
    /// Submit psychometric scores for confidential processing
    pub fn process_scores(
        ctx: Context<ProcessScores>,
        computation_offset: u64,
        encrypted_scores: [u8; 32],  // Encrypted Pack<[u8; 8]>
        num_scores: u8,
        pubkey: [u8; 32],
        nonce: u128,
    ) -> Result<()> { ... }

    /// Callback when score processing is complete
    #[arcium_callback(encrypted_ix = "process_scores")]
    pub fn process_scores_callback(...) -> Result<()> { ... }
}`} />

              <h2 className="font-serif text-2xl font-semibold text-brown mt-8 mb-4">Encrypted Circuit</h2>
              
              <CodeBlock language="rust" code={`#[encrypted]
mod circuits {
    /// Generic psychometric score processor
    /// Runs inside MXE - data never exposed in plaintext
    #[instruction]
    pub fn process_scores(
        scores: Enc<Shared, Pack<[u8; 8]>>,
        num_scores: u8,
    ) -> Enc<Shared, Pack<[u8; 2]>> {
        let s = scores.to_arcis().unpack();
        let sum = s[0] + s[1] + s[2] + s[3] + s[4] + s[5] + s[6] + s[7];
        let result = Pack::new([sum, num_scores]);
        scores.owner.from_arcis(result)
    }
}`} />

              <h2 className="font-serif text-2xl font-semibold text-brown mt-8 mb-4">How It Works</h2>
              
              <CodeBlock language="text" code={`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Anchor    │────▶│  Arcium MXE │
│  (encrypt)  │     │  (queue TX) │     │  (compute)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Solana    │◀────│  Callback   │
                    │  (storage)  │     │  (results)  │
                    └─────────────┘     └─────────────┘
`} />
            </section>
          )}

          {activeSection === 'api' && (
            <section>
              <h1 className="font-serif text-4xl font-bold text-brown mb-6">Technical API</h1>
              
              <h2 className="font-serif text-2xl font-semibold text-brown mb-4">Core Functions</h2>

              <h3 className="font-semibold text-brown mt-6 mb-2">Encryption</h3>
              <CodeBlock code={`import { deriveKey, encrypt, decrypt } from './lib/encryption'

// Derive key from wallet signature
const key = await deriveKey(wallet)

// Encrypt data
const encrypted = await encrypt(testResults, key)

// Decrypt data
const decrypted = await decrypt(encrypted, key)`} />

              <h3 className="font-semibold text-brown mt-6 mb-2">IPFS Storage</h3>
              <CodeBlock code={`import { uploadToIPFS, fetchFromIPFS } from './lib/ipfs'

// Upload encrypted results
const ipfsHash = await uploadToIPFS(encryptedData, testType)

// Fetch from IPFS
const data = await fetchFromIPFS(ipfsHash)`} />

              <h3 className="font-semibold text-brown mt-6 mb-2">Solana Storage</h3>
              <CodeBlock code={`import { storeOnChain, fetchFromChain } from './lib/solana-storage'

// Store IPFS hash on Solana
const signature = await storeOnChain(
  connection,
  wallet,
  ipfsHash,
  testType
)

// Fetch all results from chain
const results = await fetchFromChain(connection, walletAddress)`} />

              <h3 className="font-semibold text-brown mt-6 mb-2">ZK Proofs</h3>
              <CodeBlock code={`import { generateZKProofAsync } from './lib/zkproofs'

// Generate a trait level proof
const proof = await generateZKProofAsync({
  type: 'trait_level',
  testType: 'big5',
  trait: 'openness',
  threshold: 70,
  walletAddress: wallet.publicKey.toString()
})

// Generate a role fit proof
const roleFitProof = await generateZKProofAsync({
  type: 'role_fit',
  testType: 'big5',
  role: 'Analyst',
  walletAddress: wallet.publicKey.toString()
})`} />

              <h3 className="font-semibold text-brown mt-6 mb-2">Verification</h3>
              <CodeBlock code={`import { fetchZKProofFromIPFS } from './lib/ipfs'

// Fetch proof for verification (no wallet needed)
const proofData = await fetchZKProofFromIPFS(ipfsHash)

// proofData contains:
// - statement: "This candidate is suitable for Analyst role"
// - proof: base64 encoded proof
// - publicInputs: { role, threshold, etc }
// - noirProof: { commitment, ... }
// - solanaSignature: transaction signature`} />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
