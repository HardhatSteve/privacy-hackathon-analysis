import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Verifies a contract on Avalanche explorer
 * @param address Contract address to verify
 */
export async function verifyContract(address: string): Promise<void> {
  const hre: HardhatRuntimeEnvironment = require("hardhat");

  try {
    console.log("Verifying contract at:", address);

    // Get constructor arguments from deployment
    const deployment = await hre.deployments.get("PrivERC20");
    const constructorArgs = deployment.args;

    // Verify contract
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });

    console.log("Contract verified successfully");
  } catch (error: any) {
    if (error?.message?.includes("Already Verified")) {
      console.log("Contract is already verified");
    } else {
      throw error;
    }
  }
}
