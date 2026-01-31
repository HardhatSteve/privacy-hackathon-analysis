import { HardhatRuntimeEnvironment } from "hardhat/types";

declare module "hardhat/types" {
  interface HardhatRuntimeEnvironment {
    ethers: any;
    deployments: {
      get: (name: string) => Promise<{
        args: any[];
      }>;
    };
  }
}
