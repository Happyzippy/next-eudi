// API route for creating verification sessions

import { createSession } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';
import '../../../../lib/session-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { minAge = 18 } = body;
    
    const session = await createSession(minAge);
    
    return NextResponse.json({
      sessionId: session.sessionId,
      expiresAt: session.expiresAt.toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}
