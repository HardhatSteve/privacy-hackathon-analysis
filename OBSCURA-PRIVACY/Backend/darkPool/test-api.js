import fetch from 'node-fetch';
import WebSocket from 'ws';

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3003';
const API_KEY = 'your-secret-api-key';

// Test user wallet address (replace with actual)
const TEST_USER = 'TestUser1111111111111111111111111111111';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}━━━ ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'yellow');
}

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  logTest('Health Check');

  const { status, data } = await apiRequest('/api/health');

  if (status === 200 && data.success) {
    logSuccess('Server is healthy');
    logInfo(`Timestamp: ${new Date(data.timestamp).toISOString()}`);
    return true;
  } else {
    logError('Health check failed');
    return false;
  }
}

// Test 2: Detailed Health Check
async function testDetailedHealth() {
  logTest('Detailed Health Check');

  const { status, data } = await apiRequest('/api/health/detailed');

  if (status === 200) {
    logSuccess('Detailed health check completed');
    Object.entries(data.health).forEach(([service, health]) => {
      const icon = health === 'healthy' ? '✓' : '✗';
      const color = health === 'healthy' ? 'green' : 'red';
      log(`  ${icon} ${service}: ${health}`, color);
    });
    return true;
  } else {
    logError('Detailed health check failed');
    return false;
  }
}

// Test 3: Submit Buy Order
async function testSubmitBuyOrder() {
  logTest('Submit Buy Order');

  const order = {
    type: 'limit',
    side: 'buy',
    tokenPair: 'SOL/USDC',
    price: '100.50',
    amount: '10.0',
    timeInForce: 'GTC',
    userAddress: TEST_USER
  };

  const { status, data } = await apiRequest('/api/orders/submit', {
    method: 'POST',
    body: JSON.stringify(order)
  });

  if (status === 200 && data.success) {
    logSuccess('Buy order submitted successfully');
    logInfo(`Order ID: ${data.data.order.id}`);
    logInfo(`Status: ${data.data.order.status}`);
    logInfo(`Computation Offset: ${data.data.arcium.computationOffset}`);
    return data.data.order.id;
  } else {
    logError('Failed to submit buy order');
    console.log(data);
    return null;
  }
}

// Test 4: Submit Sell Order
async function testSubmitSellOrder() {
  logTest('Submit Sell Order');

  const order = {
    type: 'limit',
    side: 'sell',
    tokenPair: 'SOL/USDC',
    price: '100.75',
    amount: '5.0',
    timeInForce: 'GTC',
    userAddress: TEST_USER
  };

  const { status, data } = await apiRequest('/api/orders/submit', {
    method: 'POST',
    body: JSON.stringify(order)
  });

  if (status === 200 && data.success) {
    logSuccess('Sell order submitted successfully');
    logInfo(`Order ID: ${data.data.order.id}`);
    logInfo(`Status: ${data.data.order.status}`);
    return data.data.order.id;
  } else {
    logError('Failed to submit sell order');
    return null;
  }
}

// Test 5: Get Order Status
async function testGetOrderStatus(orderId) {
  logTest('Get Order Status');

  if (!orderId) {
    logError('No order ID provided');
    return false;
  }

  const { status, data } = await apiRequest(`/api/orders/${orderId}`);

  if (status === 200 && data.success) {
    logSuccess('Order status retrieved');
    logInfo(`Order ID: ${data.data.id}`);
    logInfo(`Type: ${data.data.type}`);
    logInfo(`Side: ${data.data.side}`);
    logInfo(`Status: ${data.data.status}`);
    logInfo(`Price: ${data.data.price}`);
    logInfo(`Amount: ${data.data.amount}`);
    return true;
  } else {
    logError('Failed to get order status');
    return false;
  }
}

// Test 6: Get User Orders
async function testGetUserOrders() {
  logTest('Get User Orders');

  const { status, data } = await apiRequest(`/api/orders/user/${TEST_USER}`);

  if (status === 200 && data.success) {
    logSuccess(`Retrieved ${data.data.length} orders`);
    data.data.forEach((order, i) => {
      logInfo(`  ${i + 1}. ${order.side} ${order.amount} @ ${order.price || 'market'} - ${order.status}`);
    });
    return true;
  } else {
    logError('Failed to get user orders');
    return false;
  }
}

// Test 7: Get Order Book
async function testGetOrderBook() {
  logTest('Get Order Book');

  const { status, data } = await apiRequest('/api/market/orderbook/SOL/USDC');

  if (status === 200 && data.success) {
    logSuccess('Order book retrieved');
    logInfo(`Bids: ${data.data.bids.length} levels`);
    logInfo(`Asks: ${data.data.asks.length} levels`);
    
    if (data.data.bids.length > 0) {
      logInfo(`Best bid: ${data.data.bids[0].price} (${data.data.bids[0].totalAmount})`);
    }
    if (data.data.asks.length > 0) {
      logInfo(`Best ask: ${data.data.asks[0].price} (${data.data.asks[0].totalAmount})`);
    }
    return true;
  } else {
    logError('Failed to get order book');
    return false;
  }
}

// Test 8: Get Market Stats
async function testGetMarketStats() {
  logTest('Get Market Stats');

  const { status, data } = await apiRequest('/api/market/stats/SOL/USDC');

  if (status === 200 && data.success) {
    logSuccess('Market stats retrieved');
    logInfo(`24h Volume: ${data.data.volume24h}`);
    logInfo(`24h High: ${data.data.high24h}`);
    logInfo(`24h Low: ${data.data.low24h}`);
    return true;
  } else {
    logError('Failed to get market stats');
    return false;
  }
}

// Test 9: Cancel Order
async function testCancelOrder(orderId) {
  logTest('Cancel Order');

  if (!orderId) {
    logError('No order ID provided');
    return false;
  }

  const { status, data } = await apiRequest(`/api/orders/${orderId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userAddress: TEST_USER })
  });

  if (status === 200 && data.success) {
    logSuccess('Order cancelled successfully');
    logInfo(`Order ID: ${data.data.order.id}`);
    logInfo(`Status: ${data.data.order.status}`);
    return true;
  } else {
    logError('Failed to cancel order');
    return false;
  }
}

// Test 10: WebSocket Connection
async function testWebSocket() {
  logTest('WebSocket Connection');

  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let messageCount = 0;

    ws.on('open', () => {
      logSuccess('WebSocket connected');

      // Subscribe to order book
      ws.send(JSON.stringify({
        action: 'subscribe',
        channel: 'orderbook',
        tokenPair: 'SOL/USDC'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      messageCount++;

      if (message.type === 'welcome') {
        logInfo(`Client ID: ${message.clientId}`);
      } else if (message.type === 'subscribed') {
        logSuccess(`Subscribed to ${message.channel}:${message.tokenPair}`);
        
        // Close after successful subscription
        setTimeout(() => {
          ws.close();
        }, 1000);
      } else {
        logInfo(`Received: ${message.type}`);
      }
    });

    ws.on('close', () => {
      logInfo('WebSocket disconnected');
      logSuccess(`Received ${messageCount} messages`);
      resolve(true);
    });

    ws.on('error', (error) => {
      logError(`WebSocket error: ${error.message}`);
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      resolve(messageCount > 0);
    }, 5000);
  });
}

// Test 11: Metrics
async function testMetrics() {
  logTest('System Metrics');

  const { status, data } = await apiRequest('/api/health/metrics');

  if (status === 200 && data.success) {
    logSuccess('Metrics retrieved');
    logInfo(`Total matches: ${data.data.matchingEngine.totalMatches}`);
    logInfo(`Total volume: ${data.data.matchingEngine.totalVolume}`);
    logInfo(`Avg match time: ${data.data.matchingEngine.averageMatchTime.toFixed(2)}ms`);
    logInfo(`Uptime: ${(data.data.uptime / 60).toFixed(2)} minutes`);
    return true;
  } else {
    logError('Failed to get metrics');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('Dark Pool API Test Suite', 'blue');
  console.log('='.repeat(60));

  const results = [];
  let buyOrderId = null;
  let sellOrderId = null;

  // Run tests sequentially
  results.push(await testHealthCheck());
  results.push(await testDetailedHealth());
  
  buyOrderId = await testSubmitBuyOrder();
  results.push(buyOrderId !== null);
  
  sellOrderId = await testSubmitSellOrder();
  results.push(sellOrderId !== null);
  
  // Wait for orders to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push(await testGetOrderStatus(buyOrderId));
  results.push(await testGetUserOrders());
  results.push(await testGetOrderBook());
  results.push(await testGetMarketStats());
  results.push(await testMetrics());
  results.push(await testWebSocket());
  
  // Cancel one order
  if (sellOrderId) {
    results.push(await testCancelOrder(sellOrderId));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  if (passed === total) {
    log(`✓ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`⚠ ${passed}/${total} tests passed (${percentage}%)`, 'yellow');
  }
  console.log('='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
