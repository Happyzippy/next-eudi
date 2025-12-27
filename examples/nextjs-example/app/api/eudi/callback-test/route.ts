// Test endpoint to verify callback is working

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[CALLBACK-TEST] Test endpoint hit');
  return NextResponse.json({
    status: 'ok',
    message: 'Callback endpoint is reachable',
    timestamp: new Date().toISOString()
  });
}
