import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('Testing OBSCURA Compliance API\n');

  // Test 1: Health check
  try {
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✓ Health:', health.data);
  } catch (error) {
    console.log('✗ Health check failed:', error.message);
    console.log('Error details:', error.code, error.errno);
  }

  // Test 2: Batch compliance check
  try {
    console.log('\n2. Testing batch compliance check...');
    const checkResponse = await axios.post(`${BASE_URL}/api/v1/addresses/check`, {
      addresses: [
        { network: 'ethereum', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' },
        { network: 'solana', address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin' }
      ]
    });
    console.log('✓ Compliance check results:');
    console.log(JSON.stringify(checkResponse.data, null, 2));
  } catch (error) {
    console.log('✗ Compliance check failed:', error.response?.data || error.message);
  }

  // Test 3: Search addresses
  try {
    console.log('\n3. Testing address search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/v1/addresses/search`, {
      params: { networks: 'ethereum', status: 'malicious' }
    });
    console.log('✓ Search results (first 2):');
    console.log(JSON.stringify(searchResponse.data.items?.slice(0, 2), null, 2));
  } catch (error) {
    console.log('✗ Search failed:', error.response?.data || error.message);
  }

  // Test 4: Get address stats
  try {
    console.log('\n4. Testing address stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/v1/addresses/stats`, {
      params: { 
        network: 'ethereum', 
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' 
      }
    });
    console.log('✓ Address stats:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
  } catch (error) {
    console.log('✗ Stats failed:', error.response?.data || error.message);
  }

  console.log('\n✅ API testing complete!');
}

testAPI();
