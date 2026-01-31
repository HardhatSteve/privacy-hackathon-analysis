// ============================================================================
// DASHBOARD API SERVER
// Real-time dashboard for monitoring atomic rescue operations
// ============================================================================

const express = require('express');
const cors = require('cors');
const { EnhancedMonitoringSystem } = require('./enhanced-monitoring');
const { AtomicRescueEngine } = require('./atomic-rescue-engine');

class DashboardServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.monitoringSystem = new EnhancedMonitoringSystem();
    this.rescueEngine = new AtomicRescueEngine();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('dashboard/dist'));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0'
      });
    });

    // Get monitoring statistics
    this.app.get('/api/monitoring/stats', (req, res) => {
      try {
        const stats = this.monitoringSystem.getMonitoringStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get dashboard data
    this.app.get('/api/dashboard/data', (req, res) => {
      try {
        const data = this.monitoringSystem.getDashboardData();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get alert history
    this.app.get('/api/alerts', (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const alerts = this.monitoringSystem.alertHistory.slice(-limit);
        res.json(alerts);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Start monitoring
    this.app.post('/api/monitoring/start', async (req, res) => {
      try {
        const { address, options } = req.body;
        
        if (!address) {
          return res.status(400).json({ error: 'Address is required' });
        }
        
        const session = await this.monitoringSystem.startMonitoring(address, options);
        res.json(session);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Stop monitoring
    this.app.post('/api/monitoring/stop', async (req, res) => {
      try {
        const { address } = req.body;
        
        if (!address) {
          return res.status(400).json({ error: 'Address is required' });
        }
        
        const session = await this.monitoringSystem.stopMonitoring(address);
        res.json(session);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Execute rescue
    this.app.post('/api/rescue/execute', async (req, res) => {
      try {
        const { privateKey, safeAddress, usePrivacy, monitoringOptions } = req.body;
        
        if (!privateKey || !safeAddress) {
          return res.status(400).json({ 
            error: 'Private key and safe address are required' 
          });
        }
        
        // Convert private key to Keypair
        const { Keypair } = require('@solana/web3.js');
        const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));
        const { PublicKey } = require('@solana/web3.js');
        const recipient = new PublicKey(safeAddress);
        
        // Start monitoring if requested
        if (monitoringOptions?.enabled) {
          await this.monitoringSystem.startMonitoring(recipient, monitoringOptions);
        }
        
        // Execute rescue
        const result = await this.rescueEngine.executeAtomicRescue(
          keypair,
          recipient,
          usePrivacy !== false,
          (alert) => {
            // Forward alerts to monitoring system
            this.monitoringSystem._createAlert({
              ...alert,
              type: 'rescue_alert',
              address: recipient.toString()
            });
          }
        );
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get rescue history
    this.app.get('/api/rescue/history', (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 20;
        // This would typically come from a database
        res.json([]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add webhook endpoint
    this.app.post('/api/webhooks/add', (req, res) => {
      try {
        const { url, options } = req.body;
        
        if (!url) {
          return res.status(400).json({ error: 'URL is required' });
        }
        
        this.monitoringSystem.addWebhook(url, options);
        res.json({ message: 'Webhook added successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Remove webhook endpoint
    this.app.delete('/api/webhooks/:url', (req, res) => {
      try {
        const { url } = req.params;
        this.monitoringSystem.removeWebhook(decodeURIComponent(url));
        res.json({ message: 'Webhook removed successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Export data
    this.app.get('/api/export', (req, res) => {
      try {
        const data = this.monitoringSystem.exportData();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve dashboard frontend
    this.app.get('*', (req, res) => {
      res.sendFile('dashboard/dist/index.html', { root: '.' });
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  setupWebSocket() {
    const WebSocket = require('ws');
    this.wss = new WebSocket.Server({ port: this.port + 1 });
    
    this.wss.on('connection', (ws) => {
      console.log(' Dashboard client connected');
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          stats: this.monitoringSystem.getMonitoringStats(),
          dashboardData: this.monitoringSystem.getDashboardData()
        }
      }));
      
      // Handle messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      // Handle disconnect
      ws.on('close', () => {
        console.log(' Dashboard client disconnected');
      });
    });
    
    // Forward monitoring events to WebSocket clients
    this.monitoringSystem.on('alert', (alert) => {
      this.broadcastToClients({
        type: 'alert',
        data: alert
      });
    });
    
    this.monitoringSystem.on('dashboard_update', (data) => {
      this.broadcastToClients({
        type: 'dashboard_update',
        data
      });
    });
    
    console.log(` WebSocket server listening on port ${this.port + 1}`);
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'subscribe_alerts':
        ws.subscribedToAlerts = true;
        break;
        
      case 'subscribe_dashboard':
        ws.subscribedToDashboard = true;
        break;
        
      case 'get_stats':
        ws.send(JSON.stringify({
          type: 'stats',
          data: this.monitoringSystem.getMonitoringStats()
        }));
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToClients(message) {
    const messageStr = JSON.stringify(message);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Check subscription filters
        if (message.type === 'alert' && client.subscribedToAlerts) {
          client.send(messageStr);
        } else if (message.type === 'dashboard_update' && client.subscribedToDashboard) {
          client.send(messageStr);
        }
      }
    });
  }

  /**
   * Start the server
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(` Dashboard server running on port ${this.port}`);
      console.log(` Dashboard available at http://localhost:${this.port}`);
      console.log(` WebSocket server running on port ${this.port + 1}`);
    });
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.wss) {
      this.wss.close();
    }
    
    // Stop all monitoring sessions
    const sessions = Array.from(this.monitoringSystem.monitoringSessions.keys());
    for (const address of sessions) {
      this.monitoringSystem.stopMonitoring(address);
    }
    
    console.log(' Dashboard server stopped');
  }
}

module.exports = { DashboardServer };
