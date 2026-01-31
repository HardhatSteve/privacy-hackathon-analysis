const { ethers } = require("ethers");
require("dotenv").config();

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;

async function getTokenInfo() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const tokenABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
    ];

    const tokenContract = new ethers.Contract(
      TOKEN_ADDRESS,
      tokenABI,
      provider
    );

    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    const totalSupply = await tokenContract.totalSupply();

    console.log("\n=== Token Information ===");
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(
      `Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`
    );
    console.log(`Contract Address: ${TOKEN_ADDRESS}`);
  } catch (error) {
    console.error("Error getting token info:", error);
  }
}

getTokenInfo();
