import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Connection } from '@solana/web3.js';

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();
    
    if (action === 'test') {
      const { publicKey } = params;
      const pubKey = new PublicKey(publicKey);
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const balance = await connection.getBalance(pubKey);
      
      return NextResponse.json({ 
        balance,
        address: pubKey.toBase58(),
        success: true 
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
