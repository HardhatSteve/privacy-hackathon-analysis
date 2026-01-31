import { NextRequest, NextResponse } from 'next/server'

// Extend timeout for this route (2 minutes)
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    let body: { wallet?: string; limit?: number }
    try {
      const raw = await request.text()
      if (!raw || !raw.trim()) {
        return NextResponse.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }
      body = JSON.parse(raw) as { wallet?: string; limit?: number }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    if (!body?.wallet || typeof body.wallet !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "wallet" field' },
        { status: 400 }
      )
    }

    // In local development, proxy to the Python backend running on localhost
    // In production (Vercel), this route shouldn't be hit (Python function handles it)
    // But if it is, we'll proxy to the Python function
    const isVercel = process.env.VERCEL === '1'
    
    if (isVercel) {
      // In Vercel, try to call the Python serverless function
      // Use the internal Vercel URL or the public URL
      const pythonFunctionUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api/analyze-wallet`
        : 'https://leak-lens.vercel.app/api/analyze-wallet'
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      
      const response = await fetch(pythonFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json(
          { error: errorText || 'Backend error' },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // Local development: proxy to local Python backend
      const backendUrl = 'http://127.0.0.1:8000/analyze-wallet'
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json(
          { error: errorText || 'Backend error' },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    }
    
  } catch (error: any) {
    console.error('API route error:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - analysis took too long' },
        { status: 504 }
      )
    }
    
    // Check for connection refused errors (backend not running)
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: 'Backend server is not running. Please start the Python backend.',
          details: 'Run START_SERVER.bat or python run_server.py to start the backend'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    )
  }
}
