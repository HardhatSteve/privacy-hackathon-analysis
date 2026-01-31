#  Cloud Deployment Guide

Deploying SolVoid to a cloud provider (AWS, GCP, DigitalOcean) requires careful management of RPC endpoints and secrets.

---

##  Solana Program (On-Chain)

1.  **Select a Network:** Devnet for testing, Mainnet for production.
2.  **Fund your Deployer:** Use `solana airdrop` on Devnet or transfer SOL on Mainnet.
3.  **Program ID:** Generate a new keypair for your program if you want a custom ID: `solana-keygen new -o target/deploy/solvoid_zk-keypair.json`.
4.  **Deploy:**
    ```bash
    anchor deploy --provider.cluster mainnet
    ```

---

##  Dashboard (Vercel)

1.  Connect your GitHub repository to [Vercel](https://vercel.com).
2.  Set the **Root Directory** to `dashboard/`.
3.  Add **Environment Variables**:
    - `NEXT_PUBLIC_RPC_URL`: A dedicated Mainnet RPC URL (e.g., from Helius/Alchemy).
    - `NEXT_PUBLIC_PROGRAM_ID`: The ID of your deployed program.
4.  Click **Deploy**.

---

##  Relayer (DigitalOcean Droplet / AWS EC2)

1.  Provision a Linux VM (2 vCPUs, 4GB RAM minimum).
2.  Install Docker and Docker Compose.
3.  Clone the repository and create a production `.env` file.
4.  **Security settings:**
    - Open port 3001 only (or use a Load Balancer with SSL/TLS).
    - Rate limit your relayer API to prevent DDoS.
5.  **Run:**
    ```bash
    docker-compose -f docker-compose.prod.yml up -d
    ```

---

##  Secrets & Security

-   **Cloud KMS:** For production relayers, consider using AWS KMS or GCP Secrets Manager to store the relayer's gas wallet private key.
-   **SSL/TLS:** Use Certbot or a cloud-managed certificate to ensure all traffic to the dashboard and relayer is encrypted.
-   **Monitoring:** Use Prometheus and Grafana (see `/monitoring`) to track withdrawal volumes and failure rates.
