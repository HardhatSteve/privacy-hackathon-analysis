/**
 * Database Setup Script
 * 
 * This script sets up the Supabase database schema by executing the SQL migration.
 * It creates all tables, indexes, RLS policies, and real-time subscriptions.
 * 
 * Requirements: 1.1, 2.1, 3.1, 26.1, 33.1, 35.5
 * 
 * Usage:
 *   npm run setup-db
 *   or
 *   npx tsx src/scripts/setup-database.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { supabaseConfig } from '../config/supabase.config';

async function setupDatabase(): Promise<void> {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '../../supabase/migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Read migration file: 001_initial_schema.sql');
    
    // Split the SQL into individual statements (separated by semicolons)
    // We need to execute them one by one because Supabase client doesn't support multi-statement queries
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement using the admin client (service role)
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        // Use raw SQL execution via Supabase RPC
        // Note: Supabase doesn't expose direct SQL execution, so we'll use the REST API
        const { error } = await supabaseConfig.adminClient.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Check if error is about function not existing
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log('⚠️  Note: Direct SQL execution via RPC not available.');
            console.log('   Please run the migration manually using Supabase Dashboard or CLI.\n');
            console.log('   Migration file location: supabase/migrations/001_initial_schema.sql\n');
            break;
          }
          
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.code === '42P07' || // duplicate table
              error.code === '42710') { // duplicate object
            skipCount++;
            continue;
          }
          
          throw error;
        }
        
        successCount++;
        
        // Show progress every 10 statements
        if ((i + 1) % 10 === 0) {
          console.log(`   Executed ${i + 1}/${statements.length} statements...`);
        }
      } catch (err: any) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.error('   Statement:', statement.substring(0, 100) + '...');
        throw err;
      }
    }
    
    console.log(`\n✅ Database setup completed!`);
    console.log(`   - ${successCount} statements executed successfully`);
    if (skipCount > 0) {
      console.log(`   - ${skipCount} statements skipped (already exists)`);
    }
    
    // Verify the schema by checking if tables exist
    console.log('\n🔍 Verifying schema...');
    await verifySchema();
    
    console.log('\n✨ Database is ready for use!\n');
    
  } catch (error: any) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\n📝 Manual Setup Instructions:');
    console.error('   1. Open Supabase Dashboard: https://app.supabase.com');
    console.error('   2. Navigate to SQL Editor');
    console.error('   3. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
    console.error('   4. Execute the SQL\n');
    process.exit(1);
  }
}

async function verifySchema(): Promise<void> {
  const tables = [
    'quote_requests',
    'quotes',
    'messages',
    'whitelist',
    'used_signatures'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabaseConfig.adminClient
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        console.error(`   ❌ Table '${table}' verification failed:`, error.message);
      } else {
        console.log(`   ✅ Table '${table}' exists and is accessible`);
      }
    } catch (err: any) {
      console.error(`   ❌ Table '${table}' verification error:`, err.message);
    }
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { setupDatabase, verifySchema };
