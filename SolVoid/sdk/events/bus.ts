/**
 * SolVoid Event Bus
 * Central event system for real-time forensic telemetry across the SDK.
 */

type EventType =
    | 'SCAN_START'
    | 'SCAN_COMPLETE'
    | 'LEAK_DETECTED'
    | 'TRANSACTION_PARSED'
    | 'PROOF_GENERATED'
    | 'RELAY_BROADCAST'
    | 'COMMITMENT_CREATED'
    | 'WITHDRAWAL_COMPLETE'
    | 'ERROR'
    | 'INFO'
    | 'WARNING';

export interface ForensicEvent {
    type: EventType;
    timestamp: Date;
    message: string;
    data?: Record<string, unknown>;
    hex?: string;
}

type EventCallback = (event: ForensicEvent) => void;

class EventBusClass {
    private listeners: Map<string, Set<EventCallback>> = new Map();
    private globalListeners: Set<EventCallback> = new Set();

    /**
     * Subscribe to a specific event type
     */
    on(type: EventType, callback: EventCallback): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);

        return () => {
            this.listeners.get(type)?.delete(callback);
        };
    }

    /**
     * Subscribe to ALL events (for terminal/logging)
     */
    onAll(callback: EventCallback): () => void {
        this.globalListeners.add(callback);
        return () => {
            this.globalListeners.delete(callback);
        };
    }

    /**
     * Emit an event to all subscribers
     */
    emit(type: EventType, message: string, data?: Record<string, unknown>, hex?: string): void {
        const event: ForensicEvent = {
            type,
            timestamp: new Date(),
            message,
            data,
            hex
        };

        // Notify type-specific listeners
        this.listeners.get(type)?.forEach(cb => cb(event));

        // Notify global listeners
        this.globalListeners.forEach(cb => cb(event));
    }

    /**
     * Helper methods for common event types
     */
    info(message: string, data?: Record<string, unknown>) {
        this.emit('INFO', message, data);
    }

    warn(message: string, data?: Record<string, unknown>) {
        this.emit('WARNING', message, data);
    }

    error(message: string, data?: Record<string, unknown>) {
        this.emit('ERROR', message, data);
    }

    scanStart(address: string) {
        this.emit('SCAN_START', `Initiating forensic scan for ${address.slice(0, 8)}...`, { address });
    }

    scanComplete(address: string, leakCount: number, score: number) {
        this.emit('SCAN_COMPLETE', `Scan complete. ${leakCount} leaks detected. Privacy score: ${score}`, { address, leakCount, score });
    }

    leakDetected(type: string, severity: string, description: string, txSignature?: string) {
        this.emit('LEAK_DETECTED', `${severity} ${type} leak: ${description}`, { type, severity }, txSignature);
    }

    transactionParsed(signature: string, programId: string) {
        this.emit('TRANSACTION_PARSED', `Parsed transaction from ${programId.slice(0, 8)}...`, { signature, programId }, signature);
    }

    proofGenerated(proofType: string) {
        this.emit('PROOF_GENERATED', `ZK-${proofType} proof generated successfully`, { proofType });
    }

    relayBroadcast(nodeCount: number, txid: string) {
        this.emit('RELAY_BROADCAST', `Transaction broadcast via ${nodeCount} shadow nodes`, { nodeCount, txid }, txid);
    }
}

// Singleton export
export const EventBus = new EventBusClass();
