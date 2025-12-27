// API route for OIDC4VP authorization endpoint
// This is what the wallet will call to get the presentation definition

import { getSession, createPresentationDefinition } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';
import '../../../../lib/session-storage';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    console.log('[AUTHORIZE] Request received', {
      sessionId,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    if (!sessionId) {
      console.error('[AUTHORIZE] Missing session_id parameter');
      return NextResponse.json(
        { error: 'session_id parameter required' },
        { status: 400 }
      );
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      console.error('[AUTHORIZE] Session not found', { sessionId });
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }
    
    // Create presentation definition based on session requirements
    const presentationDefinition = createPresentationDefinition(session.minAge);
    
    // OIDC4VP authorization request with all required fields for EUDI wallets
    const authRequest = {
      client_id: 'next-eudi-verifier',
      client_id_scheme: 'redirect_uri', // Required for EUDI wallets
      response_type: 'vp_token',
      response_mode: 'direct_post',
      response_uri: `${request.nextUrl.origin}/api/eudi/callback`,
      nonce: sessionId,
      presentation_definition: presentationDefinition,
      state: sessionId,
      client_metadata: {
        vp_formats: {
          'jwt_vp': {
            alg: ['ES256', 'ES384', 'ES512', 'EdDSA']
          },
          'jwt_vc': {
            alg: ['ES256', 'ES384', 'ES512', 'EdDSA']
          }
        },
        client_name: 'Next EUDI Verifier',
        logo_uri: `${request.nextUrl.origin}/logo.png`
      }
    };
    
    console.log('[AUTHORIZE] Sending auth request', {
      sessionId,
      authRequest: JSON.stringify(authRequest, null, 2)
    });
    
    // Add CORS headers so wallet can fetch this
    return NextResponse.json(authRequest, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('[AUTHORIZE] Error:', error);
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
