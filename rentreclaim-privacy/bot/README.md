# RentReclaim Discord Bot

A Discord bot that helps users discover and recover locked SOL from empty token accounts.

## Features

- `/cleanup` - Get a personalized link to scan wallet (with referral tracking)
- `/estimate <address>` - Check how much SOL is recoverable for any wallet
- `/stats` - Show service statistics

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "RentReclaim"
3. Go to "Bot" section and click "Add Bot"
4. Copy the bot token (keep it secret!)
5. Enable "Message Content Intent" if needed

### 2. Get OAuth2 Credentials

1. Go to "OAuth2" → "General"
2. Copy the Client ID

### 3. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Copy the generated URL and open it to invite the bot

### 4. Configure Environment

```bash
export DISCORD_TOKEN=your_bot_token_here
export DISCORD_CLIENT_ID=your_client_id_here
export APP_URL=https://your-rentreclaim-app.com
export RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# Optional: For faster command registration during development
export DISCORD_GUILD_ID=your_test_server_id
```

### 5. Install & Run

```bash
cd bot
npm install
npm start
```

## Deployment

### DigitalOcean Droplet

```bash
# On your server
git clone your-repo
cd bot
npm install

# Create systemd service
sudo tee /etc/systemd/system/rentreclaim-bot.service > /dev/null <<EOF
[Unit]
Description=RentReclaim Discord Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/rentreclaim/bot
Environment=DISCORD_TOKEN=your_token
Environment=DISCORD_CLIENT_ID=your_client_id
Environment=APP_URL=https://your-app.com
ExecStart=/usr/bin/node discord-bot.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now rentreclaim-bot
```

### Railway / Render / Fly.io

1. Push the `bot/` folder to a separate repo (or use monorepo path)
2. Set environment variables in dashboard
3. Deploy with `npm start` command

## Referral Tracking

The bot generates referral links with format:
```
https://your-app.com?ref=discord_123456789
```

Where `123456789` is the Discord user ID. To track revenue:

1. Log referral codes server-side when users complete cleanup
2. Store Discord user ID → revenue mapping
3. Pay out affiliates based on usage

### Partner Program

Give trading community owners a rev share:

1. Create custom ref codes: `discord_servername`
2. Track at app level
3. Pay 10-20% of fees to partners

## Commands Reference

### /cleanup

Returns an embed with:
- Service description
- Key benefits (free scan, instant recovery, non-custodial)
- Button linking to app with user's referral code

### /estimate `<address>`

1. Validates the Solana address
2. Scans for empty token accounts (Token Program + Token-2022)
3. Returns:
   - Number of empty accounts
   - Total recoverable rent
   - Fee calculation
   - Net SOL user would receive
   - Button to recover

### /stats

Shows aggregate statistics:
- Wallets cleaned
- SOL recovered  
- Accounts closed

## Customization

### Update Stats

Edit `CONFIG.STATS` in `discord-bot.js` or connect to your analytics:

```javascript
// Example: Fetch from your API
async function getStats() {
  const res = await fetch('https://your-api.com/stats');
  return res.json();
}
```

### Change Fee Rate

Edit `handleEstimate()`:
```javascript
const fee = Math.floor(totalRent * 0.25); // 25% fee
```

### Add More Commands

```javascript
const commands = [
  // ...existing commands
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top recoveries this week'),
];

// Add handler
case 'leaderboard':
  await handleLeaderboard(interaction);
  break;
```

## Troubleshooting

### Commands not showing up

- Global commands take up to 1 hour to propagate
- For instant testing, set `DISCORD_GUILD_ID` to your test server
- Make sure bot has `applications.commands` scope

### Rate limited

- Discord has rate limits on command registration
- The bot handles RPC rate limits with retries
- Consider using a dedicated RPC (Helius, QuickNode)

### Bot offline

- Check logs: `journalctl -u rentreclaim-bot -f`
- Verify token is correct
- Ensure server has network access

## License

MIT
