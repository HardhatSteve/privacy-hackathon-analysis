# ORRO API Reference (V2.0)

This guide explains how to talk to the ORRO Protocol using code. It is designed for **Guides** who want to build apps that track human effort (Grit) and community trust (Winks).

## 1. Creative Identity

Before you can earn Grit, you must have a **Creative Avatar**. This is a permanent digital ID on the blockchain that stores your progress.

### `POST /avatar/create`

**What it does:** Sets up your initial profile and links your wallet.

* **What to send:** Your chosen username and your initial "Magic" alignment (Beauty, Chaos, Abstract, or Integral).

* **Plain English:** Use this to "Sign the Oath" and officially become a Level 4 Creator.

### `GET /avatar/{username}`

**What it does:** Fetches a creator's current stats.

* **What you get back:** Their current **MTC (Grit)** score, **YTC (Winks)** count, and their Creator Level.

## 2. Tracking "Grit" (MTC)

Grit is earned by showing your work. In ORRO, we call these small pieces of progress **Fragments**.

### `POST /fragments/commit`

**What it does:** Uploads a "proof of work" to your digital Bucket.

* **Required Info:** A description of the work (e.g., "Initial Sketch") and the file itself.

* **The Result:** Your **MTC (My Trust Code)** increases slightly because you proved you are working.

* **Stealth Mode:** You can add `private: true` to keep the fragment hidden while still earning the Grit for it.

## 3. Community "Winks" (YTC)

Winks are how the community tells you they value your work. This builds your reputation (Your Trust Code).

### `POST /winks/send`

**What it does:** Sends a "Wink" to another creator's Fragment or Profile.

* **Cost:** Sending a Wink is free, but you can only send a limited amount per day based on your own level.

* **Impact:** The receiver's **YTC (Your Trust Code)** goes up, making their work more visible in the global "Gossip Box".

## 4. The Gossip Box (Live Feed)

The Gossip Box is the protocol's heartbeat. It shows real-time updates from across the network.

### `GET /gossip/stream`

**What it does:** Returns a live list of recent high-value events.

* **Examples of Events:** "@User just pledged to Chaos," or "@User reached Level 3: Contributor".

* **Developer Tip:** Use this to power your sidebar tickers or "Live Feed" panels.

## 5. Security & Trust

### `POST /verify/oath`

**What it does:** Checks if a user has signed the **Signature Oath**.

* **Purpose:** To prevent bots. If a user hasn't signed the oath, they cannot earn MTC or participate in the Gossip Box.

* * *

### **Cross-Reference Map**

| **Feature**     | **Whitepaper Section** | **README.md Connection**  |
| --------------- | ---------------------- | ------------------------- |
| **MTC / Grit**  | Section 3.1 & D.2      | "How we measure effort"   |
| **YTC / Winks** | Section 3.2            | "Community Reputation"    |
| **Pledges**     | Appendix D.2           | "The Creator's Choice"    |
| **The Oath**    | Appendix D.3           | "Bot-Protection Layer"    |
| **Roles**       | Appendix D.4           | "Permissioned API Access" |


