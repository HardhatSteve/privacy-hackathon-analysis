/**
 * SOL-ZERO RPC Configuration Pool
 * Consolidated list of public endpoints for protocol telemetry and operations.
 */

export const RPC_POOL = {
    MAINNET: [
        "https://api.mainnet-beta.solana.com",
        "https://rpc.ankr.com/solana",
        "https://solana.drpc.org",
        "https://solana-mainnet.rpc.drpc.org",
        "https://drpc.solana.org",
        "https://solana.api.onfinality.io/public",
        "https://solana-mainnet.api.onfinality.io",
        "https://solana.api.pocket.network/",
        "https://public.rpc.solanavibestation.com/",
        "https://solana-mainnet.rpc.extrnode.com",
        "https://mainnet.solana.rpc.extrnode.com",
        "https://solana-rpc-1.extrnode.com",
        "https://solana-mainnet-1.rpc.extrnode.com",
        "https://solana-mainnet-2.rpc.extrnode.com",
        "https://free-mainnet-solana.rpc.extrnode.com",
        "https://solana-rpc.publicnode.com",
        "https://solana.publicnode.com",
        "https://solana.publicnode.network/",
        "https://solana-mainnet.publicnode.com",
        "https://solana-rpc-mainnet.publicnode.com",
        "https://sol-protect.rpc.blxrbdn.com/",
        "https://solana.lavenderfive.com/",
        "https://solana-mainnet.gateway.tatum.io/",
        "https://rpc.solana.tools/",
        "https://api.blockeden.xyz/solana/KeCh6p22EX5AeRHxMSmc",
        "https://solana-mainnet.rpcpool.com/",
        "https://solana.rpcpool.io/",
        "https://everstake.rpcpool.com/",
        "https://mainnet.rpcpool.com/",
        "https://solana.rpcpool.com",
        "https://solana.rpcpool.org",
        "https://global.rpcpool.com/solana/",
        "https://solana-mainnet.chainstacklabs.com",
        "https://solana-mainnet.leorpc.com",
        "https://p2p.rpc.solana.org",
        "https://solana.public-rpc.com",
        "https://rpc.solana-node.com",
        "https://rpc.solana-today.com",
        "https://api.solana.foundation",
        "https://solana-mainnet-public.rpcnode.org",
        "https://rpc.solanahub.io",
        "https://free-rpc.solana.org",
        "https://public-rpc.solana-nodes.net"
    ],
    DEVNET: [
        "https://api.devnet.solana.com",
        "https://rpc.ankr.com/solana_devnet",
        "https://solana-devnet.api.onfinality.io/public",
        "https://solana-devnet.gateway.tatum.io/",
        "https://devnet.rpc.extrnode.com",
        "https://devnet.rpcpool.com"
    ],
    TESTNET: [
        "https://api.testnet.solana.com"
    ],
    EPHEMERAL: [
        "https://zk-edge.surfnet.dev:8899"
    ]
};

export const DEFAULT_RPC = {
    MAINNET: RPC_POOL.MAINNET[0], // Using official mainnet-beta as default for stability
    DEVNET: RPC_POOL.DEVNET[0],   // Official Solana devnet  
    TESTNET: RPC_POOL.TESTNET[0],
    EPHEMERAL: "https://zk-edge.surfnet.dev:8899"
};
