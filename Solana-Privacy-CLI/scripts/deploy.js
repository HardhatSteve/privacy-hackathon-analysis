const hre = require("hardhat");
const chalk = require("chalk");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(
    chalk.blue(`Deploying contracts with account: ${deployer.address}`)
  );

  const Token = await hre.ethers.getContractFactory("EncryptedERC20");
  const token = await Token.deploy(
    process.env.TOKEN_NAME,
    process.env.TOKEN_SYMBOL,
    hre.ethers.parseUnits(process.env.TOTAL_SUPPLY, 18)
  );

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log(chalk.green(`Token deployed to: ${tokenAddress}`));
  console.log(chalk.green(`Token name: ${process.env.TOKEN_NAME}`));
  console.log(chalk.green(`Token symbol: ${process.env.TOKEN_SYMBOL}`));
  console.log(chalk.green(`Total supply: ${process.env.TOTAL_SUPPLY}`));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
  });
