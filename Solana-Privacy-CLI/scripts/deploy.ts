import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const tokenName = process.env.TOKEN_NAME || "Encrypted Token";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "eTOKEN";
  const totalSupply = process.env.TOTAL_SUPPLY || "1000000";
  const initialHolder = process.env.INITIAL_HOLDER || deployer.address;

  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Total Supply:", totalSupply);
  console.log("Initial Holder:", initialHolder);

  const EncryptedERC20 = await ethers.getContractFactory("EncryptedERC20");
  const token = await EncryptedERC20.deploy(
    tokenName,
    tokenSymbol,
    ethers.parseEther(totalSupply),
    initialHolder
  );

  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 