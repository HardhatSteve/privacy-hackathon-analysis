// Known CEX (Centralized Exchange) addresses on Solana
// These are well-known deposit/withdrawal addresses linked to KYC platforms

export const CEX_ADDRESSES: Record<string, string> = {
    // Binance
    '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9': 'Binance',
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Binance',
    'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2': 'Binance',

    // Coinbase
    'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS': 'Coinbase',
    'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE': 'Coinbase',
    '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': 'Coinbase',

    // Kraken
    'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq': 'Kraken',
    '6WMq7XUK3gxFGGGPB6YPX7yfVnxLDvDJpLN9m4DLpajP': 'Kraken',

    // OKX
    '5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD': 'OKX',

    // FTX (historical - for exposure tracking)
    'FTTDpAQJXaJrCjMVLzeZVMkQiG7cMgSZAUzfTjxS2cZZ': 'FTX',

    // Gate.io
    '4gT6pT9K8fPNP8KxAXrjVZJhPJYBp5YqZQqQ2qS8qTJd': 'Gate.io',

    // Bybit
    '6FEVkH17P9y8Q9aCkDdPcMDjvj7SVxrTETaYEm8f51Jy': 'Bybit',

    // KuCoin
    'BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6': 'KuCoin',

    // Raydium (DEX but notable)
    '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': 'Raydium',

    // Jupiter Aggregator
    'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
};

// Known protocol addresses for activity tracking
export const PROTOCOL_ADDRESSES: Record<string, string> = {
    // Magic Eden
    'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K': 'Magic Eden',
    'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8': 'Magic Eden',

    // Tensor
    'TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN': 'Tensor',

    // Marinade
    'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD': 'Marinade',

    // Jito
    'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'Jito',

    // Orca
    'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca',

    // Solend
    'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo': 'Solend',

    // Kamino
    'KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD': 'Kamino',

    // Drift
    'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH': 'Drift',
};

// SNS (Solana Name Service) program
export const SNS_PROGRAM_ID = 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX';

// Token Metadata Program
export const TOKEN_METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
