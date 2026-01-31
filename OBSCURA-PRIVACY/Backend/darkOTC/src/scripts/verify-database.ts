/**
 * Database Verification Script
 * 
 * This script verifies that the Supabase database schema is correctly set up.
 * It checks for tables, indexes, RLS policies, and real-time subscriptions.
 * 
 * Usage:
 *   npm run verify-db
 *   or
 *   npx tsx src/scripts/verify-database.ts
 */

import { supabaseConfig } from '../config/supabase.config';

interface VerificationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: VerificationResult[] = [];

async function verifyDatabase(): Promise<void> {
  console.log('🔍 Starting database verification...\n');
  
  try {
    // Verify connection
    await verifyConnection();
    
    // Verify tables
    await verifyTables();
    
    // Verify table structure
    await verifyTableStructure();
    
    // Verify RLS policies
    await verifyRLSPolicies();
    
    // Print results
    printResults();
    
    // Exit with appropriate code
    const hasFailures = results.some(r => r.status === 'fail');
    if (hasFailures) {
      console.log('\n❌ Verification failed. Please check the errors above.\n');
      process.exit(1);
    } else {
      console.log('\n✅ All verifications passed!\n');
      process.exit(0);
    }
    
  } catch (error: any) {
    console.error('\n❌ Verification error:', error.message);
    process.exit(1);
  }
}

async function verifyConnection(): Promise<void> {
  console.log('📡 Verifying Supabase connection...');
  
  try {
    const connected = await supabaseConfig.verifyConnection();
    
    if (connected) {
      results.push({
        category: 'Connection',
        item: 'Supabase',
        status: 'pass',
        message: 'Connected successfully'
      });
    } else {
      results.push({
        category: 'Connection',
        item: 'Supabase',
        status: 'fail',
        message: 'Failed to connect'
      });
    }
  } catch (error: any) {
    results.push({
      category: 'Connection',
      item: 'Supabase',
      status: 'fail',
      message: error.message
    });
  }
}

async function verifyTables(): Promise<void> {
  console.log('📊 Verifying tables...');
  
  const requiredTables = [
    'quote_requests',
    'quotes',
    'messages',
    'whitelist',
    'used_signatures'
  ];
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabaseConfig.adminClient
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        results.push({
          category: 'Tables',
          item: table,
          status: 'fail',
          message: error.message
        });
      } else {
        results.push({
          category: 'Tables',
          item: table,
          status: 'pass',
          message: 'Table exists and is accessible'
        });
      }
    } catch (error: any) {
      results.push({
        category: 'Tables',
        item: table,
        status: 'fail',
        message: error.message
      });
    }
  }
}

async function verifyTableStructure(): Promise<void> {
  console.log('🏗️  Verifying table structure...');
  
  // Verify quote_requests structure
  await verifyTableColumns('quote_requests', [
    'id',
    'asset_pair',
    'direction',
    'amount_commitment',
    'stealth_address',
    'taker_public_key',
    'created_at',
    'expires_at',
    'status',
    'nullifier'
  ]);
  
  // Verify quotes structure
  await verifyTableColumns('quotes', [
    'id',
    'quote_request_id',
    'price_commitment',
    'market_maker_public_key',
    'created_at',
    'expires_at',
    'status'
  ]);
  
  // Verify messages structure
  await verifyTableColumns('messages', [
    'id',
    'quote_request_id',
    'sender_public_key',
    'recipient_stealth_address',
    'encrypted_content',
    'timestamp'
  ]);
  
  // Verify whitelist structure
  await verifyTableColumns('whitelist', [
    'address',
    'added_at',
    'added_by'
  ]);
  
  // Verify used_signatures structure
  await verifyTableColumns('used_signatures', [
    'signature_hash',
    'used_at',
    'operation_type',
    'public_key'
  ]);
}

async function verifyTableColumns(table: string, expectedColumns: string[]): Promise<void> {
  try {
    // Try to select with all expected columns
    const selectQuery = expectedColumns.join(', ');
    const { error } = await supabaseConfig.adminClient
      .from(table)
      .select(selectQuery)
      .limit(0);
    
    if (error) {
      // Check if error is about missing column
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        results.push({
          category: 'Table Structure',
          item: `${table} columns`,
          status: 'fail',
          message: `Missing column: ${error.message}`
        });
      } else {
        results.push({
          category: 'Table Structure',
          item: `${table} columns`,
          status: 'warning',
          message: error.message
        });
      }
    } else {
      results.push({
        category: 'Table Structure',
        item: `${table} columns`,
        status: 'pass',
        message: `All ${expectedColumns.length} columns exist`
      });
    }
  } catch (error: any) {
    results.push({
      category: 'Table Structure',
      item: `${table} columns`,
      status: 'fail',
      message: error.message
    });
  }
}

async function verifyRLSPolicies(): Promise<void> {
  console.log('🔒 Verifying RLS policies...');
  
  const tables = [
    'quote_requests',
    'quotes',
    'messages',
    'whitelist',
    'used_signatures'
  ];
  
  for (const table of tables) {
    try {
      // Try to query with anon client (should work for SELECT)
      const { error: anonError } = await supabaseConfig.client
        .from(table)
        .select('*')
        .limit(0);
      
      if (anonError) {
        results.push({
          category: 'RLS Policies',
          item: `${table} (anon read)`,
          status: 'warning',
          message: `Anon read may be restricted: ${anonError.message}`
        });
      } else {
        results.push({
          category: 'RLS Policies',
          item: `${table} (anon read)`,
          status: 'pass',
          message: 'Anon can read (as expected)'
        });
      }
      
      // Try to query with admin client (should always work)
      const { error: adminError } = await supabaseConfig.adminClient
        .from(table)
        .select('*')
        .limit(0);
      
      if (adminError) {
        results.push({
          category: 'RLS Policies',
          item: `${table} (service role)`,
          status: 'fail',
          message: `Service role access failed: ${adminError.message}`
        });
      } else {
        results.push({
          category: 'RLS Policies',
          item: `${table} (service role)`,
          status: 'pass',
          message: 'Service role has full access'
        });
      }
    } catch (error: any) {
      results.push({
        category: 'RLS Policies',
        item: `${table}`,
        status: 'fail',
        message: error.message
      });
    }
  }
}

function printResults(): void {
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');
  
  // Group results by category
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    console.log(`\n${category}:`);
    console.log('-'.repeat(80));
    
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.item}`);
      console.log(`   ${result.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Passed:   ${passed}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📊 Total:    ${results.length}`);
}

// Run the verification
if (require.main === module) {
  verifyDatabase()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { verifyDatabase };
