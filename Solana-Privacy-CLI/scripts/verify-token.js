const hre = require("hardhat");
const chalk = require("chalk");

async function main() {
  // Get the contract address from the deployment output
  const CONTRACT_ADDRESS = "0x729D2bC137E843fCbBf462B637C96390D0e92a71"; // New deployed contract address

  console.log(chalk.blue("Verifying deployed token..."));

  // Connect to the deployed contract
  const [signer] = await hre.ethers.getSigners();
  const Token = await hre.ethers.getContractFactory("EncryptedERC20");
  const token = Token.attach(CONTRACT_ADDRESS);

  console.log(chalk.blue(`Connected to contract at: ${CONTRACT_ADDRESS}`));
  console.log(chalk.blue(`Using account: ${signer.address}`));

  // Verify Token Details
  console.log(chalk.yellow("\n1. Token Details:"));
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    console.log(chalk.green(`Token Name: ${name}`));
    console.log(chalk.green(`Token Symbol: ${symbol}`));
    console.log(
      chalk.green(`Total Supply: ${hre.ethers.formatUnits(totalSupply, 18)}`)
    );
  } catch (error) {
    console.log(chalk.red("Error getting token details:", error.message));
  }

  // Verify Contract Owner
  console.log(chalk.yellow("\n2. Contract Ownership:"));
  try {
    const owner = await token.owner();
    console.log(chalk.green(`Contract Owner: ${owner}`));
    console.log(
      chalk.green(
        `Is current signer owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`
      )
    );

    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      console.log(chalk.green("✓ You are the contract owner"));
    } else {
      console.log(chalk.yellow("⚠ You are not the contract owner"));
    }
  } catch (error) {
    console.log(chalk.red("Error getting owner info:", error.message));
  }

  // Verify Contract State
  console.log(chalk.yellow("\n3. Contract State:"));
  try {
    const isPaused = await token.paused();
    console.log(
      chalk.green(`Contract Status: ${isPaused ? "Paused" : "Active"}`)
    );
  } catch (error) {
    console.log(chalk.red("Error getting contract state:", error.message));
  }

  // Verify Initial Balance
  console.log(chalk.yellow("\n4. Initial Balance:"));
  try {
    const balance = await token.balanceOf(signer.address);
    console.log(
      chalk.green(`Your token balance: ${hre.ethers.formatUnits(balance, 18)}`)
    );
  } catch (error) {
    console.log(chalk.red("Error getting balance:", error.message));
  }

  console.log(chalk.green("\nVerification completed!"));
  console.log(chalk.blue("\nYou can view your token on Snowtrace:"));
  console.log(
    chalk.blue(`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESS}`)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
  });
