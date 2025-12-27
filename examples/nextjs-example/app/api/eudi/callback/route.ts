// API route for receiving VP from wallet (OIDC4VP callback)

import { getSession, updateSession, verifyAgeWithEudi } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vp_token, state } = body;
    
    if (!vp_token || !state) {
      return NextResponse.json(
        { error: 'vp_token and state required' },
        { status: 400 }
      );
    }
    
    const sessionId = state;
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    // Update status to scanned
    updateSession(sessionId, { status: 'scanned' });
    
    // Verify the presentation
    const result = await verifyAgeWithEudi(vp_token, session.minAge, {
      skipSignatureVerification: true // TESTING ONLY - use proper verification in production
    });
    
    if (result.isOldEnough) {
      // Extract claims from VP for the session
      const vpResult = await import('@emtyg/next-eudi').then(mod => 
        mod.verifyPresentation(vp_token, { skipSignatureVerification: true })
      );
      
      updateSession(sessionId, {
        status: 'completed',
        result: {
          isOldEnough: true,
          claims: vpResult.verifiedClaims || {}
        }
      });
      
      return NextResponse.json({
        status: 'success',
        redirect_uri: `${request.nextUrl.origin}?session=${sessionId}`
      });
    } else {
      updateSession(sessionId, {
        status: 'failed',
        error: 'Age verification failed'
      });
      
      return NextResponse.json(
        { error: 'Age verification failed' },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
