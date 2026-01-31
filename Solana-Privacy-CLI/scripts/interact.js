const hre = require("hardhat");
const chalk = require("chalk");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log(chalk.blue(`Using account: ${owner.address}`));

  // Get the contract instance
  const Token = await hre.ethers.getContractFactory("EncryptedERC20");
  const token = Token.attach("0x6271b63f144Bf5A535f8128707e6b23DA414fF53");

  // Test basic information
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();

  console.log(chalk.green(`Token Name: ${name}`));
  console.log(chalk.green(`Token Symbol: ${symbol}`));
  console.log(
    chalk.green(`Total Supply: ${hre.ethers.formatUnits(totalSupply, 18)}`)
  );

  // Test encrypted operations
  const sampleEncryptedBalance = hre.ethers.encodeBytes32String("test_balance");
  await token.updateEncryptedBalance(owner.address, sampleEncryptedBalance);
  console.log(chalk.green("Updated encrypted balance"));

  const encryptedBalance = await token.encryptedBalanceOf(owner.address);
  console.log(
    chalk.green(
      `Encrypted Balance: ${hre.ethers.decodeBytes32String(encryptedBalance)}`
    )
  );

  // Test pause functionality
  await token.pause();
  console.log(chalk.yellow("Token paused"));

  await token.unpause();
  console.log(chalk.green("Token unpaused"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
  });
