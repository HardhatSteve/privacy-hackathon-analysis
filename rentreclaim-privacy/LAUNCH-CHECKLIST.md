# RentReclaim Launch Checklist

## Domain Options (Check Availability)

### Primary Recommendations
| Domain | Why | Est. Cost |
|--------|-----|-----------|
| `rentreclaim.xyz` | Crypto-native TLD, cheap | ~$12/yr |
| `rentreclaim.io` | Professional, credible | ~$40/yr |
| `rentreclaim.app` | Indicates it's an app | ~$20/yr |

### Alternatives if Taken
- `getrentreclaim.com`
- `rentreclaim.co`
- `reclaimrent.xyz`
- `solreclaim.xyz`

### Where to Buy
1. **Namecheap** - Cheapest for .xyz/.io
2. **Cloudflare Registrar** - At-cost pricing
3. **Porkbun** - Good prices, nice UI

---

## Business Structure Options (Maryland)

**IMPORTANT: Consult a Maryland CPA/attorney before deciding. This is NOT legal advice.**

### Option 1: Sole Proprietor (Simplest)
- **Pros**: No filing fees, no paperwork, file on personal taxes
- **Cons**: No liability protection, mixing personal/business
- **Tax**: Report on Schedule C, pay self-employment tax (~15.3%)

### Option 2: DBA Under Earthwise Harvest
- **Pros**: Uses existing entity, some organization
- **Cons**: Still mixes farming + crypto, liability concerns
- **Cost**: MD DBA filing ~$75
- **Tax**: Same as current Earthwise structure

### Option 3: Separate LLC (Recommended)
- **Pros**: Liability separation, clean books, professional
- **Cons**: Annual fee, separate tax filing
- **Cost**: MD LLC ~$100 filing + $300/yr annual report
- **Tax**: Single-member LLC = pass-through (Schedule C) unless you elect S-corp

### Questions for Your CPA
1. "Should crypto service income be in the same entity as farming income?"
2. "What's the liability exposure if I mix them?"
3. "Is an LLC worth the $300/yr in MD for this business?"
4. "How do I handle crypto-to-fiat for the fee revenue?"
5. "Do I need to collect sales tax on this service in MD?"

### Maryland Resources
- **SDAT (State Dept of Assessments)**: https://dat.maryland.gov/
- **LLC Filing**: https://egov.maryland.gov/BusinessExpress
- **MD Comptroller (taxes)**: https://www.marylandtaxes.gov/

---

## Technical Launch Checklist

### Phase 1: Foundation (This Week)
- [ ] Buy domain (rentreclaim.xyz or .io)
- [ ] Set up Cloudflare account (free, handles DNS + CDN)
- [ ] Deploy landing page to Cloudflare Pages or Vercel
- [ ] Set up email (support@rentreclaim.xyz via Cloudflare Email Routing → your Gmail)

### Phase 2: App Deploy
- [ ] Configure `FEE_WALLET` in App.jsx
- [ ] Get dedicated RPC (Helius free tier)
- [ ] Deploy app to /app route
- [ ] Test with your own wallet
- [ ] Test with a friend's wallet

### Phase 3: Analytics & Tracking
- [ ] Add Plausible or Simple Analytics (privacy-friendly)
- [ ] Set up UTM tracking for each channel:
  - `?ref=tiktok`
  - `?ref=twitter`
  - `?ref=discord`
- [ ] Add TikTok Pixel (if running ads later)

### Phase 4: Legal/Compliance
- [ ] Consult MD CPA on structure
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add "Not Financial Advice" disclaimers
- [ ] Document fee structure clearly

---

## Revenue Tracking

### Simple Method (Spreadsheet)
Track in Google Sheets:
- Date
- Wallet (first/last 4 chars)
- Accounts closed
- Rent recovered (lamports)
- Fee collected (lamports)
- Source (tiktok/twitter/discord/organic)

### Better Method (On-chain)
Your fee wallet receives all payments. Export transactions monthly:
1. Go to Solscan → Your fee wallet → Transactions
2. Export CSV
3. Filter for incoming SOL transfers
4. Sum for monthly revenue

### Tax Prep
- Keep records of all fee income in USD at time of receipt
- Consider using Koinly or CoinTracker for crypto tax reporting
- MD state tax on business income is 8.25% (on top of federal)

---

## Pricing Finalization

### Current: Flat Fee (Recommended)
```
0.0005 SOL per account closed (~25% of rent)
```
- Simple to understand
- Predictable for users
- Easy to calculate

### Alternative: Percentage
```
20% of recovered rent
```
- Scales with actual recovery
- Slightly more complex

### Volume Tiers (Future)
```
1-25 accounts: 25% fee
26-100 accounts: 20% fee
100+ accounts: 15% fee
```

---

## Content Launch Plan

### Day 1: Soft Launch
- [ ] Deploy landing + app
- [ ] Post on personal Twitter
- [ ] Share in 1-2 Solana Discord servers
- [ ] Clean 5-10 friends' wallets for testimonials

### Week 1: Content Push
- [ ] Post first TikTok (faceless screen recording)
- [ ] Twitter thread explaining the problem + solution
- [ ] Discord bot live in 2-3 servers

### Week 2: Scale
- [ ] Daily TikTok posting
- [ ] Reach out to 5 micro-influencers
- [ ] Set up creator referral program

### Month 1 Goals
- [ ] 100 wallets cleaned
- [ ] 5 SOL in revenue
- [ ] 3+ creator partnerships
- [ ] 1,000 TikTok followers

---

## Quick Wins This Week

1. **Today**: Record one wallet cleanup video (faceless)
2. **Tomorrow**: Buy domain, deploy landing page
3. **Day 3**: Deploy app, test with own wallet
4. **Day 4**: Post first TikTok
5. **Day 5**: Set up Discord bot
6. **Weekend**: Reach out to 3 creators

---

## Contacts to Get

### Maryland CPA
Search: "Maryland CPA cryptocurrency" or "Maryland tax accountant small business"
Budget: ~$150-300 for initial consultation

### Maryland Business Attorney (Optional)
For LLC formation + operating agreement
Budget: ~$500-1000 or use LegalZoom/ZenBusiness (~$150)

---

## Notes

- Keep it simple at launch. You can add complexity later.
- Don't over-engineer the legal structure before you have revenue.
- Focus on getting 10 paying users before worrying about scale.
- Document everything for taxes from day one.
