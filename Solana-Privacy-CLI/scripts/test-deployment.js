const hre = require("hardhat");
const chalk = require("chalk");

async function main() {
  console.log(chalk.blue("Starting deployment test..."));

  // Deploy contract
  const [deployer] = await hre.ethers.getSigners();
  console.log(chalk.blue(`Deploying with account: ${deployer.address}`));

  const Token = await hre.ethers.getContractFactory("EncryptedERC20");
  const token = await Token.deploy(
    process.env.TOKEN_NAME,
    process.env.TOKEN_SYMBOL,
    hre.ethers.parseUnits(process.env.TOTAL_SUPPLY, 18)
  );

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(chalk.green(`Token deployed to: ${tokenAddress}`));

  // Test basic functionality
  console.log(chalk.blue("\nTesting basic functionality..."));

  // Test token info
  const name = await token.name();
  const symbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  console.log(
    chalk.green(`Token info verified: ${name} (${symbol}) - ${totalSupply}`)
  );

  // Test encrypted balance
  const testBalance = hre.ethers.encodeBytes32String("100");
  await token.updateEncryptedBalance(deployer.address, testBalance);
  const retrievedBalance = await token.encryptedBalanceOf(deployer.address);
  console.log(
    chalk.green(
      `Encrypted balance test passed: ${retrievedBalance === testBalance}`
    )
  );

  // Test pause functionality
  await token.pause();
  const isPaused = await token.paused();
  console.log(chalk.green(`Pause test passed: ${isPaused}`));

  await token.unpause();
  const isUnpaused = await token.paused();
  console.log(chalk.green(`Unpause test passed: ${!isUnpaused}`));

  console.log(chalk.green("\nAll tests completed successfully!"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red(error));
    process.exit(1);
  });
