import chalk from 'chalk';
import { GhostScore, PrivacyBadge } from './ghost-calculator';

export class GhostArt {
  static getGhostArt(level: string): string {
    const ghostArt = {
      'Invisible': `
${chalk.cyan('    ')}
${chalk.cyan('                                       ')}
${chalk.cyan('      ') + chalk.white('        .-.\n') + chalk.cyan('  ')}
${chalk.cyan('      ') + chalk.white('       |o_o |\n') + chalk.cyan('  ')}
${chalk.cyan('      ') + chalk.white('       |:_/ |\n') + chalk.cyan('  ')}
${chalk.cyan('      ') + chalk.white('      //   \\ \\  \n') + chalk.cyan('  ')}
${chalk.cyan('      ') + chalk.white('     (|     | ) \n') + chalk.cyan('  ')}
${chalk.cyan('      ') + chalk.white('    /\'|_   _/\'|\\\n') + chalk.cyan('  ')}
${chalk.cyan('      ') + chalk.white('    \\___)-(___/  \n') + chalk.cyan('  ')}
${chalk.cyan('                                       ')}
${chalk.cyan('    ')}

${chalk.green('                INVISIBLE - PERFECT STEALTH ')}
${chalk.gray('              ')}`,
      'Translucent': `
${chalk.blue('    ')}
${chalk.blue('                                       ')}
${chalk.blue('      ') + chalk.gray('        .-.\n') + chalk.blue('  ')}
${chalk.blue('      ') + chalk.gray('       |o_o |\n') + chalk.blue('  ')}
${chalk.blue('      ') + chalk.gray('       |:_/ |\n') + chalk.blue('  ')}
${chalk.blue('      ') + chalk.gray('      //   \\ \\  \n') + chalk.blue('  ')}
${chalk.blue('      ') + chalk.gray('     (|     | ) \n') + chalk.blue('  ')}
${chalk.blue('      ') + chalk.gray('    /\'|_   _/\'|\\\n') + chalk.blue('  ')}
${chalk.blue('      ') + chalk.gray('    \\___)-(___/  \n') + chalk.blue('  ')}
${chalk.blue('                                       ')}
${chalk.blue('    ')}

${chalk.cyan('                TRANSLUCENT - SEMI-STEALTH ')}
${chalk.gray('              ')}`,
      'Visible': `
${chalk.yellow('    ')}
${chalk.yellow('                                       ')}
${chalk.yellow('      ') + chalk.white('        .-.\n') + chalk.yellow('  ')}
${chalk.yellow('      ') + chalk.white('       |o_o |\n') + chalk.yellow('  ')}
${chalk.yellow('      ') + chalk.white('       |:_/ |\n') + chalk.yellow('  ')}
${chalk.yellow('      ') + chalk.white('      //   \\ \\  \n') + chalk.yellow('  ')}
${chalk.yellow('      ') + chalk.white('     (|     | ) \n') + chalk.yellow('  ')}
${chalk.yellow('      ') + chalk.white('    /\'|_   _/\'|\\\n') + chalk.yellow('  ')}
${chalk.yellow('      ') + chalk.white('    \\___)-(___/  \n') + chalk.yellow('  ')}
${chalk.yellow('                                       ')}
${chalk.yellow('    ')}

${chalk.yellow('                VISIBLE - DETECTABLE ')}
${chalk.gray('              ')}`,
      'Exposed': `
${chalk.magenta('    ')}
${chalk.magenta('                                       ')}
${chalk.magenta('      ') + chalk.white('        .-.\n') + chalk.magenta('  ')}
${chalk.magenta('      ') + chalk.white('       |o_o |\n') + chalk.magenta('  ')}
${chalk.magenta('      ') + chalk.white('       |:_/ |\n') + chalk.magenta('  ')}
${chalk.magenta('      ') + chalk.white('      //   \\ \\  \n') + chalk.magenta('  ')}
${chalk.magenta('      ') + chalk.white('     (|     | ) \n') + chalk.magenta('  ')}
${chalk.magenta('      ') + chalk.white('    /\'|_   _/\'|\\\n') + chalk.magenta('  ')}
${chalk.magenta('      ') + chalk.white('    \\___)-(___/  \n') + chalk.magenta('  ')}
${chalk.magenta('                                       ')}
${chalk.magenta('    ')}

${chalk.red('                EXPOSED - HIGH RISK ')}
${chalk.gray('              ')}`,
      'Glass House': `
${chalk.red('    ')}
${chalk.red('      ') + chalk.bgRed('  CRITICAL PRIVACY BREACH  ') + chalk.red('  ')}
${chalk.red('                                       ')}
${chalk.red('      ') + chalk.white('        .-.\n') + chalk.red('  ')}
${chalk.red('      ') + chalk.white('       |x_x |\n') + chalk.red('  ')}
${chalk.red('      ') + chalk.white('       |:_/ |\n') + chalk.red('  ')}
${chalk.red('      ') + chalk.white('      //   \\ \\  \n') + chalk.red('  ')}
${chalk.red('      ') + chalk.white('     (|     | ) \n') + chalk.red('  ')}
${chalk.red('      ') + chalk.white('    /\'|_   _/\'|\\\n') + chalk.red('  ')}
${chalk.red('      ') + chalk.white('    \\___)-(___/  \n') + chalk.red('  ')}
${chalk.red('                                       ')}
${chalk.red('    ')}

${chalk.bgRed.white('                GLASS HOUSE - ZERO PRIVACY ')}
${chalk.red('              ')}`
    };

    return ghostArt[level as keyof typeof ghostArt] || ghostArt['Visible'];
  }

  static getProgressBar(score: number, total: number = 100): string {
    const filledBlocks = Math.round((score / total) * 20);
    const emptyBlocks = 20 - filledBlocks;
    const filled = '#'.repeat(filledBlocks);
    const empty = '-'.repeat(emptyBlocks);

    let color = chalk.green;
    if (score < 40) color = chalk.red;
    else if (score < 60) color = chalk.yellow;
    else if (score < 80) color = chalk.blue;
    else if (score < 90) color = chalk.cyan;

    return color(filled) + chalk.gray(empty);
  }

  static getHeader(): string {
    return `
${chalk.cyan('')}
${chalk.cyan('')}                                                                                              ${chalk.cyan('')}
${chalk.cyan('')} ${chalk.white.bold('  PRIVACY GHOST SCORE - SOLANA PRIVACY ANALYSIS ')}                                               ${chalk.cyan('')}
${chalk.cyan('')}                                                                                              ${chalk.cyan('')}
${chalk.cyan('')}`;
  }

  static getFooter(): string {
    return `
${chalk.gray('')}
${chalk.gray('')} ${chalk.white.bold(' ANALYSIS COMPLETE - PRIVACY ASSESSMENT REPORT ')}                                               ${chalk.gray('')}
${chalk.gray('')}`;
  }

  static formatScore(score: GhostScore): string {
    const art = this.getGhostArt(score.ghostLevel);
    const progressBar = this.getProgressBar(score.score);

    let gradeColor = chalk.green;
    if (score.grade === 'F' || score.grade === 'D') gradeColor = chalk.red;
    else if (score.grade === 'C') gradeColor = chalk.yellow;
    else if (score.grade === 'B') gradeColor = chalk.blue;
    else if (score.grade === 'A') gradeColor = chalk.cyan;
    else if (score.grade === 'A+') gradeColor = chalk.magenta;

    let levelColor = chalk.green;
    if (score.ghostLevel === 'Glass House' || score.ghostLevel === 'Exposed') levelColor = chalk.red;
    else if (score.ghostLevel === 'Visible') levelColor = chalk.yellow;
    else if (score.ghostLevel === 'Translucent') levelColor = chalk.blue;
    else if (score.ghostLevel === 'Invisible') levelColor = chalk.cyan;

    return `
${art}

${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.bold('OVERALL PRIVACY SCORE:')} ${progressBar} ${chalk.bold.white(score.score + '/100')} ${' '.repeat(45 - score.score.toString().length)} ${chalk.white.bold('')}
${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.bold('GRADE:')} ${gradeColor.bold(score.grade)} ${' '.repeat(8)} ${chalk.bold('STATUS:')} ${levelColor.bold(score.ghostLevel)} ${' '.repeat(35 - score.ghostLevel.length)} ${chalk.white.bold('')}
${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.bold('PRIVACY METRICS BREAKDOWN:')} ${' '.repeat(45)} ${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.cyan(' Anonymity:')}    ${this.getProgressBar(score.breakdown.anonymityScore)} ${chalk.white(score.breakdown.anonymityScore + '%')} ${' '.repeat(38)} ${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.blue(' Linkage:')}      ${this.getProgressBar(score.breakdown.linkageScore)} ${chalk.white(score.breakdown.linkageScore + '%')} ${' '.repeat(40)} ${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.yellow(' Pattern:')}      ${this.getProgressBar(score.breakdown.patternScore)} ${chalk.white(score.breakdown.patternScore + '%')} ${' '.repeat(40)} ${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.magenta(' Volume:')}       ${this.getProgressBar(score.breakdown.volumeScore)} ${chalk.white(score.breakdown.volumeScore + '%')} ${' '.repeat(41)} ${chalk.white.bold('')}
${chalk.white.bold('')} ${chalk.green(' Timing:')}       ${this.getProgressBar(score.breakdown.timingScore)} ${chalk.white(score.breakdown.timingScore + '%')} ${' '.repeat(41)} ${chalk.white.bold('')}
${chalk.white.bold('')}`;
  }

  static formatThreats(threats: any[]): string {
    if (threats.length === 0) {
      return `
${chalk.green('')}
${chalk.green('')} ${chalk.white.bold(' EXCELLENT: No privacy threats detected - Your wallet is secure!')} ${' '.repeat(30)} ${chalk.green('')}
${chalk.green('')}`;
    }

    let output = `
${chalk.yellow('')}
${chalk.yellow('')} ${chalk.white.bold('  PRIVACY THREATS DETECTED - ACTION REQUIRED')} ${' '.repeat(40)} ${chalk.yellow('')}
${chalk.yellow('')}

`;

    threats.forEach((threat, index) => {
      let severityColor = chalk.red;
      let severityIcon = '';
      if (threat.severity === 'HIGH') {
        severityColor = chalk.yellow;
        severityIcon = '';
      } else if (threat.severity === 'MEDIUM') {
        severityColor = chalk.blue;
        severityIcon = '';
      } else if (threat.severity === 'LOW') {
        severityColor = chalk.gray;
        severityIcon = '';
      }

      output += `${chalk.white('[' + (index + 1) + '] ' + severityColor(severityIcon + ' ' + threat.severity + ' ' + threat.category) + ']')}
${chalk.white('')} ${chalk.white(threat.description)} ${' '.repeat(85 - threat.description.length)} ${chalk.white('')}
${chalk.white('')} ${chalk.gray(' Impact: ' + threat.recommendation)} ${' '.repeat(75 - threat.recommendation.length)} ${chalk.white('')}`;

      if (threat.hopCount) {
        output += `
${chalk.white('')} ${chalk.yellow(' Network Analysis: ' + threat.hopCount + ' hop-links to exchange found')} ${' '.repeat(50)} ${chalk.white('')}`;
      }

      if (threat.fixCommand) {
        output += `
${chalk.white('')} ${chalk.cyan(' Solution: ' + threat.fixCommand)} ${' '.repeat(75 - threat.fixCommand.length)} ${chalk.white('')}`;
      }

      output += `
${chalk.white('')}

`;
    });

    return output;
  }

  static formatRecommendations(recommendations: string[]): string {
    if (recommendations.length === 0) {
      return '';
    }

    let output = `
${chalk.cyan('')}
${chalk.cyan('')} ${chalk.white.bold(' PRIVACY IMPROVEMENT RECOMMENDATIONS')} ${' '.repeat(50)} ${chalk.cyan('')}
${chalk.cyan('')}

`;

    recommendations.forEach((rec, index) => {
      output += `${chalk.white('[' + (index + 1) + ']  RECOMMENDATION]')}
${chalk.white('')} ${chalk.white(rec)} ${' '.repeat(95 - rec.length)} ${chalk.white('')}
${chalk.white('')}

`;
    });

    return output;
  }

  static formatGhostScore(score: GhostScore): string {
    const header = this.getHeader();
    const scoreDisplay = this.formatScore(score);
    const footer = this.getFooter();
    const threats = this.formatThreats(score.threats);
    const recommendations = this.formatRecommendations(score.recommendations);

    return `${header}${scoreDisplay}

${footer}

${threats}${recommendations}`;
  }

  static formatJson(score: GhostScore): string {
    return JSON.stringify(score, null, 2);
  }

  static formatBadge(badge: PrivacyBadge): string {
    let badgeColor = chalk.green;
    if (badge.badgeType === 'GHOST') badgeColor = chalk.gray;
    else if (badge.badgeType === 'SHIELD') badgeColor = chalk.blue;
    else if (badge.badgeType === 'PHANTOM') badgeColor = chalk.magenta;
    else if (badge.badgeType === 'INVISIBLE') badgeColor = chalk.cyan;

    return `
${badgeColor('')}
${badgeColor('')} ${chalk.white.bold('  PRIVACY BADGE GENERATED - SHARE YOUR PRIVACY SCORE')} ${' '.repeat(35)} ${badgeColor('')}
${badgeColor('')}

${chalk.white('')}
${chalk.white('')} ${chalk.bold('BADGE TYPE:')} ${badgeColor.bold(badge.badgeType)} ${' '.repeat(8)} ${chalk.bold('SCORE:')} ${chalk.white.bold(badge.score.toString())} ${' '.repeat(40)} ${chalk.white('')}
${chalk.white('')} ${chalk.bold('PROOF HASH:')} ${chalk.gray(badge.proofData.substring(0, 20) + '...')} ${' '.repeat(45)} ${chalk.white('')}
${chalk.white('')}

${chalk.cyan('')}
${chalk.cyan('')} ${chalk.white.bold(' SHAREABLE LINKS & EMBED CODES')} ${' '.repeat(55)} ${chalk.cyan('')}
${chalk.cyan('')}

${chalk.white(' MARKDOWN EMBED ')}
${chalk.white('')} ${chalk.cyan(badge.markdownEmbed)} ${chalk.white('')}
${chalk.white('')}

${chalk.white(' HTML EMBED ')}
${chalk.white('')} ${chalk.cyan(badge.htmlEmbed)} ${chalk.white('')}
${chalk.white('')}

${chalk.blue('')}
${chalk.blue('')} ${chalk.white.bold(' SOCIAL MEDIA READY CONTENT')} ${' '.repeat(60)} ${chalk.blue('')}
${chalk.blue('')}

${chalk.white(' TWITTER POST ')}
${chalk.white('')} ${chalk.blue(badge.twitterText)} ${chalk.white('')}
${chalk.white('')}

${chalk.white(' DISCORD POST ')}
${chalk.white('')} ${chalk.blue(badge.discordText)} ${chalk.white('')}
${chalk.white('')}`;
  }
}
