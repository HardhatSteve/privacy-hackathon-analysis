// Global type declarations for testing
declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export interface VerificationKey {
    protocol: string;
    curve: string;
    vk_alpha_1: string[];
    vk_beta_2: string[][];
    vk_gamma_2: string[][];
    vk_delta_2: string[][];
    IC: string[][];
  }

  export namespace groth16 {
    function fullProve(
      input: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{ proof: Groth16Proof; publicSignals: string[] }>;
    
    function verify(
      vKey: VerificationKey,
      publicSignals: string[],
      proof: Groth16Proof
    ): Promise<boolean>;
  }
}

declare module 'circomlib' {
  export function poseidon(inputs: bigint[]): bigint;
}

declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<{
    (inputs: bigint[]): bigint;
  }>;
}
