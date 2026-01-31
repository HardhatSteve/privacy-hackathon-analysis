#  Docker Installation Guide

This guide describes how to run the SolVoid developer stack (Validator, Relayer, and Dashboard) using Docker.

##  Quick Start (Docker Compose)

The easiest way to get started is with the provided `docker-compose.yml`.

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Run the Stack
```bash
docker-compose up -d
```
This will start:
- A local Solana validator with the SolVoid program pre-loaded.
- The SolVoid Relayer on port 3001.
- The SolVoid Dashboard on port 3000.

---

##  Individual Components

### Running the Relayer
```bash
docker build -t solvoid-relayer ./relayer
docker run -p 3001:3001 --env-file .env solvoid-relayer
```

### Running the Dashboard
```bash
docker build -t solvoid-dashboard ./dashboard
docker run -p 3000:3000 --env-file .env solvoid-dashboard
```

---

##  Environment Variables in Docker

Ensure your `.env` file contains the correct internal Docker networking URLs:
```env
SOLANA_RPC_URL=http://solana-validator:8899
RELAYER_URL=http://solvoid-relayer:3001
```

---

##  Testing in Docker

To run tests inside the container:
```bash
docker exec -it solvoid-validator anchor test
```
