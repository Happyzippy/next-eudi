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
      headers: Object.fromEntries(request.headers.entries()),
      userAgent: request.headers.get('user-agent')
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
    
    // OIDC4VP authorization request for EUDI wallets
    // Using redirect_uri client_id_scheme (no signing required)
    const authRequest = {
      response_type: 'vp_token',
      client_id: `${request.nextUrl.origin}/api/eudi/callback`,
      response_mode: 'direct_post',
      response_uri: `${request.nextUrl.origin}/api/eudi/callback`,
      nonce: sessionId,
      state: sessionId,
      presentation_definition: {
        id: `age-verification-${session.minAge}`,
        input_descriptors: [{
          id: 'pid_credential',
          format: {
            'mso_mdoc': {
              alg: ['ES256', 'ES384', 'ES512']
            }
          },
          constraints: {
            fields: [{
              path: ['$[\'eu.europa.ec.eudi.pid.1\'][\'age_over_18\']'],
              intent_to_retain: false
            }]
          }
        }]
      },
      client_metadata: {
        vp_formats: {
          'mso_mdoc': {
            alg: ['ES256', 'ES384', 'ES512']
          }
        },
        client_name: 'Next EUDI Verifier'
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
