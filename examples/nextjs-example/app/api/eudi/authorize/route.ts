// API route for OIDC4VP authorization endpoint
// This is what the wallet will call to get the presentation definition

import { getSession, createPresentationDefinition } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
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
    // Must be signed as JWT per RFC9101
    const callbackUrl = `${request.nextUrl.origin}/api/eudi/callback`;
    
    const authRequest = {
      iss: `redirect_uri:${callbackUrl}`,
      aud: 'https://self-issued.me/v2',
      response_type: 'vp_token',
      client_id: `redirect_uri:${callbackUrl}`,
      response_mode: 'direct_post',
      response_uri: callbackUrl,
      nonce: sessionId,
      state: sessionId,
      presentation_definition: {
        id: `age-verification-${session.minAge}`,
        input_descriptors: [{
          id: 'pid_credential',
          format: {
            mso_mdoc: {
              alg: ['ES256', 'ES384', 'ES512']
            }
          },
          constraints: {
            fields: [{
              path: [`$['eu.europa.ec.eudi.pid.1']['age_over_${session.minAge}']`],
              intent_to_retain: false
            }]
          }
        }]
      },
      client_metadata: {
        vp_formats: {
          mso_mdoc: {
            alg: ['ES256', 'ES384', 'ES512']
          }
        },
        client_name: 'Next EUDI Verifier'
      }
    };
    
    console.log('[AUTHORIZE] Signing auth request as JWT', {
      sessionId,
      authRequest: JSON.stringify(authRequest, null, 2)
    });
    
    // Sign the authorization request as JWT
    const privateKeyPem = process.env.VERIFIER_PRIVATE_KEY;
    if (!privateKeyPem) {
      throw new Error('VERIFIER_PRIVATE_KEY environment variable not set');
    }
    
    // Handle both formats: with actual newlines or with literal \n
    const formattedKey = privateKeyPem.includes('\\n') 
      ? privateKeyPem.replace(/\\n/g, '\n')
      : privateKeyPem;
    
    console.log('[AUTHORIZE] Private key format check', {
      hasBackslashN: privateKeyPem.includes('\\n'),
      startsWithBegin: formattedKey.startsWith('-----BEGIN'),
      length: formattedKey.length,
      preview: formattedKey.substring(0, 50)
    });
    
    const privateKey = await importPKCS8(formattedKey, 'ES256');
    const jwt = await new SignJWT(authRequest)
      .setProtectedHeader({
        alg: 'ES256',
        typ: 'oauth-authz-req+jwt'
      })
      .sign(privateKey);
    
    console.log('[AUTHORIZE] JWT signed successfully', {
      jwtLength: jwt.length,
      jwtPreview: jwt.substring(0, 50) + '...'
    });
    
    // Return signed JWT with proper content type
    return new NextResponse(jwt, {
      status: 200,
      headers: {
        'Content-Type': 'application/oauth-authz-req+jwt',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// Handle POST requests (Lissi wallet uses request_uri_method=post)
export async function POST(request: NextRequest) {
  return GET(request);
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
