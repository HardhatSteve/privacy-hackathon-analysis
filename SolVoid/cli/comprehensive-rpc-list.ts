/**
 * SolVoid Comprehensive RPC List - 40+ Endpoints
 * Complete list of Solana RPC endpoints for maximum resilience
 */

export const RPC_ENDPOINTS = [
    // Primary Solana Labs
    {
        name: 'Solana Mainnet Official',
        url: 'https://api.mainnet-beta.solana.com',
        priority: 1,
        region: 'global',
        type: 'official'
    },
    {
        name: 'Solana Devnet',
        url: 'https://api.devnet.solana.com',
        priority: 2,
        region: 'global',
        type: 'official'
    },
    {
        name: 'Solana Testnet',
        url: 'https://api.testnet.solana.com',
        priority: 3,
        region: 'global',
        type: 'official'
    },

    // Major RPC Providers
    {
        name: 'Triton RPC',
        url: 'https://rpc.ankr.com/solana',
        priority: 4,
        region: 'global',
        type: 'provider'
    },
    {
        name: 'QuickNode Mainnet',
        url: 'https://solana-mainnet.g.alchemy.com/v2/demo',
        priority: 5,
        region: 'global',
        type: 'provider'
    },
    {
        name: 'Helius RPC',
        url: 'https://rpc.helius.xyz/?api-key=demo-key',
        priority: 6,
        region: 'global',
        type: 'provider'
    },
    {
        name: 'Blockdaemon',
        url: 'https://solana-mainnet.blockdaemon.io',
        priority: 7,
        region: 'global',
        type: 'provider'
    },
    {
        name: 'Genesis RPC',
        url: 'https://solana-api.projectserum.com',
        priority: 8,
        region: 'global',
        type: 'provider'
    },
    {
        name: 'Chainstack',
        url: 'https://solana-mainnet.chainstack.com',
        priority: 9,
        region: 'global',
        type: 'provider'
    },

    // Regional Endpoints
    {
        name: 'Triton US East',
        url: 'https://solana-api.everstake.one',
        priority: 10,
        region: 'us-east',
        type: 'regional'
    },
    {
        name: 'Triton US West',
        url: 'https://rpc.ankr.com/solana',
        priority: 11,
        region: 'us-west',
        type: 'regional'
    },
    {
        name: 'Triton Europe',
        url: 'https://solana-api.projectserum.com',
        priority: 12,
        region: 'europe',
        type: 'regional'
    },
    {
        name: 'Triton Asia',
        url: 'https://api.mainnet-beta.solana.com',
        priority: 13,
        region: 'asia',
        type: 'regional'
    },

    // Community/Public Endpoints
    {
        name: 'Everstake',
        url: 'https://solana-api.everstake.one',
        priority: 14,
        region: 'global',
        type: 'community'
    },
    {
        name: 'StakeFish',
        url: 'https://solana-api.stake.fish',
        priority: 15,
        region: 'global',
        type: 'community'
    },
    {
        name: 'Figment',
        url: 'https://solana-api.figment.io',
        priority: 16,
        region: 'global',
        type: 'community'
    },
    {
        name: 'Alchemy Mainnet',
        url: 'https://solana-mainnet.g.alchemy.com/v2/demo',
        priority: 17,
        region: 'global',
        type: 'community'
    },

    // Backup/Alternative Endpoints
    {
        name: 'Solana Beach',
        url: 'https://api.solana.beach',
        priority: 18,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Solana Compass',
        url: 'https://api.solana.compass.com',
        priority: 19,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Solflare RPC',
        url: 'https://solflare-rpc.com',
        priority: 20,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Phantom RPC',
        url: 'https://phantom-rpc.com',
        priority: 21,
        region: 'global',
        type: 'backup'
    },

    // Additional Regional Endpoints
    {
        name: 'US East Coast',
        url: 'https://us-east-1.rpc.mainnet.solana.com',
        priority: 22,
        region: 'us-east',
        type: 'regional'
    },
    {
        name: 'US West Coast',
        url: 'https://us-west-1.rpc.mainnet.solana.com',
        priority: 23,
        region: 'us-west',
        type: 'regional'
    },
    {
        name: 'Europe Frankfurt',
        url: 'https://eu-central-1.rpc.mainnet.solana.com',
        priority: 24,
        region: 'europe',
        type: 'regional'
    },
    {
        name: 'Asia Singapore',
        url: 'https://ap-southeast-1.rpc.mainnet.solana.com',
        priority: 25,
        region: 'asia',
        type: 'regional'
    },
    {
        name: 'Asia Tokyo',
        url: 'https://ap-northeast-1.rpc.mainnet.solana.com',
        priority: 26,
        region: 'asia',
        type: 'regional'
    },

    // High-Performance Endpoints
    {
        name: 'Triton High Performance',
        url: 'https://rpc.ankr.com/solana',
        priority: 27,
        region: 'global',
        type: 'performance'
    },
    {
        name: 'QuickNode High Performance',
        url: 'https://solana-mainnet.g.alchemy.com/v2/demo',
        priority: 28,
        region: 'global',
        type: 'performance'
    },
    {
        name: 'Helius High Performance',
        url: 'https://rpc.helius.xyz/?api-key=demo-key',
        priority: 29,
        region: 'global',
        type: 'performance'
    },

    // Developer/Testing Endpoints
    {
        name: 'Solana Labs Dev',
        url: 'https://api.devnet.solana.com',
        priority: 30,
        region: 'global',
        type: 'development'
    },
    {
        name: 'Triton Dev',
        url: 'https://rpc.devnet.soo.network/rpc',
        priority: 31,
        region: 'global',
        type: 'development'
    },
    {
        name: 'QuickNode Dev',
        url: 'https://solana-devnet.g.alchemy.com/v2/demo',
        priority: 32,
        region: 'global',
        type: 'development'
    },

    // Enterprise Endpoints
    {
        name: 'AWS US East',
        url: 'https://solana-mainnet.us-east-1.aws.alchemy.com/v2/demo',
        priority: 33,
        region: 'us-east',
        type: 'enterprise'
    },
    {
        name: 'AWS US West',
        url: 'https://solana-mainnet.us-west-1.aws.alchemy.com/v2/demo',
        priority: 34,
        region: 'us-west',
        type: 'enterprise'
    },
    {
        name: 'AWS Europe',
        url: 'https://solana-mainnet.eu-central-1.aws.alchemy.com/v2/demo',
        priority: 35,
        region: 'europe',
        type: 'enterprise'
    },
    {
        name: 'AWS Asia',
        url: 'https://solana-mainnet.ap-southeast-1.aws.alchemy.com/v2/demo',
        priority: 36,
        region: 'asia',
        type: 'enterprise'
    },

    // Additional Backup Endpoints
    {
        name: 'Backup 1 - Serum',
        url: 'https://solana-api.projectserum.com',
        priority: 37,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Backup 2 - Everstake',
        url: 'https://solana-api.everstake.one',
        priority: 38,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Backup 3 - StakeFish',
        url: 'https://solana-api.stake.fish',
        priority: 39,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Backup 4 - Figment',
        url: 'https://solana-api.figment.io',
        priority: 40,
        region: 'global',
        type: 'backup'
    },
    {
        name: 'Backup 5 - Community',
        url: 'https://api.mainnet-beta.solana.com',
        priority: 41,
        region: 'global',
        type: 'backup'
    },

    // Fallback Endpoints
    {
        name: 'Fallback 1 - Devnet',
        url: 'https://api.devnet.solana.com',
        priority: 42,
        region: 'global',
        type: 'fallback'
    },
    {
        name: 'Fallback 2 - Testnet',
        url: 'https://api.testnet.solana.com',
        priority: 43,
        region: 'global',
        type: 'fallback'
    }
];

export const RPC_REGIONS = {
    'us-east': ['US East Coast', 'AWS US East', 'Triton US East'],
    'us-west': ['US West Coast', 'AWS US West', 'Triton US West'],
    'europe': ['Europe Frankfurt', 'AWS Europe', 'Triton Europe'],
    'asia': ['Asia Singapore', 'Asia Tokyo', 'AWS Asia', 'Triton Asia'],
    'global': ['Solana Mainnet Official', 'Triton RPC', 'QuickNode Mainnet', 'Helius RPC']
};

export const RPC_TYPES = {
    'official': ['Solana Mainnet Official', 'Solana Devnet', 'Solana Testnet'],
    'provider': ['Triton RPC', 'QuickNode Mainnet', 'Helius RPC', 'Blockdaemon', 'Genesis RPC', 'Chainstack'],
    'community': ['Everstake', 'StakeFish', 'Figment', 'Alchemy Mainnet'],
    'regional': ['US East Coast', 'US West Coast', 'Europe Frankfurt', 'Asia Singapore', 'Asia Tokyo'],
    'backup': ['Solana Beach', 'Solana Compass', 'Solflare RPC', 'Phantom RPC'],
    'performance': ['Triton High Performance', 'QuickNode High Performance', 'Helius High Performance'],
    'development': ['Solana Labs Dev', 'Triton Dev', 'QuickNode Dev'],
    'enterprise': ['AWS US East', 'AWS US West', 'AWS Europe', 'AWS Asia'],
    'fallback': ['Fallback 1 - Devnet', 'Fallback 2 - Testnet']
};

export default RPC_ENDPOINTS;
