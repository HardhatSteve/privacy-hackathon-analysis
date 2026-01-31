import {
  PrivacyTransactionInput,
  PrivacyTransactionResult,
  SimulationResult,
  InspectionReport,
  AdapterContext,
  AdapterMetadata
} from './types';

/**
 * The contract that all privacy backend adapters must implement.
 * This ensures the Core SDK can treat different protocols uniformly.
 */
export interface PrivacyAdapter {
  metadata: AdapterMetadata;

  /**
   * Broadcasts a transaction to the network.
   */
  send(input: PrivacyTransactionInput, context: AdapterContext): Promise<PrivacyTransactionResult>;

  /**
   * Verifies success and estimates costs without broadcasting.
   */
  simulate(input: PrivacyTransactionInput, context: AdapterContext): Promise<SimulationResult>;

  /**
   * Reports on potential privacy leakage for a proposed transaction.
   */
  inspect(input: PrivacyTransactionInput, context: AdapterContext): Promise<InspectionReport>;
}

export abstract class BasePrivacyAdapter implements PrivacyAdapter {
  abstract metadata: AdapterMetadata;

  async send(input: PrivacyTransactionInput, context: AdapterContext): Promise<PrivacyTransactionResult> {
    throw new Error("Not implemented");
  }

  async simulate(input: PrivacyTransactionInput, context: AdapterContext): Promise<SimulationResult> {
    throw new Error("Not implemented");
  }

  async inspect(input: PrivacyTransactionInput, context: AdapterContext): Promise<InspectionReport> {
    throw new Error("Not implemented");
  }
}