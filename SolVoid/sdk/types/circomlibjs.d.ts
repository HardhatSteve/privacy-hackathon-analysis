// Type declarations for circomlibjs
declare module 'circomlibjs' {
  export function buildPoseidon(): Promise<any>;
  export function buildMimcSponge(): Promise<any>;
  export function buildEddsa(): Promise<any>;
  export function buildBabyJub(): Promise<any>;
  export function buildPedersenHash(): Promise<any>;
  export function buildEcdh(): Promise<any>;
  export function buildEcdhKem(): Promise<any>;
}
