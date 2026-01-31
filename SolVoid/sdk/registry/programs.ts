// Real Mainnet Program IDs for accurate detection
export const KNOWN_PROGRAMS = {
    // DEXs / AMMs
    "Raydium V4": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "Raydium CPMM": "CPMMoo8L3F4NbTneV256ygjSdjfKrist5a24gnsGf5V",
    "Orca Whirlpools": "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
    "Jupiter Aggregator V6": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "Jupiter Limit Order": "jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzLM8mK",
    "Pump.fun": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // Example ID, verify validity in real implementation
    "Meteora DLMM": "LBUZKhRxPF3XUpBCjp4YzTkDZJUbDLw9Jq3DKzWzTcL",

    // Lending
    "Marginfi": "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
    "Kamino Lending": "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD",

    // System
    "System Program": "11111111111111111111111111111111",
    "Token Program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "Associated Token": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    "Memo Program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb"
};

// Returns a human readable name if known, or truncated Hash
export function identifyProgram(programId: string): string {
    for (const [name, id] of Object.entries(KNOWN_PROGRAMS)) {
        if (id === programId) return name;
    }
    return `Unknown (${programId.slice(0, 8)}...)`;
}

// Logic to determine if a program is an AMM/Swap source
export function isSwapProgram(programId: string): boolean {
    const swapIds = [
        KNOWN_PROGRAMS["Raydium V4"],
        KNOWN_PROGRAMS["Raydium CPMM"],
        KNOWN_PROGRAMS["Orca Whirlpools"],
        KNOWN_PROGRAMS["Jupiter Aggregator V6"],
        KNOWN_PROGRAMS["Meteora DLMM"],
        KNOWN_PROGRAMS["Pump.fun"]
    ];
    return swapIds.includes(programId);
}
