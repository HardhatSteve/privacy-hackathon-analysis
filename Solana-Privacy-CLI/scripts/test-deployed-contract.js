const hre = require("hardhat");
const chalk = require("chalk");

async function main() {
  const CONTRACT_ADDRESS = "0x4EA8F309e675c3941022b71f32e02a780C1848BA";

  console.log(chalk.blue("Testing existing deployed contract..."));

  // Connect to the deployed contract
  const [signer] = await hre.ethers.getSigners();
  const Token = await hre.ethers.getContractFactory("EncryptedERC20");
  const token = Token.attach(CONTRACT_ADDRESS);

  console.log(chalk.blue(`Connected to contract at: ${CONTRACT_ADDRESS}`));
  console.log(chalk.blue(`Using account: ${signer.address}`));

  // Test 1: Basic Token Info
  console.log(chalk.yellow("\n1. Checking Token Info:"));
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  console.log(chalk.green(`Token Name: ${name}`));
  console.log(chalk.green(`Token Symbol: ${symbol}`));
  console.log(
    chalk.green(`Total Supply: ${hre.ethers.formatUnits(totalSupply, 18)}`)
  );

  // Test 2: Check Encrypted Balance
  console.log(chalk.yellow("\n2. Checking Encrypted Balance:"));
  try {
    const balance = await token.encryptedBalanceOf(signer.address);
    console.log(chalk.green(`Current encrypted balance: ${balance}`));
  } catch (error) {
    console.log(chalk.red("Error checking encrypted balance:", error.message));
  }

  // Test 3: Check Pause Status
  console.log(chalk.yellow("\n3. Checking Contract Status:"));
  try {
    const isPaused = await token.paused();
    console.log(
      chalk.green(`Contract is currently ${isPaused ? "paused" : "active"}`)
    );
  } catch (error) {
    console.log(chalk.red("Error checking pause status:", error.message));
  }

  // Test 4: Check Owner
  console.log(chalk.yellow("\n4. Checking Contract Owner:"));
  const owner = await token.owner();
  console.log(chalk.green(`Contract owner: ${owner}`));
  console.log(
    chalk.green(
      `Is current signer owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`
    )
  );

  console.log(chalk.green("\nAll checks completed!"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
  });
