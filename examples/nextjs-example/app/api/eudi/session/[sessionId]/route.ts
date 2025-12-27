// API route for checking session status

import { getSession, deleteSession } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';
import '../../../../../lib/session-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    const response = NextResponse.json({
      status: session.status,
      result: session.result,
      error: session.error
    });
    
    // Clean up completed or failed sessions immediately after returning result
    if (session.status === 'completed' || session.status === 'failed') {
      // Delete in background after response is sent
      try {
        await deleteSession(sessionId);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
