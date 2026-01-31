# LeakLens Frontend

Next.js 15 + React 19 + TypeScript app for the LeakLens wallet surveillance-exposure UI. Part of [LeakLens](https://github.com/MatthewSullivn/LeakLens).

## Project Description

The frontend provides the landing page (wallet input, demo CTA) and the analysis view. Users enter a Solana address, and the app calls the analyze API, then renders surveillance score, temporal fingerprint, bot detection, opsec failures, ego network, mempool forensics, and financial context. The UI is responsive and uses a dark theme with Tailwind and Radix primitives.

## Technical Overview

- **Next.js 15**: App Router, `app/page.tsx` (landing), `app/analysis/[wallet]/page.tsx` (analysis).
- **API proxy**: `app/api/analyze-wallet/route.ts` forwards POST requests to the Python backend (`http://127.0.0.1:8000/analyze-wallet` locally) or to Vercel serverless when deployed. Request body: `{ wallet, limit }`.
- **Components**: `components/landing/` (hero, features, process), `components/analysis/` (overview, exposure, opsec, ego network, etc.), `components/ui/` (button, card, badge, etc.). Navbar and footer live in `components/` and `components/ui/resizable-navbar.tsx`.
- **Styling**: Tailwind CSS, `globals.css`. No separate CSS framework config beyond PostCSS.

## Features

1. **Landing page**: Hero with wallet input, feature highlights, investigation process, links to Source (GitHub) and Encrypt Trade.
2. **Analysis page**: Dynamic route by wallet address. Fetches analysis, shows loading/error states, then renders exposure overview, why-trackable, ego network, opsec failures, mempool forensics, financial context, and implications.
3. **Export**: UI for PDF/JSON/CSV export (currently coming-soon placeholders).
4. **Mobile**: Responsive layout and mobile nav (LeakLensNavbar).

## How to Get Started

1. Ensure the Python backend is running (see root [README](https://github.com/MatthewSullivn/LeakLens#how-to-get-started)).
2. From the repo root:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000`. Enter a Solana address on the landing page to run an analysis.

## For developers

- **Backend**: Must run on port 8000. Start with `python run_server.py` (or `START_SERVER.bat`) **before** `npm run dev`. "Connection refused" or 503 from the app means the backend is not running.
- **API route**: `app/api/analyze-wallet/route.ts`. Locally it POSTs to `http://127.0.0.1:8000/analyze-wallet`. On Vercel it calls the Python serverless function (`api/analyze-wallet.py`). Request body: `{ wallet: string, limit?: number }`. Timeout 120s (`maxDuration` and AbortController).
- **Types**: `components/analysis/types.ts` defines the analysis response types. Use it when adding UI for new API fields or debugging.
- **Build / Vercel**: `npm run build` runs a `prebuild` script that copies `leaklens_solana.py` and `backend_api.py` from the repo root into `frontend/`. The Python serverless function (`frontend/api/analyze-wallet.py`) imports those. The copies are gitignored. On Vercel, set `HELIUS_API_KEY` in project env.
- **Troubleshooting**: Connection refused → start backend. 504 / "Request timeout" → analysis exceeded 2 minutes; try a lower `limit` or check backend logs.

## Acknowledgments

- **Next.js** and **React** for the frontend framework.
- **Tailwind**, **Radix UI**, and **Lucide** for styling and components.
- **LeakLens** backend, **Solana Privacy Hackathon**, and [encrypt.trade](https://encrypt.trade) (Track 1 bounty sponsor).
