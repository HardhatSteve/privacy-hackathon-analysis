/**
 * RentReclaim Discord Bot
 * 
 * Commands:
 *   /cleanup - Get a link to scan your wallet
 *   /estimate <address> - Estimate recoverable SOL for a wallet
 *   /stats - Show service statistics
 * 
 * Setup:
 *   1. Create Discord app at https://discord.com/developers
 *   2. Enable "bot" and "applications.commands" scopes
 *   3. Add bot to server with slash command permissions
 *   4. Set environment variables and run: node discord-bot.js
 */

import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

// ============ CONFIGURATION ============
const CONFIG = {
  // Discord
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID, // Optional: for dev guild
  
  // Solana
  RPC_ENDPOINT: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  
  // App
  APP_URL: process.env.APP_URL || 'https://rentreclaim.app',
  REFERRAL_PREFIX: 'discord',
  
  // Stats (replace with actual tracking)
  STATS: {
    walletsClean: 2847,
    solRecovered: 127.4,
    accountsClosed: 63291,
  },
};

const connection = new Connection(CONFIG.RPC_ENDPOINT, 'confirmed');

// ============ SLASH COMMANDS ============
const commands = [
  new SlashCommandBuilder()
    .setName('cleanup')
    .setDescription('Get a link to scan and clean your Solana wallet'),
  
  new SlashCommandBuilder()
    .setName('estimate')
    .setDescription('Estimate recoverable SOL for a wallet')
    .addStringOption(option =>
      option
        .setName('address')
        .setDescription('Solana wallet address')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show RentReclaim statistics'),
];

// ============ HELPER FUNCTIONS ============
async function countEmptyAccounts(walletAddress) {
  try {
    const owner = new PublicKey(walletAddress);
    let count = 0;
    let totalRent = 0;
    
    // Check Token Program
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: TOKEN_PROGRAM_ID },
      { commitment: 'confirmed' }
    );
    
    for (const { account } of tokenAccounts.value) {
      const parsed = account.data.parsed?.info;
      if (parsed?.tokenAmount?.amount === "0" && parsed?.state === "initialized") {
        count++;
        totalRent += account.lamports;
      }
    }
    
    // Check Token-2022
    const token22Accounts = await connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: TOKEN_2022_PROGRAM_ID },
      { commitment: 'confirmed' }
    );
    
    for (const { account } of token22Accounts.value) {
      const parsed = account.data.parsed?.info;
      if (parsed?.tokenAmount?.amount === "0" && parsed?.state === "initialized") {
        count++;
        totalRent += account.lamports;
      }
    }
    
    return { count, totalRent };
  } catch (error) {
    console.error('Error counting accounts:', error);
    throw error;
  }
}

function formatSol(lamports) {
  return (lamports / 1e9).toFixed(4);
}

function generateReferralLink(userId) {
  const ref = `${CONFIG.REFERRAL_PREFIX}_${userId}`;
  return `${CONFIG.APP_URL}?ref=${ref}`;
}

// ============ COMMAND HANDLERS ============
async function handleCleanup(interaction) {
  const userId = interaction.user.id;
  const referralLink = generateReferralLink(userId);
  
  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle('🧹 RentReclaim - Recover Your Locked SOL')
    .setDescription(
      'Every empty token account holds ~0.002 SOL in rent.\n' +
      'Active traders have 50-200+ empty accounts — that\'s **$15-60+** trapped!'
    )
    .addFields(
      { name: '🔍 Free to Scan', value: 'Connect wallet, see exactly how much you can recover', inline: true },
      { name: '⚡ Instant Recovery', value: 'Sign transactions, get your SOL back immediately', inline: true },
      { name: '🔒 Non-Custodial', value: 'Your keys never leave your wallet', inline: true },
    )
    .setFooter({ text: 'Click the button below to launch the app' });
  
  await interaction.reply({
    embeds: [embed],
    components: [{
      type: 1,
      components: [{
        type: 2,
        style: 5, // Link button
        label: '🚀 Scan My Wallet',
        url: referralLink,
      }],
    }],
  });
}

async function handleEstimate(interaction) {
  const address = interaction.options.getString('address');
  
  // Validate address
  try {
    new PublicKey(address);
  } catch {
    await interaction.reply({
      content: '❌ Invalid Solana address. Please provide a valid wallet address.',
      ephemeral: true,
    });
    return;
  }
  
  await interaction.deferReply();
  
  try {
    const { count, totalRent } = await countEmptyAccounts(address);
    
    if (count === 0) {
      await interaction.editReply({
        embeds: [{
          color: 0x00FF88,
          title: '✨ Wallet is Clean!',
          description: `No empty token accounts found for \`${address.slice(0, 4)}...${address.slice(-4)}\``,
          footer: { text: 'Nothing to recover' },
        }],
      });
      return;
    }
    
    const fee = Math.floor(totalRent * 0.25); // 25% fee
    const net = totalRent - fee;
    const usdValue = (net / 1e9) * 150; // Assume $150 SOL
    
    const embed = new EmbedBuilder()
      .setColor(0x00FF88)
      .setTitle('💰 Recoverable SOL Found!')
      .setDescription(`Scan results for \`${address.slice(0, 4)}...${address.slice(-4)}\``)
      .addFields(
        { name: '🗑️ Empty Accounts', value: `${count}`, inline: true },
        { name: '💎 Recoverable Rent', value: `${formatSol(totalRent)} SOL`, inline: true },
        { name: '📊 Service Fee (25%)', value: `-${formatSol(fee)} SOL`, inline: true },
        { name: '✅ You Receive', value: `**${formatSol(net)} SOL** (~$${usdValue.toFixed(2)})`, inline: false },
      )
      .setFooter({ text: 'Click below to recover your SOL' });
    
    const referralLink = generateReferralLink(interaction.user.id);
    
    await interaction.editReply({
      embeds: [embed],
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 5,
          label: '🧹 Recover Now',
          url: referralLink,
        }],
      }],
    });
  } catch (error) {
    console.error('Estimate error:', error);
    await interaction.editReply({
      content: '❌ Error scanning wallet. Please try again later.',
    });
  }
}

async function handleStats(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle('📊 RentReclaim Stats')
    .addFields(
      { name: '🧹 Wallets Cleaned', value: CONFIG.STATS.walletsClean.toLocaleString(), inline: true },
      { name: '💰 SOL Recovered', value: `${CONFIG.STATS.solRecovered.toFixed(1)} SOL`, inline: true },
      { name: '📦 Accounts Closed', value: CONFIG.STATS.accountsClosed.toLocaleString(), inline: true },
    )
    .setFooter({ text: 'RentReclaim - Recover your locked SOL' })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
}

// ============ BOT SETUP ============
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  // Register commands
  const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
  
  try {
    console.log('Registering slash commands...');
    
    if (CONFIG.DISCORD_GUILD_ID) {
      // Dev: Guild-specific commands (instant)
      await rest.put(
        Routes.applicationGuildCommands(CONFIG.DISCORD_CLIENT_ID, CONFIG.DISCORD_GUILD_ID),
        { body: commands.map(c => c.toJSON()) }
      );
    } else {
      // Prod: Global commands (up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(CONFIG.DISCORD_CLIENT_ID),
        { body: commands.map(c => c.toJSON()) }
      );
    }
    
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  try {
    switch (interaction.commandName) {
      case 'cleanup':
        await handleCleanup(interaction);
        break;
      case 'estimate':
        await handleEstimate(interaction);
        break;
      case 'stats':
        await handleStats(interaction);
        break;
    }
  } catch (error) {
    console.error('Command error:', error);
    
    const reply = {
      content: '❌ An error occurred. Please try again.',
      ephemeral: true,
    };
    
    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// ============ START BOT ============
if (!CONFIG.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable not set');
  console.log('\nSetup instructions:');
  console.log('1. Create a Discord app at https://discord.com/developers');
  console.log('2. Create a bot and copy the token');
  console.log('3. Set environment variables:');
  console.log('   export DISCORD_TOKEN=your_bot_token');
  console.log('   export DISCORD_CLIENT_ID=your_client_id');
  console.log('   export APP_URL=https://your-app-url.com');
  console.log('4. Run: node discord-bot.js');
  process.exit(1);
}

client.login(CONFIG.DISCORD_TOKEN);
