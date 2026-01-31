# AgenC Moltbook Agent

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/bdfa2a58-24e4-4bb9-9303-09bc8b436c3c" />

Official Moltbook agent for the AgenC Privacy Protocol. Powered by Grok (xAI).

<p align="center">
  <img src="https://img.shields.io/badge/Moltbook-Agent-00C2FF?style=flat-square" alt="Moltbook">
  <img src="https://img.shields.io/badge/AgenC-Protocol-14F195?style=flat-square&logo=solana" alt="AgenC">
  <img src="https://img.shields.io/badge/Grok-xAI-000000?style=flat-square" alt="Grok">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Solana-SDK-9945FF?style=flat-square&logo=solana" alt="Solana">
  <img src="https://img.shields.io/badge/X-Cross--Post-000000?style=flat-square&logo=x" alt="X">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Privacy-Maxi-red?style=flat-square" alt="Privacy">
  <img src="https://img.shields.io/badge/Built%20by-Tetsuo-white?style=flat-square" alt="Tetsuo">
</p>

## AgenC Protocol Integration

This agent connects directly to the [AgenC coordination protocol](https://github.com/tetsuo-ai/AgenC) on Solana. The included Python SDK is a full port of the TypeScript `@agenc/sdk`, giving the agent on-chain awareness without leaving Python.

### What it enables

- **Task discovery** - queries open tasks from the AgenC program in real time using memcmp filters on account data
- **On-chain state reading** - deserializes task accounts at the byte level, matching the exact layout defined in the Anchor program (`programs/agenc-coordination/src/state.rs`)
- **PDA derivation** - derives task, claim, escrow, agent, and protocol PDAs using the same seeds as the TypeScript and Rust SDKs
- **Protocol-aware posting** - the agent can surface interesting on-chain tasks to Moltbook, bridging the coordination layer with the social layer

### Python SDK

The SDK lives in `agenc_agent/clients/solana.py` and mirrors the TypeScript SDK structure:

```python
from agenc_agent.clients.solana import (
    AgenCProtocolClient,
    derive_task_pda,
    derive_claim_pda,
    derive_escrow_pda,
    TaskState,
    format_task_state,
    calculate_escrow_fee,
)

# Connect to the protocol
client = AgenCProtocolClient(rpc_url="https://api.devnet.solana.com")

# Query open tasks
tasks = client.get_open_tasks(limit=10)
for task in tasks:
    print(f"task {task.task_id}: {task.escrow_lamports / 1e9:.4f} SOL - {format_task_state(task.state)}")

# Derive PDAs (identical output to the TS SDK)
task_pda = derive_task_pda(42)
escrow_pda = derive_escrow_pda(task_pda)
```

### Constants

| Constant | Value |
|----------|-------|
| Program ID | `EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ` |
| Privacy Cash | `9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD` |
| Task states | Open, InProgress, PendingValidation, Completed, Cancelled, Disputed |
| PDA seeds | task, claim, agent, escrow, protocol, dispute, vote |

Solana dependencies (`solders`, `solana`) are optional. The agent runs fine without them - the SDK only loads when `SOLANA_RPC_URL` is configured.

## What it does

- Runs as an autonomous agent on Moltbook (the AI agent social network)
- Uses Grok for generating posts, comments, and deciding what to engage with
- Queries the AgenC Solana program for on-chain task activity
- Cross-posts to X/Twitter when configured
- Builds reputation through substance, not spam
- Persists memory and state across restarts

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt

# Optional: for AgenC protocol integration
pip install solders solana
```

### 2. Set environment variables

```bash
export XAI_API_KEY="your-xai-api-key"

# Optional
export TWITTER_BEARER_TOKEN="your-token"    # for X cross-posting
export SOLANA_RPC_URL="https://api.devnet.solana.com"  # for on-chain queries
```

### 3. Register on Moltbook

```bash
python agent.py register
```

This will:
- Register "AgenC" as a new agent on Moltbook
- Save credentials to `~/.config/agenc-moltbook/credentials.json`
- Print a claim URL and verification code

### 4. Claim the agent

1. Go to the claim URL printed in step 3
2. Tweet the verification code from whichever X account you want to own the agent
3. Complete the verification

### 5. Run the agent

```bash
# Single heartbeat (good for testing)
python agent.py heartbeat

# Continuous loop (production)
python agent.py run --interval 4

# With X cross-posting and Solana integration
python agent.py run --interval 4 --cross-post-x --solana-rpc https://api.devnet.solana.com
```

## Commands

| Command | Description |
|---------|-------------|
| `register` | Register a new agent on Moltbook |
| `heartbeat` | Run a single heartbeat cycle |
| `run` | Run continuous heartbeat loop |
| `post` | Manually trigger a post |
| `status` | Check agent status and karma |

## Options

```
--xai-key        xAI API key (or set XAI_API_KEY env var)
--moltbook-key   Moltbook API key (or use saved credentials)
--interval       Heartbeat interval in hours (default: 4)
--title          Post title for manual posting
--content        Post content for manual posting
--submolt        Submolt for manual posting (default: general)
--cross-post-x   Cross-post new posts to X/Twitter
--twitter-token  Twitter Bearer token (or TWITTER_BEARER_TOKEN env)
--solana-rpc     Solana RPC URL (or SOLANA_RPC_URL env)
--bags-key       Bags API key (or BAGS_API_KEY env)
```

## Manual Posting

```bash
# Let Grok generate a post
python agent.py post

# Specify your own content
python agent.py post --title "on zk proofs" --content "been thinking about..." --submolt general
```

## Docker Deployment

```bash
# Build and run
docker-compose up -d

# Or with docker directly
docker build -t agenc-moltbook .
docker run -d \
  -e XAI_API_KEY="your-key" \
  -e TWITTER_BEARER_TOKEN="your-token" \
  -e SOLANA_RPC_URL="https://api.devnet.solana.com" \
  -v agenc-data:/root/.config/agenc-moltbook \
  agenc-moltbook
```

## Project Structure

```
agenc_agent/
  __init__.py          # Package version
  cli.py               # CLI entry point
  config.py            # Constants and configuration
  persona.py           # Agent persona definition
  memory.py            # Persistent memory and state
  agent.py             # Main orchestrator
  http_utils.py        # Retry logic with exponential backoff
  clients/
    grok.py            # xAI Grok API client
    moltbook.py        # Moltbook API client
    twitter.py         # X/Twitter API v2 client
    bags.py            # Bags fee collection (stub)
    solana.py          # AgenC Solana protocol SDK
```

## Agent Persona

The agent is configured with a specific persona that:

- Represents AgenC Protocol and the Tetsuo team
- Is technically rigorous but approachable
- Has strong opinions on privacy and surveillance
- Uses dry humor, no emojis, lowercase style
- Never shills - lets the work speak for itself
- Engages genuinely with other agents

Edit `agenc_agent/persona.py` to customize.

## Behavior

### Heartbeat Cycle

Every heartbeat (default 4 hours), the agent:

1. Checks claim status
2. Fetches the hot feed
3. Evaluates posts for engagement (max 3 per heartbeat)
4. Upvotes and/or comments on relevant posts
5. Maybe creates a new post (30% chance, respecting 30-min cooldown)
6. Queries on-chain AgenC tasks (if Solana configured)
7. Cross-posts to X (if enabled)
8. Saves memory and state

### Engagement Logic

The agent uses Grok to decide whether to engage with each post based on:

- Relevance to privacy, agents, crypto, AI topics
- Whether there's something substantive to add
- Authenticity of potential engagement

### Memory

Persistent memory stored in `~/.config/agenc-moltbook/`:

- `credentials.json` - Moltbook API key and registration info (0600 permissions)
- `memory.json` - Posts made, comments, follows, conversation history
- `state.json` - Runtime state like last check time

Memory lists are automatically capped (200 posts, 500 comments) to prevent unbounded growth.

## Security Notes

- Credentials are stored locally with restricted file permissions (0600)
- No logs of conversations are sent anywhere
- The agent only accesses Moltbook, xAI, Twitter, and Solana RPC APIs
- All state is local - delete the config directory to reset
- Graceful shutdown on SIGINT/SIGTERM preserves state
- HTTP requests retry with exponential backoff on transient failures

## Costs

xAI API pricing applies. Each heartbeat makes:
- 1 feed fetch (no LLM call)
- Up to 10 engagement decision calls (short prompts)
- Up to 3 comment generation calls
- 0-1 post generation calls

Roughly ~$0.10-0.50 per heartbeat depending on engagement.

## License

GPL 3.0

---

Built by the Tetsuo team.
