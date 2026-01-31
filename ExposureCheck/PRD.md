# Exposure Check — Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Exposure Check
**Category:** Education / Privacy Awareness Tool
**Hackathon Track:** Track 1 — Educate users about mass financial surveillance
**Stage:** Hackathon MVP

### 1.1 Purpose

Exposure Check is a web-based tool that allows users to paste a **Solana wallet address** and instantly see **how exposed and surveilled that wallet already is** using only **publicly available on-chain and social data**.

The product makes mass financial surveillance in crypto **visible, intuitive, and concrete**, without fear-mongering or jargon.

### 1.2 Problem Statement

Most crypto users believe wallets are anonymous by default. In reality:

* On-chain activity is permanently public
* Wallets are clustered, labeled, and profiled
* Wallet addresses are frequently linked to **social identities** through public posts, bios, ENS/SNS names, and community interactions
* A single public interaction (on-chain or off-chain) can irreversibly reduce privacy

Once a wallet is linked to a social profile, **all past and future on-chain activity becomes attributable**, enabling long-term surveillance and profiling by third parties.

These risks are abstract to most users. Exposure Check turns them into **personal, observable facts**.

### 1.3 Solution

Exposure Check aggregates public data in the same way surveillance platforms do and presents it back to the user in a clear, educational format.

The tool answers one core question:

> “If someone wanted to profile this wallet today, how much could they already infer?”

### 1.4 Non-Goals (Explicit)

Exposure Check does **not**:

* Provide anonymity or privacy protection
* Claim perfect accuracy
* Predict future risk
* Access private or paid surveillance datasets
* Deanonymize users beyond public data

---

## 2. Target Users

### Primary Users

* Retail crypto users
* Solana ecosystem users
* Hackathon judges

### Secondary Users

* Privacy researchers
* Developers
* Educators

---

## 3. Core User Flow

1. User lands on Exposure Check
2. User pastes a Solana wallet address
3. User clicks **"Check Exposure"**
4. App fetches and analyzes public data
5. App displays:

   * Overall Exposure Score
   * Exposure breakdown by category
   * Concrete examples and explanations

---

## 4. Exposure Categories (Functional Requirements)

Each category outputs a **Low / Medium / High** rating and a short explanation.

### 4.1 Wallet Activity Visibility

**Goal:** Show how visible the wallet’s financial activity is.

**Signals:**

* Total transaction count
* Token diversity
* Frequency of activity

**Example Output:**

* “This wallet has executed 842 transactions.”
* “High-frequency activity increases observability.”

---

### 4.2 Address Linkability (Clustering — Lite)

**Goal:** Demonstrate how wallets are linked together.

**Signals:**

* Repeated counterparties
* Reused funding sources
* Recurring transfer patterns

**Example Output:**

* “This wallet is likely linked to 3–6 other wallets.”
* Display 2–3 example linked addresses.

---

### 4.3 Social Exposure & Social Linking

**Goal:** Show how wallet activity can be linked to real-world or online identities.

**Signals:**

* Wallet address appearing on X (Twitter)
* ENS or SNS name presence
* Direct links between wallet and social profiles (bio links, pinned posts, replies)
* Wallets mentioned alongside usernames or profile handles

**Example Output:**

* “This wallet address has appeared in public social posts.”
* “This wallet is directly linked to a social profile.”
* “Once linked to a social identity, wallet activity can be monitored indefinitely.”

---

### 4.4 Behavioral Profiling

**Goal:** Show how usage patterns lead to profiling.

**Signals:**

* Protocol categories used (DeFi, NFTs, memecoins)
* Time-of-day activity patterns
* Trading frequency

**Example Output:**

* “Trading-focused wallet.”
* “Most active between 20:00–02:00 UTC.”

---

### 4.5 Financial Footprint

**Goal:** Show how wealth and risk are inferred.

**Signals:**

* Approximate net worth (ranges only)
* Volatility of balances
* Stablecoin vs volatile asset usage

**Example Output:**

* “Estimated exposure range: $5k–$20k.”
* “High volatility trading behavior detected.”

---

### 4.6 Privacy Hygiene (Optional / Bonus)

**Goal:** Show that improper privacy use can still be linked.

**Signals:**

* Immediate reuse of the same wallet after privacy interactions
* No time delays
* Predictable transaction timing

**Example Output:**

* “Privacy attempt detected, but linkability remains high.”

---

## 5. Exposure Score

### 5.1 Description

Exposure Check outputs a single **Exposure Score** summarizing overall surveillance visibility.

**Range:** 0–100
**Nature:** Heuristic and educational

### 5.2 Presentation

```
Exposure Score: 76 / 100 — High Exposure
```

Include disclaimer:

> “This score reflects what public observers could infer using commonly available tools.”

---

## 6. Technical Architecture

### 6.1 Frontend

* **Framework:** Vite
* **Language:** TypeScript
* **UI:** React or Svelte (team choice)
* **Features:**

  * Wallet input form
  * Loading state
  * Results dashboard

### 6.2 Data Sources

* Solana RPC (Helius or public RPC)
* Public block explorers
* Public social search (X)

### 6.3 Backend

* No dedicated backend required for MVP
* Client-side data aggregation
* Optional lightweight API proxy if rate limits require

---

## 7. UX & Content Guidelines

* Calm, neutral tone
* Educational, not alarmist
* No jargon
* Short explanations (1–3 sentences)

Avoid:

* Fear-based language
* Claims of total surveillance

Use:

* “Publicly observable”
* “Commonly inferred”
* “Likely linked”

---

## 8. Performance Requirements

* Single wallet analysis completes in <10 seconds
* Graceful handling of empty or new wallets

---

## 9. MVP Scope

### Included

* Wallet paste → exposure analysis
* Exposure score
* At least 5 exposure categories

### Excluded

* Wallet connection
* Authentication
* Historical tracking
* Alerts or notifications

---

## 10. Success Criteria

The project is successful if:

* Users clearly understand wallets are not anonymous
* Users see real, personal examples of surveillance
* Judges can grasp the concept in under 30 seconds

---

## 11. One-Sentence Summary

> **Exposure Check** shows crypto users how much of their financial behavior is already publicly visible — and why selective privacy matters.
