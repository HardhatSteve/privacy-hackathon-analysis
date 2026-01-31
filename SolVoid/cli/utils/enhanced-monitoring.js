// ============================================================================
// ENHANCED MONITORING SYSTEM
// Real-time monitoring with webhooks and dashboard integration
// ============================================================================

const { Connection, PublicKey } = require('@solana/web3.js');
const fetch = require('cross-fetch');
const EventEmitter = require('events');

class EnhancedMonitoringSystem extends EventEmitter {
  constructor() {
    super();
    
    this.monitoringSessions = new Map();
    this.alertHistory = [];
    this.webhookEndpoints = [];
    this.dashboardData = new Map();
    
    // Monitoring configuration
    this.config = {
      checkInterval: 30000, // 30 seconds
      alertThresholds: {
        transactionCount: 5,    // Alert if >5 transactions in interval
        valueChange: 1000,      // Alert if >$1000 value change
        failedTransactions: 3   // Alert if >3 failed transactions
      },
      retentionPeriod: 86400000, // 24 hours
      maxAlerts: 1000
    };
    
    // Initialize webhook endpoints from environment
    this._initializeWebhooks();
    
    // Start cleanup interval
    setInterval(() => this._cleanupOldData(), 3600000); // Every hour
  }

  /**
   * Start monitoring a rescued wallet
   */
  async startMonitoring(address, options = {}) {
    const addressStr = address.toString();
    
    if (this.monitoringSessions.has(addressStr)) {
      console.log(`  Already monitoring ${addressStr}`);
      return this.monitoringSessions.get(addressStr);
    }
    
    console.log(`  Starting enhanced monitoring for ${addressStr}`);
    
    const session = {
      address: addressStr,
      startTime: Date.now(),
      lastCheck: Date.now(),
      transactionCount: 0,
      totalValue: 0,
      alerts: [],
      status: 'active',
      options: {
        duration: options.duration || 86400000, // 24 hours default
        webhookEnabled: options.webhookEnabled !== false,
        dashboardEnabled: options.dashboardEnabled !== false,
        alertTypes: options.alertTypes || ['transaction', 'value_change', 'threat']
      }
    };
    
    this.monitoringSessions.set(addressStr, session);
    
    // Start monitoring loop
    const interval = setInterval(async () => {
      await this._performHealthCheck(addressStr);
    }, this.config.checkInterval);
    
    session.interval = interval;
    
    // Send initial webhook notification
    await this._sendWebhook({
      type: 'monitoring_started',
      address: addressStr,
      timestamp: Date.now(),
      session: session
    });
    
    // Emit event for dashboard
    this.emit('monitoring_started', session);
    
    return session;
  }

  /**
   * Stop monitoring a wallet
   */
  async stopMonitoring(address) {
    const addressStr = address.toString();
    const session = this.monitoringSessions.get(addressStr);
    
    if (!session) {
      console.log(`  No active monitoring session for ${addressStr}`);
      return null;
    }
    
    // Clear interval
    if (session.interval) {
      clearInterval(session.interval);
    }
    
    // Update session status
    session.status = 'completed';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // Send final webhook notification
    await this._sendWebhook({
      type: 'monitoring_completed',
      address: addressStr,
      timestamp: Date.now(),
      session: session,
      summary: this._generateSessionSummary(session)
    });
    
    // Remove from active sessions
    this.monitoringSessions.delete(addressStr);
    
    console.log(` Stopped monitoring ${addressStr}`);
    
    return session;
  }

  /**
   * Perform health check on monitored address
   */
  async _performHealthCheck(addressStr) {
    const session = this.monitoringSessions.get(addressStr);
    
    if (!session || session.status !== 'active') {
      return;
    }
    
    try {
      const connection = new Connection(CONFIG.RPC_ENDPOINTS[0]);
      const address = new PublicKey(addressStr);
      
      // Get recent signatures
      const signatures = await connection.getSignaturesForAddress(
        address,
        { limit: 20 }
      );
      
      // Get account info
      const accountInfo = await connection.getAccountInfo(address);
      
      // Analyze changes since last check
      const analysis = await this._analyzeChanges(session, signatures, accountInfo);
      
      // Check for alerts
      await this._checkAlertConditions(session, analysis);
      
      // Update dashboard data
      this._updateDashboardData(addressStr, analysis);
      
      // Update session
      session.lastCheck = Date.now();
      session.transactionCount += analysis.newTransactions;
      
    } catch (error) {
      console.error(`Health check failed for ${addressStr}:`, error.message);
      
      // Create error alert
      await this._createAlert({
        type: 'monitoring_error',
        address: addressStr,
        severity: 'medium',
        message: `Health check failed: ${error.message}`,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Analyze changes since last check
   */
  async _analyzeChanges(session, signatures, accountInfo) {
    const newTransactions = signatures.filter(sig => 
      sig.blockTime * 1000 > session.lastCheck
    );
    
    const failedTransactions = newTransactions.filter(sig => sig.err !== null);
    const successfulTransactions = newTransactions.filter(sig => sig.err === null);
    
    // Calculate value changes (simplified)
    let valueChange = 0;
    for (const tx of successfulTransactions.slice(0, 5)) { // Check last 5 successful
      try {
        const connection = new Connection(CONFIG.RPC_ENDPOINTS[0]);
        const txDetails = await connection.getTransaction(tx.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (txDetails && txDetails.meta) {
          valueChange += Math.abs(txDetails.meta.postBalances[0] - txDetails.meta.preBalances[0]);
        }
      } catch (error) {
        // Skip transaction analysis if it fails
      }
    }
    
    return {
      newTransactions: newTransactions.length,
      failedTransactions: failedTransactions.length,
      successfulTransactions: successfulTransactions.length,
      valueChange: valueChange / 1e9, // Convert to SOL
      currentBalance: accountInfo ? accountInfo.lamports : 0,
      lastSignature: signatures[0]?.signature || null
    };
  }

  /**
   * Check alert conditions
   */
  async _checkAlertConditions(session, analysis) {
    const alerts = [];
    
    // Check transaction count threshold
    if (analysis.newTransactions > this.config.alertThresholds.transactionCount) {
      alerts.push({
        type: 'high_activity',
        address: session.address,
        severity: 'medium',
        message: `${analysis.newTransactions} transactions detected in monitoring period`,
        data: analysis,
        timestamp: Date.now()
      });
    }
    
    // Check failed transactions
    if (analysis.failedTransactions > this.config.alertThresholds.failedTransactions) {
      alerts.push({
        type: 'failed_transactions',
        address: session.address,
        severity: 'high',
        message: `${analysis.failedTransactions} failed transactions detected`,
        data: analysis,
        timestamp: Date.now()
      });
    }
    
    // Check value change
    if (analysis.valueChange > this.config.alertThresholds.valueChange / 1e9) {
      alerts.push({
        type: 'value_change',
        address: session.address,
        severity: 'medium',
        message: `Value change of ${analysis.valueChange.toFixed(4)} SOL detected`,
        data: analysis,
        timestamp: Date.now()
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      await this._createAlert(alert);
    }
  }

  /**
   * Create and process alert
   */
  async _createAlert(alert) {
    // Add to session alerts
    const session = this.monitoringSessions.get(alert.address);
    if (session) {
      session.alerts.push(alert);
    }
    
    // Add to global alert history
    this.alertHistory.push(alert);
    
    // Limit alert history size
    if (this.alertHistory.length > this.config.maxAlerts) {
      this.alertHistory = this.alertHistory.slice(-this.config.maxAlerts);
    }
    
    // Send webhook notification
    await this._sendWebhook(alert);
    
    // Emit event
    this.emit('alert', alert);
    
    console.log(` ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
  }

  /**
   * Send webhook notification
   */
  async _sendWebhook(data) {
    if (this.webhookEndpoints.length === 0) {
      return;
    }
    
    const payload = {
      id: this._generateId(),
      timestamp: Date.now(),
      service: 'solvoid-atomic-rescue',
      data: data
    };
    
    // Send to all webhook endpoints
    const promises = this.webhookEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SolVoid-Monitoring/1.0',
            ...endpoint.headers
          },
          body: JSON.stringify(payload),
          timeout: 10000
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return { endpoint: endpoint.url, status: 'success' };
      } catch (error) {
        console.warn(`Webhook failed for ${endpoint.url}:`, error.message);
        return { endpoint: endpoint.url, status: 'error', error: error.message };
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Log webhook results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    if (successful > 0) {
      console.log(` Webhook sent to ${successful}/${this.webhookEndpoints.length} endpoints`);
    }
  }

  /**
   * Update dashboard data
   */
  _updateDashboardData(address, analysis) {
    const currentData = this.dashboardData.get(address) || {
      address,
      history: [],
      currentBalance: 0,
      totalTransactions: 0,
      alerts: []
    };
    
    // Add new data point
    currentData.history.push({
      timestamp: Date.now(),
      balance: analysis.currentBalance,
      transactionCount: analysis.newTransactions,
      valueChange: analysis.valueChange
    });
    
    // Keep only last 100 data points
    if (currentData.history.length > 100) {
      currentData.history = currentData.history.slice(-100);
    }
    
    // Update current state
    currentData.currentBalance = analysis.currentBalance;
    currentData.totalTransactions += analysis.newTransactions;
    currentData.lastUpdate = Date.now();
    
    this.dashboardData.set(address, currentData);
    
    // Emit dashboard update event
    this.emit('dashboard_update', currentData);
  }

  /**
   * Get dashboard data for all monitored addresses
   */
  getDashboardData() {
    return Array.from(this.dashboardData.values());
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    const activeSessions = Array.from(this.monitoringSessions.values());
    const totalAlerts = this.alertHistory.length;
    
    return {
      activeMonitors: activeSessions.length,
      totalAlerts,
      uptime: Date.now() - (this.startTime || Date.now()),
      webhookEndpoints: this.webhookEndpoints.length,
      recentAlerts: this.alertHistory.slice(-10),
      activeSessions: activeSessions.map(s => ({
        address: s.address,
        startTime: s.startTime,
        transactionCount: s.transactionCount,
        alertCount: s.alerts.length,
        status: s.status
      }))
    };
  }

  /**
   * Add webhook endpoint
   */
  addWebhook(url, options = {}) {
    const webhook = {
      url,
      headers: options.headers || {},
      events: options.events || ['*'],
      enabled: options.enabled !== false
    };
    
    this.webhookEndpoints.push(webhook);
    console.log(` Added webhook endpoint: ${url}`);
  }

  /**
   * Remove webhook endpoint
   */
  removeWebhook(url) {
    this.webhookEndpoints = this.webhookEndpoints.filter(w => w.url !== url);
    console.log(`  Removed webhook endpoint: ${url}`);
  }

  /**
   * Generate session summary
   */
  _generateSessionSummary(session) {
    return {
      duration: Date.now() - session.startTime,
      transactionCount: session.transactionCount,
      alertCount: session.alerts.length,
      alertsByType: this._groupAlertsByType(session.alerts),
      alertsBySeverity: this._groupAlertsBySeverity(session.alerts)
    };
  }

  /**
   * Group alerts by type
   */
  _groupAlertsByType(alerts) {
    return alerts.reduce((groups, alert) => {
      groups[alert.type] = (groups[alert.type] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Group alerts by severity
   */
  _groupAlertsBySeverity(alerts) {
    return alerts.reduce((groups, alert) => {
      groups[alert.severity] = (groups[alert.severity] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Initialize webhook endpoints from environment
   */
  _initializeWebhooks() {
    // Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      this.addWebhook(process.env.SLACK_WEBHOOK_URL, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.addWebhook(process.env.DISCORD_WEBHOOK_URL, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Custom webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      this.addWebhook(process.env.ALERT_WEBHOOK_URL, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Clean up old data
   */
  _cleanupOldData() {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    // Clean old alerts
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.timestamp > cutoffTime
    );
    
    // Clean old dashboard data
    for (const [address, data] of this.dashboardData.entries()) {
      data.history = data.history.filter(point => 
        point.timestamp > cutoffTime
      );
      
      if (data.history.length === 0) {
        this.dashboardData.delete(address);
      }
    }
    
    console.log(' Cleaned up old monitoring data');
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Export monitoring data
   */
  exportData() {
    return {
      sessions: Array.from(this.monitoringSessions.values()),
      alerts: this.alertHistory,
      dashboardData: Array.from(this.dashboardData.values()),
      stats: this.getMonitoringStats(),
      exportTime: Date.now()
    };
  }
}

module.exports = { EnhancedMonitoringSystem };
