# PrivatePay - Privacy-First Payment Infrastructure

A modern, privacy-focused payment card issuance platform built on Solana blockchain. Issue instant virtual cards, receive SOL payments, and manage digital payments with complete privacy.

## 🎯 Project Overview

PrivatePay is a web application that allows users to:
- **Issue instant virtual cards** in under 2 minutes
- **Make payments with Solana** for card activation
- **Complete privacy** - no KYC required
- **Global acceptance** - cards work anywhere Visa/Mastercard accepted
- **Real-time QR code payments** - pay via Solana wallet

Built for **hackathons** showcasing blockchain payment integration, privacy preservation, and modern fintech infrastructure.

## ✨ Key Features

- **Instant Card Issuance**: Create virtual cards in seconds without paperwork
- **Solana Integration**: Direct SOL payments with real-time exchange rates
- **Privacy First**: No KYC verification required, non-custodial architecture
- **QR Code Payments**: Scan and pay directly from Solana wallets
- **Responsive Design**: Mobile-optimized UI with smooth animations
- **Real-time Status**: Live order tracking and payment confirmation
- **Global Coverage**: Support for 180+ countries

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19.2** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS
- **Shadcn/ui** - High-quality UI components
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless backend
- **Supabase** - PostgreSQL database + Auth
- **Solana Web3.js** - Blockchain interactions
- **Starpay API** - Card issuance & payment processing

### Infrastructure
- **Vercel** - Deployment & hosting
- **Helius** - Solana RPC provider

## 📋 Prerequisites

Before running the project, you'll need:

- **Node.js** 18+ and npm/yarn
- **Starpay API Key** - Sign up at [Starpay](https://starpay.cards)
- **Supabase Account** - Create at [Supabase](https://supabase.com)
- **Helius API Key** - Create at [Helius](https://helius.dev)
- **Solana Wallet** - For master wallet setup (private key)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd privatepay
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase (Public - safe for client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Starpay API (Server-only)
STARPAY_API_KEY=your_starpay_api_key

# Master Wallet (Server-only - KEEP SECRET)
MASTER_WALLET_PRIVATE_KEY=your_base64_encoded_private_key
MASTER_WALLET_ADDRESS=your_master_wallet_address

# Helius RPC (Server-only)
HELIUS_API_KEY=your_helius_api_key

# Supabase (Server-only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 📁 Project Structure

```
├── app/
│   ├── api/                          # API endpoints
│   │   ├── starpay/                 # Card & payment APIs
│   │   │   ├── create-order/        # Create Starpay order
│   │   │   ├── check-order-status/  # Check order status
│   │   │   └── me/                  # Get account info
│   │   └── price/
│   │       └── sol/                 # Get SOL/USD price
│   ├── components/                   # React components
│   │   └── card-purchase.tsx        # Card purchase flow
│   ├── context/                      # React context
│   ├── page.tsx                      # Main landing page
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles & theme
├── lib/                              # Utilities & helpers
│   ├── starpay-client.ts            # Starpay API client
│   ├── solana-verify.ts             # Solana verification
│   └── utils.ts                     # Helper functions
├── scripts/                          # Database setup
├── public/                           # Static assets
└── package.json                      # Dependencies

```

## 🔌 API Endpoints

### Card Payment
- `POST /api/starpay/create-order` - Create payment order
- `POST /api/starpay/check-order-status` - Check order status
- `POST /api/starpay/me` - Get account information

### Pricing
- `GET /api/price/sol` - Get current SOL/USD price

## 🎨 Design System

### Colors
- **Primary**: `#7c3aed` (Violet/Purple)
- **Secondary**: `#6366f1` (Indigo)
- **Accent**: `#fbbf24` (Amber)
- **Background**: `#0f0f0f` (Near Black)
- **Surface**: `#1a1a1a` (Dark Gray)

### Typography
- **Font**: Geist (primary), Geist Mono (code)
- **Headings**: Bold, 24px-64px
- **Body**: Regular, 14px-16px
- **Line Height**: 1.5-1.6

## 🔐 Security

- **Private Keys**: Never exposed to client, server-only
- **API Keys**: Environment variables, not in code
- **HTTPS Only**: Enforced in production
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **CORS**: Configured for allowed origins

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- Go to Settings → Environment Variables
- Add all variables from `.env.local`

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android tablets)
- Mobile devices (iOS Safari, Chrome Mobile)

## 💳 Card Features

- **Valid Range**: $5 - $10,000
- **Issuance Speed**: < 2 minutes
- **Currency**: USD
- **Network**: Visa & Mastercard
- **Regions**: 180+ countries
- **Fee**: 2.5% (Starpay markup)

## 🎯 User Flow

1. User selects card amount ($5-$10,000)
2. System creates Starpay order
3. User receives QR code with SOL address
4. User scans with Solana wallet and sends payment
5. System confirms payment via Starpay
6. Card details displayed to user
7. Card ready for use within 2 minutes

## 🐛 Debugging

Check browser console for debug logs:
```javascript
[v0] Order status poll result: {...}
[v0] Expected SOL: 0.021333
[v0] Payment received: pending
```

## 📊 Performance

- Lighthouse Score: 90+
- Core Web Vitals: All green
- Build time: < 30s
- API response: < 200ms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this for your hackathon!

## 🆘 Support

For issues or questions:
- Check the documentation
- Review API error messages in console
- Verify environment variables are set correctly
- Check Starpay & Supabase dashboard for API limits

## 🚀 Future Enhancements

- [ ] Multiple card designs
- [ ] Card spending limits
- [ ] Transaction history
- [ ] Wallet connectivity improvements
- [ ] Mobile app (Flutter)
- [ ] Admin dashboard
- [ ] Analytics & reporting

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Solana Web3.js](https://github.com/solana-labs/solana-web3.js)
- [Starpay Documentation](https://starpay.cards/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

**Built with ❤️ for hackathons.**
