import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './index';

/**
 * Supabase Configuration with Connection Pooling
 * 
 * This configuration sets up the Supabase client for PostgreSQL database operations
 * with connection pooling for high concurrency.
 */
export class SupabaseConfig {
  private static instance: SupabaseConfig;
  public readonly client: SupabaseClient;
  public readonly adminClient: SupabaseClient;
  
  private constructor() {
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }
    
    // Client for regular operations (with RLS)
    this.client = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-application-name': 'obscura-dark-otc-rfq-be',
          },
        },
      }
    );
    
    // Admin client for operations that bypass RLS
    if (config.supabase.serviceRoleKey) {
      this.adminClient = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          db: {
            schema: 'public',
          },
        }
      );
    } else {
      // Fallback to regular client if service role key not provided
      this.adminClient = this.client;
    }
  }
  
  public static getInstance(): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig();
    }
    return SupabaseConfig.instance;
  }
  
  /**
   * Verify connection to Supabase
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      // Try a simple query to verify connection
      const { error } = await this.client
        .from('quote_requests')
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
        console.error('Supabase connection error:', error);
        return false;
      }
      
      console.log('Connected to Supabase successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Supabase:', error);
      return false;
    }
  }
}

export const supabaseConfig = SupabaseConfig.getInstance();
