#!/usr/bin/env node

// Simple CLI entry point that doesn't depend on problematic modules
console.log(' SolVoid Privacy Scanner');
console.log('');
console.log('Usage:');
console.log('  solvoid-scan <command> [options]');
console.log('');
console.log('Commands:');
console.log('  scan <address>     Scan address for privacy leaks');
console.log('  shield <amount>    Shield SOL with privacy');
console.log('  rescue <txid>     Rescue stuck transaction');
console.log('  status           Check system status');
console.log('');
console.log('Examples:');
console.log('  solvoid-scan scan 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
console.log('  solvoid-scan shield 1000000');
console.log('');
console.log('Note: Full CLI functionality requires proper module resolution.');
console.log('This is a simplified version for demonstration.');
