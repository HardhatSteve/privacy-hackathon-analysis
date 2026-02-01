# ETHGlobal Hackathon Video Transcripts

Transcripts extracted from YouTube videos with auto-captions enabled.

---

## Transcript Availability

| Video | Event | Status | Duration |
|-------|-------|--------|----------|
| fheProxies | Singapore 2024 | **TRANSCRIBED** | ~3 min |
| Zubernetes | Bangkok 2024 | No captions | - |
| Hanseek | Singapore 2024 | No captions | - |
| Privacy Avengers | Sydney 2024 | Pending | - |

**Note**: Most Mux-hosted videos (85% of ETHGlobal submissions) don't have transcripts available. Only YouTube videos with auto-captions can be transcribed via API.

---

## fheProxies (Singapore 2024) - FULL TRANSCRIPT

**Project**: FHE VPN - Privacy proxy service using Fully Homomorphic Encryption
**Video**: https://youtube.com/watch?v=LSvUDMd_Be8
**Category**: Privacy/Infrastructure

### Transcript

> Hello from ETHGlobal Singapore! We are excited to introduce our submission: the FHE VPN.
>
> What's up! Welcome to our website. So the idea of our hackathon project was basically to revolutionize online privacy with proxy as a service, allowing users to browse the web securely and anonymously.
>
> You might think - what makes us different? So we leverage fully homomorphic encryption, or FHE, to encrypt node provider details. Only clients who have paid for access will be able to view these details.
>
> Future plans include us basically making an extension to allow for a more user experience that they can use in their browsers. And we are integrating Fhenix for this project.
>
> So this is a high level overview of our tech stack:
>
> For the client, what they will do is that they will access the front end first. Then through the front end we will actually retrieve all the server lists from the smart contracts on Fhenix. And once the client has actually selected which server they want to connect to - like maybe a specific country - they can actually pay through the smart contract to the node provider.
>
> And when the smart contract has received payment, it will actually emit out an event to tell the node provider that they have been paid. And what the node provider will do is that they will then update the smart contract for whitelist. So only when the client is whitelisted, then they are able to view details about the nodes such as the IP address.
>
> And for the client, once it has been whitelisted, they can actually view the details on the front end. And through the front end the client can actually key into their system for like macOS or even Windows.
>
> So we are using SOCKS5 to actually reroute all traffic onto the node provider. So this is actually like - it would look like so - if there's any connection that the client would like to make to the internet, you actually have to go through the node provider first before rerouting to the internet. And any data passed from the internet will actually be routed back to the node provider, then to the client.
>
> So all in all, when the internet receives all this data, it looks like it's actually coming from the node provider only, and the client is hiding behind them.
>
> Thank you!
>
> All right, so here is our proof of concept. So we are connecting currently to our local node that is running on the Fhenix Network. So we're running Fhenix locally and we are connected to this account. Here is our balance.
>
> So this is just a helper function to mint tokens. This is the main part here - so here you basically have what is the server account. And when it connects to the contract, it can see what's all the different server list, and we can add and connect to our server.
>
> Thank you very much! We are super happy. Bye! Okay.

---

## Presentation Structure Analysis

From the fheProxies transcript:

### Timeline Breakdown

| Time | Section | Content |
|------|---------|---------|
| 0:00-0:05 | **Hook** | "Hello from ETHGlobal Singapore! We are excited to introduce..." |
| 0:05-0:20 | **Problem/Value** | "Revolutionize online privacy with proxy as a service" |
| 0:20-0:35 | **Differentiator** | "What makes us different? We leverage FHE..." |
| 0:35-0:45 | **Roadmap teaser** | "Future plans include browser extension..." |
| 0:45-1:30 | **Architecture** | Tech stack walkthrough with diagram |
| 1:30-2:15 | **Flow explanation** | Client → Smart contract → Node provider → Internet |
| 2:15-2:45 | **Demo** | "Here is our proof of concept..." |
| 2:45-3:00 | **Close** | "Thank you very much! We are super happy." |

### Key Patterns Observed

1. **Greeting + Event mention** - Establishes context immediately
2. **One-liner pitch** - "Revolutionize online privacy with proxy as a service"
3. **Differentiator question** - "What makes us different?"
4. **Tech stack overview** - High-level architecture before demo
5. **Live demo** - Actual code/product running
6. **Casual, enthusiastic close** - "Super happy, bye!"

### Verbal Techniques

- **Rhetorical question**: "You might think - what makes us different?"
- **Step-by-step explanation**: "First... then... and when..."
- **Visual references**: "So this is actually like - it would look like so"
- **Inclusive language**: "We are excited", "We leverage"

---

## Implications for ZORB Video

Based on the fheProxies transcript structure:

### Recommended ZORB Script Structure

```
[0:00-0:05] HOOK
"Hello from Solana Privacy Hackathon! We're ZORB - free private transfers on Solana."

[0:05-0:20] PROBLEM
"Every privacy protocol locks $0.13 per transaction in rent. Forever."

[0:20-0:35] DIFFERENTIATOR
"What makes us different? We use an indexed merkle tree -
67 million nullifiers in one kilobyte."

[0:35-0:50] UNIQUE FEATURE
"And here's the bonus - Unified SOL. Your shielded balance earns 7-8% APY."

[0:50-1:30] ARCHITECTURE
"Here's how it works: [Tech stack diagram]
Circom circuits for ZK proofs, Anchor programs on Solana..."

[1:30-2:30] DEMO
"Let me show you zorb.cash running.
[Shield SOL → Send privately → Unshield]
Watch this stress test - every transaction is free."

[2:30-3:00] CLOSE
"ZORB. Privacy should be free. Try it at zorb.cash.
Thank you!"
```

---

## Scripts for Additional Transcription

For Mux-hosted videos, you'll need to:

1. Download the video: `curl -O https://stream.mux.com/{VIDEO_ID}/high.mp4`
2. Extract audio: `ffmpeg -i video.mp4 -vn -acodec mp3 audio.mp3`
3. Transcribe with Whisper: `whisper audio.mp3 --model base`

### Whisper Command (Local)

```bash
# Install whisper
pip install openai-whisper

# Transcribe a video
whisper video.mp4 --model base --output_format txt

# For better accuracy (slower)
whisper video.mp4 --model medium --output_format txt
```

### Mux Videos to Transcribe

| Project | Mux URL |
|---------|---------|
| DAOGenie | https://stream.mux.com/QztDu1aTrBkAqT01suT7r7Zb6JMHYKtvelK2g3lYZ2ds/high.mp4 |
| Priv8 | https://stream.mux.com/F5LxKRRdXvgioXH01jwGaC6OY4eeE00oUpUjaM601zWocM/high.mp4 |
| Bob the Solver | https://stream.mux.com/H5SmtXiPZFGRa2Hn5HtuHucFIYsHmzXmzgnpGT8k4ps/high.mp4 |
| Croissant | https://stream.mux.com/B2MpwDFe70000t00T87RFPVS8Ovtv51LCv00E19DEpDtlDc/high.mp4 |
| Zook | https://stream.mux.com/rMCfqOQx502dDq2sVqiAyNSsLavnJ5FxyVwOdkgUP2sc/high.mp4 |
| Chameleon | https://stream.mux.com/F4oxeLoExdHtRxT8011yTiEAeliVvkPq02LdS7ujVMiPs/high.mp4 |
| Widget Protocol | https://stream.mux.com/nJhXc1js00PVL2XeGqUJhdCZiqlblTSqajGgytqYtEUo/high.mp4 |
| ZK Vendor Cred | https://stream.mux.com/eAGiIrAgL80102xV00ed01HPOmknC81cfZgyrhAM5Mi4ULQ/high.mp4 |
| Zkcord | https://stream.mux.com/bIx6YKYa00vYvqAwUxzjdzy4MkNSnna6B02mJL016v612E/high.mp4 |

---

*Transcripts compiled February 2026*
