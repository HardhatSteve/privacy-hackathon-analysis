export interface NetworkConfig {
    name: string;
    rpcUrl: string;
    chainId: number;
    gasPrice?: string;
    gasLimit?: number;
}

export interface VerifierConfig {
    address: string;
    type: string;
}

export interface LibraryConfig {
    address: string;
    type: string;
}

export interface DeploymentConfig {
    network: NetworkConfig;
    verifiers: VerifierConfig[];
    library: LibraryConfig;
    mode: "standalone" | "converter";
} 