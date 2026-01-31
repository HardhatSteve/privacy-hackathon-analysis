#  Deployment Guide

This guide covers the deployment of all SolVoid components: Smart Contracts, Dashboard, and Relayer.

---

##  Smart Contract (Solana Program)

### Prerequisites
- Solana CLI configured for the target network (Devnet/Mainnet).
- A wallet with sufficient SOL for deployment fees.

### Steps
1. **Build the program:**
   ```bash
   anchor build
   ```
2. **Deploy:**
   ```bash
   anchor deploy --provider.cluster <NETWORK>
   ```
3. **Initialize the state:**
   ```bash
   solvoid init --authority <PUBKEY>
   ```

---

##  Dashboard (Vercel/Netlify)

The dashboard is a Next.js application designed to be deployed to Vercel or Netlify.

### Environment Variables
Set the following on your deployment platform:
- `NEXT_PUBLIC_RPC_URL`: Your Solana RPC endpoint.
- `NEXT_PUBLIC_PROGRAM_ID`: The deployed SolVoid program ID.

### Commands
```bash
# Build
npm run build

# Start
npm run start
```

---

##  Relayer (Node.js/Docker)

The relayer should be deployed to a server with high availability.

### Docker Deployment (Recommended)
```bash
docker build -t solvoid-relayer ./relayer
docker run -p 3001:3001 --env-file .env solvoid-relayer
```

### Manual Deployment
```bash
cd relayer
npm install
npm run build
pm2 start dist/index.js --name solvoid-relayer
```

---

##  CI/CD Pipeline

We use GitHub Actions for automated deployment.
- **Main Branch:** Triggers deployment to Staging/Devnet.
- **Releases:** Trigger deployment to Production/Mainnet.

For details, see [CI_CD.md](./CI_CD.md).

---

##  Rollback Procedures

### Smart Contracts
Solana programs can be rolled back if they were deployed with an upgrade authority.
```bash
solana program rollback <PROGRAM_ID>
```
*Note: This depends on the specific buffer management and authority settings.*

### Dashboard
Use the Vercel/Netlify "Rollback to previous deployment" button.
