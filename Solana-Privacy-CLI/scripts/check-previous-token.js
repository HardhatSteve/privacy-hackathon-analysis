const hre = require("hardhat");
const chalk = require("chalk");

async function main() {
  const PREVIOUS_CONTRACT_ADDRESS =
    "0x4EA8F309e675c3941022b71f32e02a780C1848BA";

  console.log(chalk.blue("Checking previous deployed token..."));

  // Connect to the deployed contract
  const [signer] = await hre.ethers.getSigners();
  const Token = await hre.ethers.getContractFactory("EncryptedERC20");
  const token = Token.attach(PREVIOUS_CONTRACT_ADDRESS);

  console.log(
    chalk.blue(`Connected to contract at: ${PREVIOUS_CONTRACT_ADDRESS}`)
  );
  console.log(chalk.blue(`Using account: ${signer.address}`));

  // Check Token Info
  console.log(chalk.yellow("\n1. Token Information:"));
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
    console.log(chalk.red("Error getting token info:", error.message));
  }

  // Check Contract State
  console.log(chalk.yellow("\n2. Contract State:"));
  try {
    const isPaused = await token.paused();
    const owner = await token.owner();
    console.log(
      chalk.green(`Contract Status: ${isPaused ? "Paused" : "Active"}`)
    );
    console.log(chalk.green(`Contract Owner: ${owner}`));
    console.log(
      chalk.green(
        `Is current signer owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`
      )
    );
  } catch (error) {
    console.log(chalk.red("Error getting contract state:", error.message));
  }

  // Check Encrypted Balance
  console.log(chalk.yellow("\n3. Encrypted Balance:"));
  try {
    const balance = await token.encryptedBalanceOf(signer.address);
    console.log(chalk.green(`Your encrypted balance: ${balance}`));
  } catch (error) {
    console.log(chalk.red("Error getting encrypted balance:", error.message));
  }

  // Check Recent Events
  console.log(chalk.yellow("\n4. Recent Events:"));
  try {
    const filter = token.filters.EncryptedBalanceUpdated();
    const events = await token.queryFilter(filter, -10000);
    console.log(chalk.green(`Recent balance updates: ${events.length}`));
    if (events.length > 0) {
      console.log(chalk.green("Last update:"));
      console.log(
        chalk.green(`- Account: ${events[events.length - 1].args.account}`)
      );
      console.log(
        chalk.green(
          `- Encrypted Balance: ${events[events.length - 1].args.encryptedBalance}`
        )
      );
    }
  } catch (error) {
    console.log(chalk.red("Error getting events:", error.message));
  }

  console.log(chalk.green("\nCheck completed!"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
  });
