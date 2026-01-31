import { ethers } from "ethers";

export interface EncryptedERC {
  // Token interface methods
  balanceOf(account: string): Promise<bigint>;
  balanceOfStandalone(account: string): Promise<any>;
  transfer(
    to: string, 
    memo: bigint,
    proof: any,
    senderBalancePCT: bigint[]
  ): Promise<ethers.ContractTransaction>;
  connect(signer: ethers.Signer): EncryptedERC;
  getUserPublicKey(user: string): Promise<[bigint, bigint]>;
  auditorPublicKey(): Promise<[bigint, bigint]>;
  privateMint(recipient: string, proof: any): Promise<ethers.ContractTransaction>;
  privateBurn(proof: any, userBalancePCT: bigint[]): Promise<ethers.ContractTransaction>;
  withdraw(
    recipient: string, 
    proof: any, 
    userBalancePCT: bigint[]
  ): Promise<ethers.ContractTransaction>;
}

