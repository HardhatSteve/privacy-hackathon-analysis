const chalk = require("chalk");

const TOKEN_ADDRESS = "0x729D2bC137E843fCbBf462B637C96390D0e92a71";
const TOKEN_SYMBOL = "TPT";
const TOKEN_DECIMALS = 18;

console.log(chalk.blue("\n=== Add to MetaMask Instructions ===\n"));

console.log(chalk.yellow("1. First, Add Fuji Network to MetaMask:"));
console.log(chalk.green("Network Name: ") + "Avalanche Fuji Testnet");
console.log(
  chalk.green("RPC URL: ") + "https://api.avax-test.network/ext/bc/C/rpc"
);
console.log(chalk.green("Chain ID: ") + "43113");
console.log(chalk.green("Currency Symbol: ") + "AVAX");
console.log(chalk.green("Block Explorer: ") + "https://testnet.snowtrace.io");

console.log(chalk.yellow("\n2. Then, Add Token to MetaMask:"));
console.log(chalk.green("Token Address: ") + TOKEN_ADDRESS);
console.log(chalk.green("Token Symbol: ") + TOKEN_SYMBOL);
console.log(chalk.green("Token Decimals: ") + TOKEN_DECIMALS);

console.log(chalk.yellow("\n3. Quick Links:"));
console.log(
  chalk.green("View on Snowtrace: ") +
    `https://testnet.snowtrace.io/address/${TOKEN_ADDRESS}`
);
console.log(chalk.green("Get Test AVAX: ") + "https://faucet.avax.network/");

console.log(chalk.blue("\n=== Token Information ==="));
console.log(chalk.green("Name: ") + "Test Privacy Token");
console.log(chalk.green("Total Supply: ") + "1,000,000 TPT");
console.log(chalk.green("Standard: ") + "Encrypted ERC20");

console.log(
  chalk.yellow(
    "\nNote: Make sure you have test AVAX in your wallet for transactions!"
  )
);
