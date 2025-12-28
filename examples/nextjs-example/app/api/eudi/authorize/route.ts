// API route for OIDC4VP authorization endpoint
// This is what the wallet will call to get the presentation definition

import { getSession } from '@emtyg/next-eudi';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as jose from 'jose';
import '../../../../lib/session-storage';

// Handle POST requests (Lissi wallet uses request_uri_method=post)
export async function POST(request: NextRequest) {
  try {
    // Parse the form body to get wallet_nonce
    const formData = await request.formData();
    const walletNonce = formData.get('wallet_nonce');
    
    console.log('[AUTHORIZE] POST request received', {
      walletNonce,
      contentType: request.headers.get('content-type')
    });
    
    // Pass wallet_nonce to shared handler
    return handleRequest(request, walletNonce?.toString());
  } catch (error) {
    console.error('[AUTHORIZE] Error parsing POST body:', error);
    // Fallback to handler if parsing fails
    return handleRequest(request);
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest, walletNonce?: string) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    console.log('[AUTHORIZE] Request received', {
      sessionId,
      walletNonce,
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
    
    // OIDC4VP authorization request for EUDI wallets
    // EUDI Wallet requires signed JWT (ES256) - HAIP Profile
    const callbackUrl = `${request.nextUrl.origin}/api/eudi/callback`;
    const redirectUrl = `${request.nextUrl.origin}/success`; // URL for user redirection after success
    
    // Use persistent keys from environment variables
    // This ensures the key ID (kid) remains consistent
    const privateKeyPem = process.env.VERIFIER_PRIVATE_KEY;
    const publicJwkStr = process.env.VERIFIER_PUBLIC_JWK;

    if (!privateKeyPem || !publicJwkStr) {
      console.error('Missing VERIFIER_PRIVATE_KEY or VERIFIER_PUBLIC_JWK');
      return NextResponse.json(
        { error: 'Server configuration error: Missing signing keys' },
        { status: 500 }
      );
    }

    const privateKey = await jose.importPKCS8(privateKeyPem, 'ES256');
    const jwk = JSON.parse(publicJwkStr);
    
    const now = Math.floor(Date.now() / 1000);
    // Use wallet_nonce if provided (from POST body), otherwise generate one
    // IMPORTANT: The wallet expects the nonce in the JWT to match the wallet_nonce sent in the POST body
    const nonce = walletNonce || crypto.randomBytes(16).toString('base64url');
    
    console.log('[AUTHORIZE] Using nonce', { nonce, walletNonce });

    const authRequest = {
      response_uri: callbackUrl,
      iss: request.nextUrl.origin,
      response_type: 'vp_token',
      nonce: nonce,
      wallet_nonce: nonce, // Required by OpenID4VP when wallet_nonce is in POST
      client_id: `redirect_uri:${callbackUrl}`,
      response_mode: 'direct_post',
      aud: 'https://self-issued.me/v2',
      state: sessionId,
      exp: now + 3600, // 1 hour
      iat: now,
      dcql_query: {
        credentials: [{
          format: 'dc+sd-jwt',
          id: 'sd-jwt-pid',
          meta: {
            vct_values: [
              'https://pidissuer.demo.connector.lissi.io/pid'
            ]
          },
          claims: [
            {
              "id": "given_name",
              "path": ["given_name"]
            },
            {
              "id": "family_name",
              "path": ["family_name"]
            },
            {
              "id": "birthdate",
              "path": ["birthdate"]
            },
            {
              "id": "address-street_address",
              "path": ["address", "street_address"]
            },
            {
              "id": "address-locality",
              "path": ["address", "locality"]
            },
            {
              "id": "address-postal_code",
              "path": ["address", "postal_code"]
            },
            {
              "id": "address-country",
              "path": ["address", "country"]
            }
          ]
        }]
      },
      client_metadata: {
        client_name: 'Next EUDI Verifier',
        client_uri: request.nextUrl.origin,
        logo_uri: 'https://ux-backend-demo.lissi.io/images/partnerbankLogo.png',
        policy_uri: 'https://docs.lissi.id/legal/lissi-id-wallet-datenschutzhinweise-privacy-policy',
        redirect_uris: [redirectUrl],
        jwks: {
          keys: [jwk]
        },
        vp_formats_supported: {
          'vc+sd-jwt': {
            'sd-jwt_alg_values': ['ES256'],
            'kb-jwt_alg_values': ['ES256']
          },
          'dc+sd-jwt': {
            'sd-jwt_alg_values': ['ES256'],
            'kb-jwt_alg_values': ['ES256']
          }
        }
      }
    };
    
    console.log('[AUTHORIZE] Creating signed JWT (ES256)', {
      sessionId,
      authRequest: JSON.stringify(authRequest, null, 2)
    });
    
    // Create signed JWT
    const jwt = await new jose.SignJWT(authRequest)
      .setProtectedHeader({ alg: 'ES256', typ: 'oauth-authz-req+jwt' })
      .sign(privateKey);
    
    console.log('[AUTHORIZE] Signed JWT created', {
      jwtLength: jwt.length,
      jwtPreview: jwt.substring(0, 50) + '...'
    });
    
    // Return signed JWT
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
