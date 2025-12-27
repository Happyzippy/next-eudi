// API route for OIDC4VP authorization endpoint
// This is what the wallet will call to get the presentation definition

import { getSession, createPresentationDefinition } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';
import '../../../../lib/session-storage';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id parameter required' },
        { status: 400 }
      );
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    // Create presentation definition based on session requirements
    const presentationDefinition = createPresentationDefinition(session.minAge);
    
    // OIDC4VP authorization request
    const authRequest = {
      client_id: 'next-eudi-verifier',
      response_type: 'vp_token',
      response_mode: 'direct_post',
      response_uri: `${request.nextUrl.origin}/api/eudi/callback`,
      nonce: sessionId,
      presentation_definition: presentationDefinition,
      state: sessionId
    };
    
    // Add CORS headers so wallet can fetch this
    return NextResponse.json(authRequest, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
