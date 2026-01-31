const { ethers } = require("ethers");
require("dotenv").config();

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RECIPIENT_ADDRESS =
  process.env.RECIPIENT_ADDRESS || "0x0000000000000000000000000000000000000000";

async function testTransfer() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const tokenABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, wallet);
    const decimals = await tokenContract.decimals();

    // Get initial balances
    const senderBalance = await tokenContract.balanceOf(wallet.address);
    const recipientBalance = await tokenContract.balanceOf(RECIPIENT_ADDRESS);

    console.log("\n=== Initial Balances ===");
    console.log(
      `Sender Balance: ${ethers.formatUnits(senderBalance, decimals)}`
    );
    console.log(
      `Recipient Balance: ${ethers.formatUnits(recipientBalance, decimals)}`
    );

    // Transfer 1 token
    const amount = ethers.parseUnits("1", decimals);
    console.log("\nAttempting to transfer 1 token...");

    const tx = await tokenContract.transfer(RECIPIENT_ADDRESS, amount);
    console.log(`Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log("Transaction confirmed!");

    // Get final balances
    const finalSenderBalance = await tokenContract.balanceOf(wallet.address);
    const finalRecipientBalance =
      await tokenContract.balanceOf(RECIPIENT_ADDRESS);

    console.log("\n=== Final Balances ===");
    console.log(
      `Sender Balance: ${ethers.formatUnits(finalSenderBalance, decimals)}`
    );
    console.log(
      `Recipient Balance: ${ethers.formatUnits(finalRecipientBalance, decimals)}`
    );
  } catch (error) {
    console.error("Error testing transfer:", error);
  }
}

testTransfer();
