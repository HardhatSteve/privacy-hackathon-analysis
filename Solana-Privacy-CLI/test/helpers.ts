import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BabyJubJub__factory } from "../typechain-types/factories/contracts/libraries";
import {
    BurnVerifier__factory,
    MintVerifier__factory,
    RegistrationVerifier__factory,
    TransferVerifier__factory,
    WithdrawVerifier__factory,
} from "../typechain-types/factories/contracts/prod";
import {
    BurnCircuitGroth16Verifier__factory,
    MintCircuitGroth16Verifier__factory,
    RegistrationCircuitGroth16Verifier__factory,
    TransferCircuitGroth16Verifier__factory,
    WithdrawCircuitGroth16Verifier__factory,
} from "../typechain-types/factories/contracts/verifiers";

/**
 * Function for deploying verifier contracts for eERC
 * @param signer Hardhat signer for the deployment
 * @param isProd Boolean for prod or dev deployments
 * @returns registrationVerifier - Registration verifier contract address
 * @returns mintVerifier - Mint verifier contract address
 * @returns withdrawVerifier - Withdraw verifier contract address
 * @returns transferVerifier - Transfer verifier contract address
 */
export const deployVerifiers = async (
    signer: SignerWithAddress,
    isProd?: boolean,
) => {
    if (isProd) {
        const registrationVerifierFactory = new RegistrationVerifier__factory([signer] as any);
        const registrationVerifier = await registrationVerifierFactory.deploy();
        await registrationVerifier.waitForDeployment();

        const mintVerifierFactory = new MintVerifier__factory([signer] as any);
        const mintVerifier = await mintVerifierFactory.deploy();
        await mintVerifier.waitForDeployment();

        const withdrawVerifierFactory = new WithdrawVerifier__factory([signer] as any);
        const withdrawVerifier = await withdrawVerifierFactory.deploy();
        await withdrawVerifier.waitForDeployment();

        const transferVerifierFactory = new TransferVerifier__factory([signer] as any);
        const transferVerifier = await transferVerifierFactory.deploy();
        await transferVerifier.waitForDeployment();

        const burnVerifierFactory = new BurnVerifier__factory([signer] as any);
        const burnVerifier = await burnVerifierFactory.deploy();
        await burnVerifier.waitForDeployment();

        return {
            registrationVerifier: registrationVerifier.target.toString(),
            mintVerifier: mintVerifier.target.toString(),
            withdrawVerifier: withdrawVerifier.target.toString(),
            transferVerifier: transferVerifier.target.toString(),
            burnVerifier: burnVerifier.target.toString(),
        };
    }

    // if not provided, deploy generated verifiers
    const registrationVerifierFactory =
        new RegistrationCircuitGroth16Verifier__factory([signer] as any);
    const registrationVerifier = await registrationVerifierFactory.deploy();
    await registrationVerifier.waitForDeployment();

    const mintVerifierFactory = new MintCircuitGroth16Verifier__factory([signer] as any);
    const mintVerifier = await mintVerifierFactory.deploy();
    await mintVerifier.waitForDeployment();

    const withdrawVerifierFactory = new WithdrawCircuitGroth16Verifier__factory(
        [signer] as any,
    );
    const withdrawVerifier = await withdrawVerifierFactory.deploy();
    await withdrawVerifier.waitForDeployment();

    const transferVerifierFactory = new TransferCircuitGroth16Verifier__factory(
        [signer] as any,
    );
    const transferVerifier = await transferVerifierFactory.deploy();
    await transferVerifier.waitForDeployment();

    const burnVerifier = await new BurnCircuitGroth16Verifier__factory(
        [signer] as any,
    ).deploy();
    await burnVerifier.waitForDeployment();

    return {
        registrationVerifier: registrationVerifier.target.toString(),
        mintVerifier: mintVerifier.target.toString(),
        withdrawVerifier: withdrawVerifier.target.toString(),
        transferVerifier: transferVerifier.target.toString(),
        burnVerifier: burnVerifier.target.toString(),
    };
};

/**
 * Function for deploying BabyJubJub library
 * @param signer Hardhat signer for the deployment
 * @returns Deployed BabyJubJub library address
 */
export const deployLibrary = async (signer: SignerWithAddress) => {
    const babyJubJubFactory = new BabyJubJub__factory([signer] as any);
    const babyJubJub = await babyJubJubFactory.deploy();
    await babyJubJub.waitForDeployment();

    return babyJubJub.target.toString();
};

