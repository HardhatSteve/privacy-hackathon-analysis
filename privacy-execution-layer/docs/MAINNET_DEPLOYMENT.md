# Mainnet Deployment Guide

## Prerequisites

### 1. Audit Complete
- [ ] All Critical/High issues resolved
- [ ] Audit report published
- [ ] SECURITY.md updated

### 2. Trusted Setup (Groth16)
- [ ] Ceremony completed (>100 participants)
- [ ] Powers of Tau file verified
- [ ] Final zkey generated
- [ ] Contribution transcripts published

### 3. Infrastructure
- [ ] Mainnet RPC access
- [ ] Deployment wallet funded
- [ ] Multi-sig setup (3/5 recommended)

---

## Deployment Steps

### Step 1: Build for Mainnet

```bash
# Set environment
export ANCHOR_WALLET=~/.config/solana/mainnet-deployer.json
export ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com

# Build with verification
anchor build --verifiable
```

### Step 2: Verify Build

```bash
# Get program hash
sha256sum target/deploy/private_pool.so

# Document expected hash
echo "Expected: <HASH_FROM_AUDIT>"
```

### Step 3: Deploy Program

```bash
# Deploy
solana program deploy target/deploy/private_pool.so \
    --url mainnet-beta \
    --keypair ~/.config/solana/mainnet-deployer.json \
    --program-id target/deploy/private_pool-keypair.json

# Note: Program ID should be deterministic from keypair
```

### Step 4: Initialize Pool

```bash
# Initialize each denomination pool
anchor run init-pool-mainnet -- \
    --denomination 100000000 \    # 0.1 SOL
    --dev-wallet <DEV_WALLET>

anchor run init-pool-mainnet -- \
    --denomination 1000000000 \   # 1 SOL
    --dev-wallet <DEV_WALLET>

anchor run init-pool-mainnet -- \
    --denomination 10000000000 \  # 10 SOL
    --dev-wallet <DEV_WALLET>

anchor run init-pool-mainnet -- \
    --denomination 100000000000 \ # 100 SOL
    --dev-wallet <DEV_WALLET>
```

### Step 5: Verify Deployment

```bash
# Check program
solana program show <PROGRAM_ID>

# Verify accounts
anchor run verify-pools-mainnet
```

---

## Post-Deployment

### 1. Upgrade Authority

```bash
# Option A: Renounce (fully immutable)
solana program set-upgrade-authority <PROGRAM_ID> --final

# Option B: Transfer to multi-sig
solana program set-upgrade-authority <PROGRAM_ID> \
    --new-upgrade-authority <MULTISIG_ADDRESS>
```

### 2. Announcements

```bash
# Generate announcement with mainnet addresses
NETWORK=mainnet-beta ./scripts/technical_announcement.sh
```

### 3. Monitoring

- [ ] Set up Solana FM alerts
- [ ] Configure Discord/Telegram webhooks
- [ ] Enable GitHub Security monitoring

---

## Emergency Procedures

### Circuit Breaker (if upgradeable)

```bash
# Pause deposits (if implemented)
anchor run pause-deposits -- --pool <POOL_ADDRESS>
```

### Incident Response

1. Identify vulnerability scope
2. Assess user funds at risk
3. Communicate via SECURITY.md process
4. Deploy fix (if upgradeable)
5. Post-mortem report

---

## Mainnet Addresses

After deployment, update this section:

```
Program ID: <PENDING>
Pool 0.1 SOL: <PENDING>
Pool 1 SOL: <PENDING>
Pool 10 SOL: <PENDING>
Pool 100 SOL: <PENDING>
Developer Wallet: <PENDING>
```

---

## Launch Timeline

| Day | Action |
|-----|--------|
| D-7 | Final code freeze |
| D-5 | Trusted setup ceremony |
| D-3 | Mainnet build verification |
| D-1 | Deploy program (no init) |
| D-0 | Initialize pools, announce |
| D+1 | Monitor, respond to issues |
| D+7 | First week review |
