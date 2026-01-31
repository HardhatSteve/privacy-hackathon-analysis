import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';

// Polyfills for Solana - MUST be before any Solana imports
import { Buffer } from 'buffer';
window.Buffer = Buffer;
globalThis.Buffer = Buffer;

// Landing loads immediately (first thing users see)
import Landing from './Landing.jsx';

// Heavy components load on demand
const App = lazy(() => import('./App.jsx'));
const Destiny = lazy(() => import('./Destiny.jsx'));
const PrivateSend = lazy(() => import('./PrivateSend.jsx'));
const DecryptTool = lazy(() => import('./DecryptTool.jsx'));
const StealthLaunch = lazy(() => import('./StealthLaunch.jsx'));
const Learn = lazy(() => import('./Learn.jsx'));
const PrivacyHub = lazy(() => import('./PrivacyHub.jsx'));
const RadrDemo = lazy(() => import('./RadrDemo.jsx'));
const PrivacyCashDemo = lazy(() => import('./PrivacyCashDemo.jsx'));
const IncoDemo = lazy(() => import('./IncoDemo.jsx'));
const ArciumDemo = lazy(() => import('./ArciumDemo.jsx'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="text-emerald-400 flex items-center gap-3">
      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      Loading...
    </div>
  </div>
);

function Router() {
  const path = (window.location.hash?.slice(1) || window.location.pathname) || '/';
  
  // Landing doesn't need Suspense (loaded directly)
  if (path === '/') return <Landing />;
  
  // All other routes are lazy loaded
  return (
    <Suspense fallback={<LoadingFallback />}>
      {path === '/app' ? <App /> :
       path === '/destiny' ? <Destiny /> :
       path === '/send' ? <PrivateSend /> :
       path === '/decrypt' ? <DecryptTool /> :
       path === '/launch' ? <StealthLaunch /> :
       path === '/learn' ? <Learn /> :
       path === '/privacy' ? <PrivacyHub /> :
       path === '/radr' ? <RadrDemo /> :
       path === '/privacycash' ? <PrivacyCashDemo /> :
       path === '/inco' ? <IncoDemo /> :
       path === '/arcium' ? <ArciumDemo /> :
       <Landing />}
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
