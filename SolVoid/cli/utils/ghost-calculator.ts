// cli/utils/ghost-calculator.ts
// Privacy Ghost Score Calculator
// Calculates comprehensive privacy score from existing scan results

import { ScanResult } from '../../sdk/pipeline';

export interface PrivacyBadge {
  badgeType: 'GHOST' | 'SHIELD' | 'PHANTOM' | 'INVISIBLE';
  score: number;
  proofData: string;
  imageUrl: string;
  markdownEmbed: string;
  htmlEmbed: string;
  twitterText: string;
  discordText: string;
}

export interface GhostScore {
  score: number;              // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  ghostLevel: 'Invisible' | 'Translucent' | 'Visible' | 'Exposed' | 'Glass House';
  breakdown: {
    anonymityScore: number;   // Based on Merkle tree usage
    linkageScore: number;     // CEX/DEX links
    patternScore: number;     // Transaction patterns
    volumeScore: number;      // Volume obfuscation
    timingScore: number;      // Timing analysis resistance
  };
  threats: ThreatDetail[];
  recommendations: string[];
}

export interface ThreatDetail {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'CEX_LINK' | 'PATTERN_LEAK' | 'VOLUME_LEAK' | 'TIMING_LEAK' | 'DIRECT_LINK';
  description: string;
  hopCount?: number;          // How many hops to threat
  recommendation: string;
  fixCommand?: string;        // CLI command to fix
}

export class GhostScoreCalculator {
  /**
   * Calculate Ghost Score from existing scan results
   * Non-breaking: uses existing ScanResult data
   */
  static calculate(scanResults: ScanResult[]): GhostScore {
    const breakdown = {
      anonymityScore: this.calculateAnonymityScore(scanResults),
      linkageScore: this.calculateLinkageScore(scanResults),
      patternScore: this.calculatePatternScore(scanResults),
      volumeScore: this.calculateVolumeScore(scanResults),
      timingScore: this.calculateTimingScore(scanResults)
    };

    // Weighted average (linkage is most important)
    const score = Math.round(
      breakdown.anonymityScore * 0.25 +
      breakdown.linkageScore * 0.30 +
      breakdown.patternScore * 0.20 +
      breakdown.volumeScore * 0.15 +
      breakdown.timingScore * 0.10
    );

    return {
      score,
      grade: this.getGrade(score),
      ghostLevel: this.getGhostLevel(score),
      breakdown,
      threats: this.extractThreats(scanResults),
      recommendations: this.generateRecommendations(scanResults, score)
    };
  }

  private static calculateAnonymityScore(results: ScanResult[]): number {
    if (results.length === 0) return 50;

    // Check average privacy score from existing scans
    const avgScore = results.reduce((sum, r) => sum + r.privacyScore, 0) / results.length;
    
    // Use existing privacy score as base
    let score = avgScore;

    // Bonus: Using shielded transactions
    const shieldedCount = results.filter(r => r.privacyScore > 70).length;
    const shieldedRatio = shieldedCount / results.length;
    
    if (shieldedRatio > 0.5) score += 10;
    if (shieldedRatio > 0.8) score += 5;

    return Math.min(100, Math.round(score));
  }

  private static calculateLinkageScore(results: ScanResult[]): number {
    const allLeaks = results.flatMap(r => r.leaks);
    
    // Start at 100, penalize for each leak
    let score = 100;
    
    allLeaks.forEach(leak => {
      const description = leak.description.toLowerCase();
      
      // Heavy penalties for CEX links
      if (description.includes('cex') || description.includes('exchange')) {
        score -= leak.severity === 'CRITICAL' ? 20 : 10;
      }
      
      // Penalties for direct links
      if (description.includes('direct link')) {
        score -= leak.severity === 'CRITICAL' ? 15 : 8;
      }
      
      // Extract hop count and penalize
      const hopMatch = description.match(/(\d+)\s*hop/i);
      if (hopMatch) {
        const hops = parseInt(hopMatch[1]);
        // Closer = worse
        score -= Math.max(0, 20 - hops * 2);
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  private static calculatePatternScore(results: ScanResult[]): number {
    if (results.length < 3) return 70; // Not enough data
    
    let score = 100;
    
    // Check for patterns in existing leaks
    const patternLeaks = results.flatMap(r => r.leaks).filter(leak =>
      leak.description.toLowerCase().includes('pattern')
    );
    
    // Penalize for pattern leaks
    score -= patternLeaks.length * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private static calculateVolumeScore(results: ScanResult[]): number {
    // Check if volume-related leaks exist
    const volumeLeaks = results.flatMap(r => r.leaks).filter(leak =>
      leak.description.toLowerCase().includes('volume') ||
      leak.description.toLowerCase().includes('amount')
    );
    
    let score = 100 - (volumeLeaks.length * 12);
    
    return Math.max(0, Math.min(100, score));
  }

  private static calculateTimingScore(results: ScanResult[]): number {
    // Check for timing-related leaks
    const timingLeaks = results.flatMap(r => r.leaks).filter(leak =>
      leak.description.toLowerCase().includes('timing') ||
      leak.description.toLowerCase().includes('time')
    );
    
    let score = 100 - (timingLeaks.length * 10);
    
    return Math.max(0, Math.min(100, score));
  }

  private static getGrade(score: number): GhostScore['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  private static getGhostLevel(score: number): GhostScore['ghostLevel'] {
    if (score >= 90) return 'Invisible';
    if (score >= 70) return 'Translucent';
    if (score >= 50) return 'Visible';
    if (score >= 30) return 'Exposed';
    return 'Glass House';
  }

  private static extractThreats(results: ScanResult[]): ThreatDetail[] {
    const threats: ThreatDetail[] = [];
    
    results.forEach(result => {
      result.leaks.forEach(leak => {
        // Extract hop count from description if present
        const hopMatch = leak.description.match(/(\d+)\s*hop/i);
        const hopCount = hopMatch ? parseInt(hopMatch[1]) : undefined;
        
        threats.push({
          severity: leak.severity as any,
          category: this.categorizeLeak(leak.description),
          description: leak.description,
          hopCount,
          recommendation: leak.remediation || 'No specific remediation available',
          fixCommand: this.generateFixCommand(leak)
        });
      });
    });
    
    // Sort by severity
    return threats.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private static categorizeLeak(description: string): ThreatDetail['category'] {
    const lower = description.toLowerCase();
    if (lower.includes('cex') || lower.includes('exchange')) return 'CEX_LINK';
    if (lower.includes('direct link')) return 'DIRECT_LINK';
    if (lower.includes('pattern')) return 'PATTERN_LEAK';
    if (lower.includes('volume') || lower.includes('amount')) return 'VOLUME_LEAK';
    if (lower.includes('timing') || lower.includes('time')) return 'TIMING_LEAK';
    return 'CEX_LINK'; // Default
  }

  private static generateFixCommand(leak: any): string | undefined {
    const lower = leak.description.toLowerCase();
    
    if (lower.includes('cex') || lower.includes('exchange')) {
      return 'solvoid-scan shield <amount> --max-anonymity';
    }
    
    if (lower.includes('pattern')) {
      return 'solvoid-scan shield <amount> --randomize-timing';
    }
    
    return undefined;
  }

  private static generateRecommendations(results: ScanResult[], score: number): string[] {
    const recommendations: string[] = [];
    
    // Severity-based recommendations
    if (score < 30) {
      recommendations.push(' CRITICAL: Your wallet is a glass house. Immediate action required!');
      recommendations.push('Use SolVoid shielding for ALL future transactions');
    } else if (score < 50) {
      recommendations.push(' URGENT: Your wallet is heavily exposed. Use SolVoid shielding immediately.');
    } else if (score < 70) {
      recommendations.push('  Your privacy needs improvement. Consider shielding your next transactions.');
    }
    
    // Specific recommendations based on leaks
    const allLeaks = results.flatMap(r => r.leaks);
    
    const cexLeaks = allLeaks.filter(l => 
      l.description.toLowerCase().includes('cex') ||
      l.description.toLowerCase().includes('exchange')
    );
    
    if (cexLeaks.length > 0) {
      recommendations.push(`Found ${cexLeaks.length} CEX link${cexLeaks.length > 1 ? 's' : ''}. Run: solvoid-scan rescue <address>`);
    }
    
    const patternLeaks = allLeaks.filter(l =>
      l.description.toLowerCase().includes('pattern')
    );
    
    if (patternLeaks.length > 0) {
      recommendations.push('Randomize your transaction timing to avoid pattern detection');
      recommendations.push('Vary transaction amounts (avoid round numbers like 1.0 SOL)');
    }
    
    // General best practices
    if (score < 90) {
      recommendations.push('Shield at least 50% of your transactions for baseline privacy');
      recommendations.push('Use different withdrawal addresses each time');
    }
    
    if (score >= 90) {
      recommendations.push(' Excellent privacy! Maintain this by continuing to use SolVoid shielding.');
    }
    
    return recommendations.slice(0, 5); // Max 5 recommendations
  }
}
