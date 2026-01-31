const { ethers } = require("ethers");
require("dotenv").config();

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function testPrivacy() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const tokenABI = [
      "function encryptedBalanceOf(address account) view returns (bytes32)",
      "function encryptedAllowance(address owner, address spender) view returns (bytes32)",
      "function updateEncryptedBalance(address account, bytes32 encryptedBalance)",
      "function updateEncryptedAllowance(address owner, address spender, bytes32 encryptedAllowance)",
    ];

    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, wallet);

    // Test getting encrypted balance
    console.log("\n=== Testing Encrypted Balance ===");
    const encryptedBalance = await tokenContract.encryptedBalanceOf(
      wallet.address
    );
    console.log(`Encrypted Balance: ${encryptedBalance}`);

    // Test updating encrypted balance
    console.log("\n=== Testing Encrypted Balance Update ===");
    const newEncryptedBalance = ethers.encodeBytes32String("test_balance");
    console.log("Attempting to update encrypted balance...");

    const tx = await tokenContract.updateEncryptedBalance(
      wallet.address,
      newEncryptedBalance
    );
    console.log(`Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log("Encrypted balance updated successfully!");

    // Verify new encrypted balance
    const updatedBalance = await tokenContract.encryptedBalanceOf(
      wallet.address
    );
    console.log(`Updated Encrypted Balance: ${updatedBalance}`);

    // Test encrypted allowance
    console.log("\n=== Testing Encrypted Allowance ===");
    const spenderAddress = "0x0000000000000000000000000000000000000001"; // Example spender address
    const encryptedAllowance = await tokenContract.encryptedAllowance(
      wallet.address,
      spenderAddress
    );
    console.log(`Encrypted Allowance: ${encryptedAllowance}`);

    // Test updating encrypted allowance
    console.log("\n=== Testing Encrypted Allowance Update ===");
    const newEncryptedAllowance = ethers.encodeBytes32String("test_allowance");
    console.log("Attempting to update encrypted allowance...");

    const tx2 = await tokenContract.updateEncryptedAllowance(
      wallet.address,
      spenderAddress,
      newEncryptedAllowance
    );
    console.log(`Transaction sent: ${tx2.hash}`);

    await tx2.wait();
    console.log("Encrypted allowance updated successfully!");

    // Verify new encrypted allowance
    const updatedAllowance = await tokenContract.encryptedAllowance(
      wallet.address,
      spenderAddress
    );
    console.log(`Updated Encrypted Allowance: ${updatedAllowance}`);
  } catch (error) {
    console.error("Error testing privacy features:", error);
  }
}

testPrivacy();
