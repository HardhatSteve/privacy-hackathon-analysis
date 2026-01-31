import{j as e}from"./index-HKquI-t2.js";import{r as a}from"./wallet-adapters-BrkyT213.js";import{C as Se,T as ie,P as V,c as oe,d as ke,S as Ne,e as Te,f as Re}from"./solana-core-C4IjULEX.js";import"./wallet-ui-CFNU3nNx.js";const y={RPC_ENDPOINT:"https://api.mainnet-beta.solana.com",DEVNET_ENDPOINT:"https://api.devnet.solana.com",FEE_WALLET:"12XYR5vEB2Jr7iejDgDsS2KwRePHPQQXjigtbV3uAhRN",FEE_MODEL:"flat",FLAT_FEE_LAMPORTS:5e5,PERCENT_FEE_BPS:2e3,CLOSES_PER_TX:6,COMPUTE_UNIT_LIMIT:2e5,COMPUTE_UNIT_PRICE:5e4,EST_RENT_LAMPORTS:2039280,API_URL:"https://api.rentreclaim.xyz"},Ce=`
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  
  :root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-card: #1a1a24;
    --accent-green: #00ff88;
    --accent-purple: #a855f7;
    --accent-blue: #3b82f6;
    --text-primary: #ffffff;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --border: #2a2a3a;
    --danger: #ef4444;
    --warning: #f59e0b;
  }
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Space Mono', monospace;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
  }
  
  .app-container {
    min-height: 100vh;
    background: 
      radial-gradient(ellipse at 20% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
      var(--bg-primary);
  }
  
  .header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }
  
  .wallet-btn {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    color: #000;
  }
  
  .wallet-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 255, 136, 0.3);
  }
  
  .wallet-btn.connected {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--accent-green);
  }
  
  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }
  
  .hero {
    text-align: center;
    margin-bottom: 4rem;
  }
  
  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
  }
  
  .hero-title .highlight {
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto 2rem;
    line-height: 1.6;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    border-color: var(--accent-green);
    transform: translateY(-4px);
  }
  
  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--accent-green);
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .scanner-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .btn {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    padding: 0.875rem 1.75rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, var(--accent-green), #00cc6a);
    color: #000;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 255, 136, 0.4);
  }
  
  .btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }
  
  .btn-secondary:hover:not(:disabled) {
    border-color: var(--accent-green);
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .account-list {
    max-height: 350px;
    overflow-y: auto;
    margin-top: 1rem;
  }
  
  .account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    margin-bottom: 0.75rem;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .account-item:hover { border-color: var(--border); }
  .account-item.selected {
    border-color: var(--accent-green);
    background: rgba(0, 255, 136, 0.05);
  }
  
  .account-address {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
  
  .account-mint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }
  
  .account-rent {
    font-weight: 700;
    color: var(--accent-green);
  }
  
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .checkbox.checked {
    background: var(--accent-green);
    border-color: var(--accent-green);
  }
  
  .checkbox.checked::after {
    content: '✓';
    color: #000;
    font-size: 0.75rem;
    font-weight: 700;
  }
  
  .select-all-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 1rem;
    cursor: pointer;
  }
  
  .summary-card {
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(59, 130, 246, 0.1));
    border: 1px solid var(--accent-green);
    border-radius: 16px;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }
  
  .summary-row:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }
  
  .summary-label { color: var(--text-secondary); }
  .summary-value { font-weight: 700; }
  .summary-value.highlight {
    color: var(--accent-green);
    font-size: 1.25rem;
  }
  
  .status-message {
    padding: 1rem;
    border-radius: 12px;
    margin: 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .status-message.info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid var(--accent-blue);
    color: var(--accent-blue);
  }
  
  .status-message.success {
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid var(--accent-green);
    color: var(--accent-green);
  }
  
  .status-message.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
  }
  
  .status-message.warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid var(--warning);
    color: var(--warning);
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }
  
  .empty-state-icon { font-size: 4rem; margin-bottom: 1rem; }
  
  .empty-state-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .progress-container { margin: 1.5rem 0; }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    text-align: center;
  }
  
  .tx-log {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
    max-height: 200px;
    overflow-y: auto;
    font-size: 0.8rem;
  }
  
  .tx-log-entry {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .tx-log-entry:last-child { border-bottom: none; }
  
  .tx-link {
    color: var(--accent-blue);
    text-decoration: none;
    word-break: break-all;
  }
  
  .tx-link:hover { text-decoration: underline; }
  
  .footer {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    border-top: 1px solid var(--border);
    margin-top: 4rem;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  
  .action-buttons .btn {
    flex: 1;
    min-width: 200px;
    justify-content: center;
  }
  
  .fee-breakdown {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }
  
  .referral-badge {
    background: var(--accent-purple);
    color: #fff;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  
  @media (max-width: 768px) {
    .header { padding: 1rem; }
    .main-content { padding: 1.5rem 1rem; }
    .scanner-section { padding: 1.5rem; }
    .account-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .action-buttons { flex-direction: column; }
    .action-buttons .btn { min-width: 100%; }
  }
`,Z=(r,s=4)=>{if(!r)return"";const u=typeof r=="string"?r:r.toBase58();return`${u.slice(0,s)}...${u.slice(-s)}`},z=r=>{const s=r/1e9;return s<1e-4?`${r.toLocaleString()} lamports`:s<.01?`${s.toFixed(6)} SOL`:`${s.toFixed(4)} SOL`},q=r=>(r/1e9).toFixed(4),Pe=()=>typeof window>"u"?null:new URLSearchParams(window.location.search).get("ref"),Le=(r,s)=>{const u=["Timestamp","Account","Mint","Program","Status","Signature","Recovered (lamports)"],x=r.map(o=>[new Date().toISOString(),o.address,o.mint||"N/A",o.program||"Token Program",o.status,o.signature||"N/A",o.recovered||0]),g=[[],["SUMMARY"],["Total Accounts",s.count],["Total Recovered (lamports)",s.totalRecovered],["Total Recovered (SOL)",(s.totalRecovered/1e9).toFixed(6)],["Fee Paid (lamports)",s.feePaid],["Fee Paid (SOL)",(s.feePaid/1e9).toFixed(6)]];return[u,...x,...g].map(o=>o.join(",")).join(`
`)},Ae=(r,s)=>{const u=new Blob([r],{type:"text/csv"}),x=URL.createObjectURL(u),g=document.createElement("a");g.href=x,g.download=s,g.click(),URL.revokeObjectURL(x)};async function ze(r,s){const u=[];async function x(g,o){var b,p,i;try{const v=await r.getParsedTokenAccountsByOwner(s,{programId:g},{commitment:"confirmed"});for(const{pubkey:d,account:k}of v.value)try{const h=(b=k.data.parsed)==null?void 0:b.info;if(!h)continue;const j=((p=h.tokenAmount)==null?void 0:p.amount)==="0",c=(h.extensions||[]).find(M=>(M==null?void 0:M.extension)==="transferFeeAmount"),E=((i=c==null?void 0:c.state)==null?void 0:i.withheldAmount)||0,W=Number(E)>0,f=h.state==="initialized",$=h.closeAuthority,Y=!$||$===s.toBase58();j&&f&&Y&&!W&&u.push({address:d.toBase58(),pubkey:d,mint:h.mint,program:o,programId:g.toBase58(),rentLamports:k.lamports})}catch(h){console.warn("Error parsing account:",h)}}catch(v){console.error(`Error scanning ${o}:`,v)}}return await Promise.all([x(Te,"Token Program"),x(Re,"Token-2022")]),u}async function ce(r,s=5){const g=["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB","So11111111111111111111111111111111111111112","mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So","7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj","DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263","JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"].sort(()=>Math.random()-.5).slice(0,s).map(o=>r.getTokenSupply(new V(o)).catch(()=>null));await Promise.all(g.map(async(o,b)=>(await new Promise(p=>setTimeout(p,50+Math.random()*150*b)),o)))}function Q(r,s){return r*y.FLAT_FEE_LAMPORTS}async function Ee(r,s,u,x){const g=[],o={};for(const b of u){const p=b.programId;o[p]||(o[p]=[]),o[p].push(b)}for(const[b,p]of Object.entries(o))for(let i=0;i<p.length;i+=y.CLOSES_PER_TX){const v=p.slice(i,i+y.CLOSES_PER_TX),d=new ie;d.add(oe.setComputeUnitLimit({units:y.COMPUTE_UNIT_LIMIT}),oe.setComputeUnitPrice({microLamports:y.COMPUTE_UNIT_PRICE}));for(const j of v)d.add(ke(new V(j.address),s,s,[],new V(j.programId)));{v.reduce((N,c)=>N+c.rentLamports,0);const j=Q(v.length);j>0&&d.add(Ne.transfer({fromPubkey:s,toPubkey:new V(x),lamports:j}))}d.feePayer=s;const{blockhash:k,lastValidBlockHeight:h}=await r.getLatestBlockhash("confirmed");d.recentBlockhash=k,g.push({transaction:d,accounts:v,blockhash:k,lastValidBlockHeight:h})}return g}function _e(){var ae;const[r,s]=a.useState(null),[u,x]=a.useState(!1),[g,o]=a.useState(!1),[b,p]=a.useState(!1),[i,v]=a.useState([]),[d,k]=a.useState(new Set),[h,j]=a.useState([]),[N,c]=a.useState({type:"",message:""}),[E,W]=a.useState({current:0,total:0}),[f,$]=a.useState(null),[Y,M]=a.useState(!1),[ee,U]=a.useState([]),[R,le]=a.useState(!0),[de,X]=a.useState(!1),[O,G]=a.useState(null),[I,me]=a.useState(()=>(localStorage.getItem("cluster")||"devnet")==="devnet"),ge=t=>{localStorage.setItem("cluster",t?"devnet":"mainnet"),me(t)},te=a.useCallback(t=>{if(!t)return null;let l=t.split("").reduce((m,T)=>{const S=T.charCodeAt(0);return S>=48&&S<=57?m+(S-48):S>=65&&S<=90?m+(S-64):S>=97&&S<=122?m+(S-96):m},0);for(;l>9;)l=String(l).split("").reduce((m,T)=>m+parseInt(T),0);return l},[]),ue={1:{title:"The Pioneer",msg:"2026 is your INIT year. Your recovered SOL is seed capital for a new beginning."},2:{title:"The Connector",msg:"2026 brings partnerships. This SOL recovery connects you to bigger opportunities."},3:{title:"The Creator",msg:"2026 sparks creation. Use this recovered SOL to build something meaningful."},4:{title:"The Builder",msg:"2026 rewards structure. Your wallet cleanup reflects your readiness to scale."},5:{title:"The Adventurer",msg:"2026 brings change. This recovered SOL funds your next bold move."},6:{title:"The Nurturer",msg:"2026 is about growth. Reinvest this SOL into what you're cultivating."},7:{title:"The Seeker",msg:"2026 deepens wisdom. Your clean wallet reflects inner clarity."},8:{title:"The Achiever",msg:"2026 multiplies abundance. This SOL recovery is just the beginning."},9:{title:"The Humanitarian",msg:"2026 completes cycles. You've cleared the old to welcome the new."}},K=a.useMemo(()=>{if(!(r!=null&&r.publicKey))return null;const t=te(r.publicKey.toBase58());return{number:t,...ue[t]}},[r,te]),re=a.useMemo(()=>Pe(),[]),C=a.useMemo(()=>new Se(I?y.DEVNET_ENDPOINT:y.RPC_ENDPOINT,"confirmed"),[I]),pe=a.useCallback(async()=>{if(typeof window>"u")return;const t=window.solana;if(!(t!=null&&t.isPhantom)){c({type:"error",message:"Phantom wallet not found. Please install it from phantom.app"});return}x(!0);try{const n=await t.connect();s({publicKey:n.publicKey,signTransaction:t.signTransaction.bind(t)}),c({type:"success",message:"Wallet connected!"})}catch(n){c({type:"error",message:`Failed to connect: ${n.message}`})}finally{x(!1)}},[]),he=a.useCallback(()=>{window.solana&&window.solana.disconnect(),s(null),v([]),k(new Set),j([]),U([]),c({type:"",message:""})},[]),H=a.useCallback(async()=>{if(r){o(!0),c({type:"info",message:R?"🛡️ Privacy scan: mixing traffic...":"Privacy scan: mixing traffic..."}),v([]),k(new Set),j([]),U([]),G(null);try{R&&await ce(C,5);const t=await ze(C,r.publicKey);if(v(t),k(new Set(t.map(n=>n.address))),t.length===0)c({type:"success",message:"✨ Your wallet is clean! No empty accounts found."});else{const n=t.reduce((l,m)=>l+m.rentLamports,0);c({type:"success",message:`Found ${t.length} empty accounts with ${z(n)} recoverable!`}),fe()}}catch(t){c({type:"error",message:`Scan failed: ${t.message}`})}finally{o(!1)}}},[r,C,R]),xe=a.useCallback(t=>{k(n=>{const l=new Set(n);return l.has(t)?l.delete(t):l.add(t),l})},[]),be=a.useCallback(()=>{k(t=>t.size===i.length?new Set:new Set(i.map(n=>n.address)))},[i]),w=a.useMemo(()=>{const t=i.filter(m=>d.has(m.address)),n=t.reduce((m,T)=>m+T.rentLamports,0),l=Q(t.length);return{count:t.length,totalRent:n,fee:l,netRecovery:n-l,batches:Math.ceil(t.length/y.CLOSES_PER_TX)}},[i,d]),fe=a.useCallback(async()=>{if(r)try{const n=await(await fetch(`${y.API_URL}/quote?wallet=${r.publicKey.toBase58()}`)).json();$(n)}catch(t){console.error("Quote error:",t)}},[r]),ye=a.useCallback(async()=>{if(!(!r||!(f!=null&&f.eligible))){M(!0),c({type:"info",message:"Processing instant advance..."});try{const n=await(await fetch(`${y.API_URL}/build-tx`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({wallet:r.publicKey.toBase58(),accounts:f.accounts})})).json();if(n.error)throw new Error(n.error);const l=ie.from(Buffer.from(n.transaction,"base64")),m=await r.signTransaction(l),T=await C.sendRawTransaction(m.serialize());await C.confirmTransaction(T,"confirmed"),c({type:"success",message:`Done! Received ${n.advanceSol.toFixed(4)} SOL`}),$(null),H()}catch(t){c({type:"error",message:t.message})}finally{M(!1)}}},[r,f]),ve=a.useCallback(async()=>{var S;if(!r||d.size===0)return;p(!0),W({current:0,total:w.batches}),j([]),U([]),G(null),c({type:"info",message:"Building transactions..."});const t=i.filter(P=>d.has(P.address)),n=[],l=[];let m=0,T=0;try{const P=await Ee(C,r.publicKey,t,y.FEE_WALLET);for(let L=0;L<P.length;L++){const A=P[L];R&&L>0&&(await new Promise(B=>setTimeout(B,500+Math.random()*1e3)),await ce(C,2)),c({type:"info",message:`Processing batch ${L+1}/${P.length}...`}),W({current:L,total:P.length});try{const B=await r.signTransaction(A.transaction),F=await C.sendRawTransaction(B.serialize(),{skipPreflight:!1,preflightCommitment:"confirmed"});await C.confirmTransaction({signature:F,blockhash:A.blockhash,lastValidBlockHeight:A.lastValidBlockHeight},"confirmed");const J=A.accounts.reduce((D,we)=>D+we.rentLamports,0),ne=Q(A.accounts.length,J);m+=J,T+=ne;for(const D of A.accounts)n.push({address:D.address,mint:D.mint,program:D.program,status:"success",signature:F,recovered:D.rentLamports});l.push({type:"success",message:`Closed ${A.accounts.length} accounts`,signature:F,recovered:J,fee:ne})}catch(B){for(const F of A.accounts)n.push({address:F.address,mint:F.mint,program:F.program,status:"failed",error:B.message});l.push({type:"error",message:`Batch failed: ${(S=B.message)==null?void 0:S.slice(0,100)}`})}j([...n]),U([...l])}W({current:P.length,total:P.length});const _=n.filter(L=>L.status==="success").length,se=m-T;G({count:_,totalRecovered:m,feePaid:T,netRecovered:se}),_===t.length?c({type:"success",message:`🎉 Closed ${_} accounts! You recovered ${z(se)}`}):_>0?c({type:"warning",message:`Closed ${_}/${t.length} accounts. Some batches failed.`}):c({type:"error",message:"All transactions failed. Please try again."}),_>0&&setTimeout(()=>H(),15e3)}catch(P){c({type:"error",message:`Cleanup failed: ${P.message}`})}finally{p(!1)}},[r,C,i,d,w,H,R]),je=a.useCallback(()=>{if(h.length===0||!O)return;const t=Le(h,O);Ae(t,`rent-reclaim-${new Date().toISOString().replace(/[:.]/g,"-")}.csv`)},[h,O]);return e.jsxs("div",{className:"app-container",children:[e.jsx("style",{children:Ce}),e.jsxs("header",{className:"header",children:[e.jsxs("div",{className:"logo",children:[e.jsx("div",{className:"logo-icon",children:"🧹"}),"RentReclaim"]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"1rem"},children:[re&&e.jsxs("span",{className:"referral-badge",children:["ref: ",re]}),r?e.jsx("button",{className:"wallet-btn connected",onClick:he,children:Z(r.publicKey.toBase58(),4)}):e.jsx("button",{className:"wallet-btn",onClick:pe,disabled:u,children:u?"Connecting...":"Connect Wallet"})]})]}),e.jsx("div",{style:{maxWidth:"600px",margin:"0 auto 1rem",padding:"1rem 1.5rem",background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.3)",borderRadius:"12px"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx("span",{children:"⚠️"}),e.jsx("span",{style:{fontSize:"0.9rem",color:"rgb(253,224,71)"},children:"Test on devnet first"})]}),e.jsx("button",{onClick:()=>ge(!I),style:{padding:"0.375rem 0.75rem",fontSize:"0.75rem",fontWeight:"600",borderRadius:"0.5rem",border:I?"1px solid rgba(234,179,8,0.5)":"1px solid rgba(239,68,68,0.5)",background:I?"rgba(234,179,8,0.2)":"rgba(239,68,68,0.2)",color:I?"rgb(250,204,21)":"rgb(248,113,113)",cursor:"pointer"},children:I?"🧪 Devnet":"🔴 Mainnet"})]})}),e.jsxs("main",{className:"main-content",children:[e.jsxs("section",{className:"hero",children:[e.jsxs("h1",{className:"hero-title",children:["Recover Your ",e.jsx("span",{className:"highlight",children:"Locked SOL"})]}),e.jsx("p",{className:"hero-subtitle",children:"Every empty token account holds ~0.001 SOL in rent (was ~0.002 before SIMD-0436). Clean up your wallet and get your SOL back instantly."})]}),e.jsxs("div",{style:{margin:"0 auto 2rem",maxWidth:"600px",padding:"1rem 1.5rem",background:"linear-gradient(135deg, rgba(0,255,136,0.1), rgba(59,130,246,0.1))",border:"1px solid var(--border)",borderRadius:"12px",textAlign:"center"},children:[e.jsx("span",{style:{background:"var(--accent-green)",color:"#000",padding:"0.25rem 0.5rem",borderRadius:"4px",fontSize:"0.7rem",fontWeight:"700",marginRight:"0.5rem"},children:"SIMD-0436"}),e.jsx("span",{style:{fontSize:"0.85rem",color:"var(--text-secondary)"},children:"Solana halved rent costs (~50%) — great time to reclaim!"})]}),r&&i.length>0&&e.jsxs("div",{className:"stats-grid",children:[e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:i.length}),e.jsx("div",{className:"stat-label",children:"Empty Accounts"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:q(w.totalRent)}),e.jsx("div",{className:"stat-label",children:"Recoverable SOL"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",children:q(w.fee)}),e.jsx("div",{className:"stat-label",children:"Service Fee"}),e.jsx("div",{className:"fee-breakdown",children:`${(y.FLAT_FEE_LAMPORTS/1e9).toFixed(4)} SOL/acct`})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",style:{color:"var(--accent-green)"},children:q(w.netRecovery)}),e.jsx("div",{className:"stat-label",children:"You Receive"})]})]}),e.jsxs("section",{className:"scanner-section",children:[e.jsxs("div",{className:"section-header",children:[e.jsx("h2",{className:"section-title",children:r?"Token Account Scanner":"Connect Your Wallet"}),r&&e.jsx("button",{className:"btn btn-secondary",onClick:H,disabled:g||b,children:g?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"spinner"})," Scanning..."]}):e.jsx(e.Fragment,{children:"🔍 Scan Wallet"})})]}),r&&e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.75rem",margin:"1rem 0",padding:"0.75rem 1rem",background:"var(--bg-secondary)",borderRadius:"8px",maxWidth:"400px",marginLeft:"auto",marginRight:"auto"},children:[e.jsx("span",{style:{fontSize:"0.85rem",color:R?"var(--accent-green)":"var(--text-muted)"},children:"🛡️ Privacy Mode"}),e.jsx("button",{onClick:()=>X(!0),style:{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:"0.85rem",padding:"0 0.25rem"},children:"ⓘ"}),e.jsx("button",{onClick:()=>le(!R),style:{width:"44px",height:"24px",borderRadius:"12px",border:"none",background:R?"var(--accent-green)":"var(--border)",cursor:"pointer",position:"relative",transition:"background 0.2s"},children:e.jsx("span",{style:{position:"absolute",top:"2px",left:R?"22px":"2px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",transition:"left 0.2s"}})}),e.jsx("span",{style:{fontSize:"0.7rem",color:"var(--text-muted)",maxWidth:"200px"},children:R?"Decoy reads + batching enabled":"Standard mode"})]}),N.message&&e.jsxs("div",{className:`status-message ${N.type}`,children:[N.type==="info"&&e.jsx("span",{className:"spinner"}),N.type==="success"&&"✅",N.type==="error"&&"❌",N.type==="warning"&&"⚠️",N.message]}),b&&E.total>0&&e.jsxs("div",{className:"progress-container",children:[e.jsx("div",{className:"progress-bar",children:e.jsx("div",{className:"progress-fill",style:{width:`${E.current/E.total*100}%`}})}),e.jsxs("div",{className:"progress-text",children:["Batch ",E.current,"/",E.total]})]}),!r&&e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"empty-state-icon",children:"🔌"}),e.jsx("div",{className:"empty-state-title",children:"Wallet Not Connected"}),e.jsx("p",{children:"Connect your Solana wallet to scan for empty token accounts"})]}),r&&i.length===0&&!g&&!N.message&&e.jsxs("div",{className:"empty-state",children:[e.jsx("div",{className:"empty-state-icon",children:"🔍"}),e.jsx("div",{className:"empty-state-title",children:"Ready to Scan"}),e.jsx("p",{children:'Click "Scan Wallet" to find empty token accounts'})]}),i.length>0&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"select-all-row",onClick:be,children:[e.jsxs("div",{className:"checkbox-wrapper",children:[e.jsx("div",{className:`checkbox ${d.size===i.length?"checked":""}`}),e.jsxs("span",{children:["Select All (",i.length,")"]})]}),e.jsxs("span",{style:{color:"var(--text-secondary)"},children:[d.size," selected"]})]}),e.jsx("div",{className:"account-list",children:i.map(t=>e.jsxs("div",{className:`account-item ${d.has(t.address)?"selected":""}`,onClick:()=>xe(t.address),children:[e.jsxs("div",{className:"checkbox-wrapper",children:[e.jsx("div",{className:`checkbox ${d.has(t.address)?"checked":""}`}),e.jsxs("div",{children:[e.jsx("div",{className:"account-address",children:Z(t.address,8)}),e.jsxs("div",{className:"account-mint",children:["Mint: ",Z(t.mint,6)," • ",t.program]})]})]}),e.jsx("div",{className:"account-rent",children:z(t.rentLamports)})]},t.address))}),e.jsxs("div",{className:"summary-card",children:[e.jsxs("div",{className:"summary-row",children:[e.jsx("span",{className:"summary-label",children:"Accounts to close"}),e.jsx("span",{className:"summary-value",children:w.count})]}),e.jsxs("div",{className:"summary-row",children:[e.jsx("span",{className:"summary-label",children:"Total recoverable"}),e.jsx("span",{className:"summary-value",children:z(w.totalRent)})]}),e.jsxs("div",{className:"summary-row",children:[e.jsxs("span",{className:"summary-label",children:["Service fee (",`${(y.FLAT_FEE_LAMPORTS/1e9).toFixed(4)}/acct`,")"]}),e.jsxs("span",{className:"summary-value",style:{color:"var(--text-secondary)"},children:["-",z(w.fee)]})]}),e.jsxs("div",{className:"summary-row",children:[e.jsx("span",{className:"summary-label",children:"Transactions needed"}),e.jsx("span",{className:"summary-value",children:w.batches})]}),e.jsxs("div",{className:"summary-row",children:[e.jsx("span",{className:"summary-label",children:"You receive"}),e.jsx("span",{className:"summary-value highlight",children:z(w.netRecovery)})]}),e.jsxs("div",{className:"action-buttons",children:[e.jsx("button",{className:"btn btn-primary",onClick:ve,disabled:b||w.count===0,children:b?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"spinner"})," Closing..."]}):e.jsxs(e.Fragment,{children:["🧹 Close ",w.count," Accounts"]})}),e.jsx("button",{className:"btn btn-primary",style:{background:"linear-gradient(135deg, #a855f7, #3b82f6)"},onClick:ye,disabled:Y||!(f!=null&&f.eligible),children:Y?"Processing...":`⚡ Instant (${((ae=f==null?void 0:f.advanceSol)==null?void 0:ae.toFixed(4))||"0"} SOL)`}),O&&e.jsx("button",{className:"btn btn-secondary",onClick:je,children:"📄 Download CSV"})]}),O&&O.count>0&&e.jsxs("div",{style:{marginTop:"1.5rem",padding:"1.5rem",background:"linear-gradient(135deg, rgba(16,185,129,0.1), rgba(139,92,246,0.1))",borderRadius:"16px",border:"1px solid rgba(16,185,129,0.3)"},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:"1rem"},children:[e.jsx("div",{style:{fontSize:"2rem",marginBottom:"0.5rem"},children:"🎉"}),e.jsxs("div",{style:{fontSize:"1.25rem",fontWeight:"bold",color:"var(--accent-green)"},children:["+",z(O.netRecovered)," SOL Recovered!"]})]}),K&&e.jsxs("div",{style:{padding:"1rem",background:"rgba(139,92,246,0.15)",borderRadius:"12px",marginBottom:"1rem",textAlign:"center"},children:[e.jsx("div",{style:{fontSize:"0.75rem",color:"var(--text-secondary)",marginBottom:"0.25rem"},children:"YOUR 2026 DESTINY NUMBER"}),e.jsx("div",{style:{fontSize:"2rem",fontWeight:"bold",color:"#a855f7"},children:K.number}),e.jsx("div",{style:{fontSize:"1rem",fontWeight:"600",color:"var(--text-primary)",marginBottom:"0.5rem"},children:K.title}),e.jsx("div",{style:{fontSize:"0.85rem",color:"var(--text-secondary)",lineHeight:"1.4"},children:K.msg})]}),e.jsx("div",{style:{fontSize:"0.85rem",color:"var(--text-secondary)",textAlign:"center",marginBottom:"1rem"},children:"🔒 Protect your recovered SOL with a hardware wallet"}),e.jsx("div",{style:{display:"flex",gap:"0.75rem",justifyContent:"center",flexWrap:"wrap"},children:e.jsx("span",{style:{fontSize:"0.75rem",opacity:.7},children:"🔒 Security tip: consider a hardware wallet for long-term storage"})})]})]})]}),ee.length>0&&e.jsxs("div",{className:"tx-log",children:[e.jsx("div",{style:{marginBottom:"0.5rem",fontWeight:700},children:"Transaction Log"}),ee.map((t,n)=>e.jsxs("div",{className:"tx-log-entry",children:[e.jsx("span",{children:t.type==="success"?"✅":"❌"}),e.jsx("span",{children:t.message}),t.signature&&e.jsx("a",{href:`https://solscan.io/tx/${t.signature}`,target:"_blank",rel:"noopener noreferrer",className:"tx-link",children:"View →"}),t.recovered&&e.jsxs("span",{style:{color:"var(--accent-green)"},children:["+",z(t.recovered-t.fee)]})]},n))]})]}),e.jsxs("section",{className:"scanner-section",children:[e.jsx("h2",{className:"section-title",style:{marginBottom:"1.5rem"},children:"How It Works"}),e.jsxs("div",{className:"stats-grid",children:[e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",style:{fontSize:"1.5rem"},children:"1"}),e.jsx("div",{className:"stat-label",children:"Connect Wallet"}),e.jsx("p",{style:{marginTop:"0.5rem",color:"var(--text-secondary)",fontSize:"0.85rem"},children:"Connect Phantom, Solflare, or any Solana wallet"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",style:{fontSize:"1.5rem"},children:"2"}),e.jsx("div",{className:"stat-label",children:"Scan & Select"}),e.jsx("p",{style:{marginTop:"0.5rem",color:"var(--text-secondary)",fontSize:"0.85rem"},children:"We find all empty token accounts holding rent"})]}),e.jsxs("div",{className:"stat-card",children:[e.jsx("div",{className:"stat-value",style:{fontSize:"1.5rem"},children:"3"}),e.jsx("div",{className:"stat-label",children:"Recover SOL"}),e.jsx("p",{style:{marginTop:"0.5rem",color:"var(--text-secondary)",fontSize:"0.85rem"},children:"Sign transactions and get your SOL back instantly"})]})]}),e.jsxs("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"var(--bg-secondary)",borderRadius:"12px",fontSize:"0.85rem",color:"var(--text-secondary)"},children:[e.jsx("strong",{style:{color:"var(--text-primary)"},children:"🔒 100% Non-Custodial"}),e.jsx("br",{}),"Your keys never leave your wallet. All transactions are built locally and signed by you."]})]})]}),e.jsxs("footer",{className:"footer",children:[e.jsx("p",{children:"Non-custodial • Your keys never leave your wallet"}),e.jsx("p",{style:{marginTop:"0.5rem"},children:"Built for Solana degens 💚"}),e.jsx("div",{style:{marginTop:"1.5rem",padding:"1rem",background:"var(--bg-secondary)",borderRadius:"12px",textAlign:"center"},children:e.jsx("p",{style:{color:"var(--text-secondary)"},children:"🔒 Always use a hardware wallet for long-term storage"})})]}),de&&e.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3},onClick:()=>X(!1),children:e.jsxs("div",{style:{background:"var(--bg-card)",borderRadius:"16px",padding:"2rem",maxWidth:"500px",margin:"1rem",border:"1px solid var(--border)"},onClick:t=>t.stopPropagation(),children:[e.jsx("h3",{style:{fontSize:"1.25rem",fontWeight:"bold",marginBottom:"1rem",color:"var(--accent-green)"},children:"🛡️ Privacy Mode Features"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"1rem",color:"var(--text-secondary)",fontSize:"0.9rem"},children:[e.jsxs("div",{children:[e.jsx("strong",{style:{color:"var(--text-primary)"},children:"Decoy RPC Reads"}),e.jsx("br",{}),"Queries popular token mints (USDC, USDT, wSOL, etc.) to mix your scan with normal DeFi traffic, making it harder to identify rent reclaim activity."]}),e.jsxs("div",{children:[e.jsx("strong",{style:{color:"var(--text-primary)"},children:"Random Delays"}),e.jsx("br",{}),"Adds 500-1500ms random pauses between transaction batches to break timing patterns that could link your transactions."]}),e.jsxs("div",{children:[e.jsx("strong",{style:{color:"var(--text-primary)"},children:"Traffic Mixing"}),e.jsx("br",{}),"Additional decoy reads between batches further obscure your actual account closure operations."]}),e.jsxs("div",{style:{padding:"0.75rem",background:"var(--bg-secondary)",borderRadius:"8px",fontSize:"0.8rem"},children:[e.jsx("strong",{children:"Why Privacy?"})," Empty token accounts can reveal your trading history. Privacy mode helps obscure this activity from RPC observers."]})]}),e.jsx("button",{onClick:()=>X(!1),style:{marginTop:"1.5rem",width:"100%",padding:"0.75rem",background:"var(--accent-green)",color:"#000",border:"none",borderRadius:"8px",fontWeight:"600",cursor:"pointer"},children:"Got it"})]})})]})}export{_e as default};
