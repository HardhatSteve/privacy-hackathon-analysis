// cli/utils/threat-detector.ts
// Threat Detection System
// Detects active threats: drainers, MEV bots, key leaks, etc.

import { Connection, PublicKey } from '@solana/web3.js';

export interface Threat {
  type: 'DRAINER' | 'MEV_BOT' | 'SANDWICH_ATTACK' | 'KEY_LEAK' | 'TRACKING' | 'UNKNOWN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confidence: number; // 0-100
  evidence: any[];
  timestamp: number;
}

export class ThreatDetector {
  private connection: Connection;
  private knownDrainers: Set<string>;
  private knownMEVBots: Set<string>;
  
  constructor(connection: Connection) {
    this.connection = connection;
    
    // Known malicious addresses (would be loaded from database in production)
    this.knownDrainers = new Set([
      // Add known drainer addresses
      '2g7FcZyM8QvPtkVHw7KXs3h9Y9mNv9WKXqBvE4h8pump', // Example
    ]);
    
    this.knownMEVBots = new Set([
      // Add known MEV bot addresses
      // These would be updated regularly
    ]);
  }
  
  /**
   * Scan for active threats
   */
  async scan(address: PublicKey): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    // Run all detection methods in parallel
    const [
      drainerThreats,
      mevThreats,
      keyLeakThreats,
      trackingThreats,
      patternThreats
    ] = await Promise.all([
      this.detectDrainer(address),
      this.detectMEVBot(address),
      this.detectKeyLeak(address),
      this.detectTracking(address),
      this.detectSuspiciousPatterns(address)
    ]);
    
    threats.push(
      ...drainerThreats,
      ...mevThreats,
      ...keyLeakThreats,
      ...trackingThreats,
      ...patternThreats
    );
    
    // Sort by severity
    return threats.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  
  /**
   * Detect active drainer
   */
  private async detectDrainer(address: PublicKey): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    try {
      // Get recent transactions
      const signatures = await this.connection.getSignaturesForAddress(
        address,
        { limit: 10 }
      );
      
      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx) continue;
        
        // Check for interactions with known drainers
        const accounts = tx.transaction.message.getAccountKeys().staticAccountKeys;
        
        for (const account of accounts) {
          const accountStr = account.toBase58();
          
          if (this.knownDrainers.has(accountStr)) {
            threats.push({
              type: 'DRAINER',
              severity: 'CRITICAL',
              description: `Active drainer detected: ${accountStr.slice(0, 8)}...`,
              confidence: 95,
              evidence: [{
                transaction: sig.signature,
                drainerAddress: accountStr,
                timestamp: sig.blockTime
              }],
              timestamp: Date.now()
            });
          }
        }
        
        // Check for suspicious approval patterns
        if (this.isSuspiciousApproval(tx)) {
          threats.push({
            type: 'DRAINER',
            severity: 'HIGH',
            description: 'Suspicious token approval detected',
            confidence: 75,
            evidence: [{ transaction: sig.signature }],
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error detecting drainer:', error);
    }
    
    return threats;
  }
  
  /**
   * Detect MEV bot activity
   */
  private async detectMEVBot(address: PublicKey): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        address,
        { limit: 20 }
      );
      
      // Look for sandwich attack patterns
      const recentTxs = signatures.slice(0, 10);
      let sandwichCount = 0;
      
      for (let i = 0; i < recentTxs.length - 2; i++) {
        const tx1 = recentTxs[i];
        const tx2 = recentTxs[i + 1];
        const tx3 = recentTxs[i + 2];
        
        // Check if transactions are in same block (potential sandwich)
        if (tx1.slot === tx2.slot && tx2.slot === tx3.slot) {
          sandwichCount++;
        }
      }
      
      if (sandwichCount > 2) {
        threats.push({
          type: 'SANDWICH_ATTACK',
          severity: 'HIGH',
          description: `Detected ${sandwichCount} potential sandwich attacks`,
          confidence: 80,
          evidence: [{ pattern: 'same-block-transactions', count: sandwichCount }],
          timestamp: Date.now()
        });
      }
      
      // Check for known MEV bot interactions
      for (const sig of signatures.slice(0, 5)) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx) continue;
        
        const accounts = tx.transaction.message.getAccountKeys().staticAccountKeys;
        
        for (const account of accounts) {
          if (this.knownMEVBots.has(account.toBase58())) {
            threats.push({
              type: 'MEV_BOT',
              severity: 'HIGH',
              description: 'MEV bot interaction detected',
              confidence: 90,
              evidence: [{ transaction: sig.signature }],
              timestamp: Date.now()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error detecting MEV bot:', error);
    }
    
    return threats;
  }
  
  /**
   * Detect potential key leak
   */
  private async detectKeyLeak(address: PublicKey): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    try {
      // Check for unusual transaction patterns that might indicate key compromise
      const signatures = await this.connection.getSignaturesForAddress(
        address,
        { limit: 50 }
      );
      
      if (signatures.length === 0) return threats;
      
      // Analyze transaction frequency
      const recentSigs = signatures.slice(0, 10);
      const timestamps = recentSigs
        .filter(sig => sig.blockTime)
        .map(sig => sig.blockTime!);
      
      if (timestamps.length >= 3) {
        // Check for sudden burst of activity
        const timeDiffs = timestamps.slice(0, -1).map((t, i) => t - timestamps[i + 1]);
        const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        
        // If recent transactions are happening very quickly (< 5 seconds apart)
        if (avgDiff < 5) {
          threats.push({
            type: 'KEY_LEAK',
            severity: 'CRITICAL',
            description: 'Unusual burst of rapid transactions detected (potential key compromise)',
            confidence: 70,
            evidence: [{
              pattern: 'rapid-transactions',
              averageTimeDiff: avgDiff,
              recentCount: recentSigs.length
            }],
            timestamp: Date.now()
          });
        }
      }
      
      // Check for transactions to many different addresses (potential draining)
      const uniqueRecipients = new Set();
      
      for (const sig of recentSigs) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (tx) {
          const accounts = tx.transaction.message.getAccountKeys().staticAccountKeys;
          accounts.forEach(acc => uniqueRecipients.add(acc.toBase58()));
        }
      }
      
      if (uniqueRecipients.size > 8) {
        threats.push({
          type: 'KEY_LEAK',
          severity: 'HIGH',
          description: 'Transactions to many different addresses (potential automated draining)',
          confidence: 65,
          evidence: [{
            pattern: 'multiple-recipients',
            count: uniqueRecipients.size
          }],
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error detecting key leak:', error);
    }
    
    return threats;
  }
  
  /**
   * Detect tracking/surveillance
   */
  private async detectTracking(address: PublicKey): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    try {
      // Check for known surveillance/tracking addresses
      const signatures = await this.connection.getSignaturesForAddress(
        address,
        { limit: 10 }
      );
      
      // In production, this would check against a database of known
      // tracking services, chain analysis firms, etc.
      
      // For now, we can detect patterns like:
      // - Frequent small "dust" transactions (tracking markers)
      // - Interactions with known chain analysis addresses
      
      let dustCount = 0;
      
      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx) continue;
        
        // Check for dust transactions (< 0.001 SOL)
        if (tx.meta?.postBalances && tx.meta?.preBalances) {
          const balanceChanges = tx.meta.postBalances.map((post, i) => 
            Math.abs(post - tx.meta!.preBalances[i])
          );
          
          if (balanceChanges.some(change => change < 1000000 && change > 0)) {
            dustCount++;
          }
        }
      }
      
      if (dustCount > 3) {
        threats.push({
          type: 'TRACKING',
          severity: 'MEDIUM',
          description: 'Multiple dust transactions detected (potential tracking markers)',
          confidence: 60,
          evidence: [{ pattern: 'dust-transactions', count: dustCount }],
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error detecting tracking:', error);
    }
    
    return threats;
  }
  
  /**
   * Detect suspicious transaction patterns
   */
  private async detectSuspiciousPatterns(address: PublicKey): Promise<Threat[]> {
    const threats: Threat[] = [];
    
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        address,
        { limit: 20 }
      );
      
      // Check for failed transactions (might indicate attempted exploits)
      const failedTxs = signatures.filter(sig => sig.err !== null);
      
      if (failedTxs.length > 5) {
        threats.push({
          type: 'UNKNOWN',
          severity: 'MEDIUM',
          description: `${failedTxs.length} failed transactions detected (potential exploit attempts)`,
          confidence: 50,
          evidence: [{ pattern: 'failed-transactions', count: failedTxs.length }],
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error detecting suspicious patterns:', error);
    }
    
    return threats;
  }
  
  /**
   * Check if transaction has suspicious approval
   */
  private isSuspiciousApproval(tx: any): boolean {
    // Check transaction instructions for suspicious patterns
    // In production, this would analyze the instruction data
    
    // Common drainer pattern: Approve max amount then transfer
    // This is a simplified check
    
    return false; // Placeholder
  }
  
  /**
   * Get threat severity color
   */
  static getSeverityColor(severity: Threat['severity']): string {
    switch (severity) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'gray';
    }
  }
}
