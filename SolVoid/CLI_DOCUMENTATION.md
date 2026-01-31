#  SolVoid CLI Documentation

> [!TIP]
> For a quick reference of all commands, flags, and options across the entire project, see the [Master Command Cheat Sheet](./COMMANDS.md).

The SolVoid CLI is a powerful tool for developers and power users to interact with the privacy protocol directly from the terminal.


##  Installation

### Global Installation (Recommended)
```bash
npm install -g @solvoid/cli
```

### Local Usage (Development)
If you are working within the repository:
```bash
# Link the package
npm link

# Use the command
solvoid --help
```

---

##  Configuration

The CLI uses a configuration file located at `~/.config/solvoid/config.json`. You can also set values via environment variables.

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `SOLVOID_RPC` | Solana RPC URL | `https://api.devnet.solana.com` |
| `SOLVOID_PROGRAM_ID` | SolVoid Program ID | (Inferred from IDL) |
| `SOLVOID_WALLET` | Path to wallet keypair | `~/.config/solana/id.json` |

---

##  Commands

### `solvoid init`
Initializes the SolVoid program state and PDA accounts. Requires authority signature.
```bash
solvoid init --authority <PUBKEY>
```

### `solvoid shield <amount>`
Locks SOL into the privacy pool.
- **Example:** `solvoid shield 1.5`
- **Options:**
    - `--commitment <hex>`: Provide a custom commitment (generated automatically if omitted).
- **Security Note:** This command will output your **Secret** and **Nullifier**. Keep these safe!

### `solvoid withdraw <amount> <recipient>`
Withdraws funds to a fresh address using a ZK proof.
- **Example:** `solvoid withdraw 1.0 7vk...3Xm`
- **Flags:**
    - `--secret <hex>`: The secret generated during deposit.
    - `--nullifier <hex>`: The nullifier generated during deposit.
    - `--relayer`: Use the configured relayer service (avoids paying gas from your recipient wallet).

### `solvoid status`
Checks the current status of the SolVoid vault, total deposits, and Merkle root.
```bash
solvoid status
```

### `solvoid protect <address>`
Deep-scans for privacy leaks using the **Institutional Grade Scanner**. Rotates through 40+ RPC endpoints with automatic failover to ensure maximum data resilience.
```bash
solvoid protect <WALLET_PUBKEY> --ultimate --stats
```

### `solvoid rescue <address>`
Atomic "Nuclear Option" for compromised wallets. Groups all leaked assets into a single Jito-bundle for high-speed, MEV-protected migration to a private vault.
```bash
solvoid rescue <MY_WALLET_PUBKEY> --emergency
```

### `solvoid ghost <address>`
Generates a Privacy Ghost Score—a detailed, visual report of your wallet's anonymity level.
- **Example:** `solvoid ghost 7vk...3Xm --badge`
- **Flags:**
    - `--badge`: Generate a shareable privacy badge with a cryptographically signed score.
    - `--share`: Display pre-formatted posts for Twitter and Discord.
    - `--json`: Output the score breakdown in raw JSON format.

---

##  Shell Completion

To enable Zsh completions, add the following to your `.zshrc`:
```bash
eval "$(solvoid completion zsh)"
```

---

##  Updating the CLI

To update to the latest version:
```bash
npm install -g @solvoid/cli@latest
```

---

##  Uninstallation

```bash
npm uninstall -g @solvoid/cli
rm -rf ~/.config/solvoid
```
