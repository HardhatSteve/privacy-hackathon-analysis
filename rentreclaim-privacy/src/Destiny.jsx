import { useState, useEffect } from 'react';

const API_URL = 'https://api.rentreclaim.xyz';

const plural = (n, singular, pluralForm) => `${n} ${n === 1 ? singular : (pluralForm || singular + 's')}`;

export default function Destiny() {
  const [wallet, setWallet] = useState('');
  const [destiny, setDestiny] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [copied, setCopied] = useState(false);

  // Animate luck score
  useEffect(() => {
    if (destiny?.luckScore) {
      let current = 0;
      const target = destiny.luckScore;
      const step = Math.ceil(target / 30);
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          setAnimatedScore(target);
          clearInterval(timer);
        } else {
          setAnimatedScore(current);
        }
      }, 25);
      return () => clearInterval(timer);
    }
  }, [destiny?.luckScore]);

  const getDestiny = async () => {
    if (!wallet) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/destiny?wallet=${wallet}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDestiny(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const connectWallet = async () => {
    if (window.solana) {
      const resp = await window.solana.connect();
      setWallet(resp.publicKey.toString());
    }
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(destiny.fullWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const url = `https://rentreclaim.xyz/destiny?ref=${destiny.shareCode}`;
    const text = `🔮 My 2026 Solana Destiny:

${destiny.archetype} ${destiny.archetypeEmoji}
"${destiny.prophecy}"

Lucky Token: $${destiny.luckyToken}
Power Month: ${destiny.powerMonth}
Luck Score: ${destiny.luckScore}/99

Discover yours 👇
${url}`;
    navigator.clipboard.writeText(text);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getReclaimMessage = () => {
    if (!destiny?.reclaimable) return null;
    const { eligible, totalSol, accountCount } = destiny.reclaimable;
    if (eligible) {
      return `✨ The universe has ${totalSol.toFixed(4)} hidden SOL waiting for you!`;
    }
    if (accountCount > 0) {
      return `${plural(accountCount, 'empty account')} found (below minimum)`;
    }
    return null;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔮 2026 Destiny Reclaim</h1>
        <p style={{ color: '#aaa', marginBottom: '30px' }}>Discover what your wallet reveals about your 2026</p>
        
        {!destiny ? (
          <div>
            <input
              type="text"
              placeholder="Enter Solana wallet address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && getDestiny()}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', marginBottom: '10px', fontSize: '14px', background: '#2a2a3e', color: 'white' }}
            />
            <button
              onClick={getDestiny}
              disabled={loading || !wallet}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: 'none', background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', color: 'white', fontSize: '16px', cursor: loading || !wallet ? 'not-allowed' : 'pointer', marginBottom: '10px', opacity: loading || !wallet ? 0.6 : 1 }}
            >
              {loading ? 'Reading the chains...' : 'Reveal My 2026 Destiny'}
            </button>
            <button
              onClick={connectWallet}
              style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #667eea', background: 'transparent', color: '#667eea', fontSize: '14px', cursor: 'pointer' }}
            >
              Or Connect Phantom
            </button>
            {error && <p style={{ color: '#ff6b6b', marginTop: '10px' }}>{error}</p>}
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px', textAlign: 'left' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '4rem' }}>{destiny.archetypeEmoji}</span>
              <h2 style={{ margin: '10px 0' }}>{destiny.archetype}</h2>
              <p 
                style={{ color: '#aaa', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={copyWallet}
                title="Click to copy"
              >
                {destiny.wallet}
                <span style={{ fontSize: '12px' }}>{copied ? '✓' : '📋'}</span>
              </p>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{destiny.reading}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '12px' }}>Lucky Token</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{destiny.luckyToken}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '12px' }}>Power Month</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{destiny.powerMonth}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '12px' }}>Luck Score</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{animatedScore}/99</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '12px' }}>Element</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{destiny.element}</div>
              </div>
            </div>
            
            {getReclaimMessage() && (
              <div style={{ background: destiny.reclaimable?.eligible ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '15px', marginBottom: '15px', textAlign: 'center' }}>
                {getReclaimMessage()}
              </div>
            )}

            {destiny.reclaimable?.eligible && (
              <a href="/app" style={{ display: 'block', background: 'linear-gradient(90deg, #00ff88 0%, #00cc6a 100%)', borderRadius: '10px', padding: '15px', marginBottom: '15px', textAlign: 'center', color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>
                ✨ Claim {destiny.reclaimable.totalSol.toFixed(4)} Hidden SOL →
              </a>
            )}
            
            <button
              onClick={() => { setDestiny(null); setWallet(''); setAnimatedScore(0); }}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #667eea', background: 'transparent', color: 'white', cursor: 'pointer', marginBottom: '10px' }}
            >
              Check Another Wallet
            </button>

            <button
              onClick={shareOnTwitter}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#667eea', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              📋 Copy & Share on X (Twitter)
            </button>
          </div>
        )}
        
        <p style={{ marginTop: '30px', color: '#666', fontSize: '12px' }}>
          ✨ "My wallet told me my 2026 destiny AND gave me free SOL"
        </p>
        <p style={{ marginTop: '10px', color: '#444', fontSize: '10px' }}>
          For entertainment purposes. Not financial advice.
        </p>
        <a href="/" style={{ color: '#667eea', fontSize: '14px', marginTop: '20px', display: 'inline-block' }}>← Back to RentReclaim</a>
      </div>
    </div>
  );
}
