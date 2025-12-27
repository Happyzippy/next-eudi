// Verifiable Presentation verification using jose

import { jwtVerify, type JWTPayload } from 'jose';
import type { VerificationResult, AgeVerificationResult } from '../types/index.js';

/**
 * Trusted issuers for development/testing
 * In production, this should be loaded from a trust registry
 */
const TRUSTED_ISSUERS = new Set([
  'did:example:eudi-issuer', // Mock issuer for testing
  // Add real EUDI issuer DIDs here
]);

/**
 * Extract Verifiable Presentation from JWT payload
 */
function extractVP(payload: JWTPayload): unknown {
  if (!payload.vp) {
    throw new Error('JWT payload does not contain vp claim');
  }
  return payload.vp;
}

/**
 * Extract Verifiable Credential from VP
 */
function extractVC(vp: unknown): unknown {
  const vpObj = vp as { verifiableCredential?: unknown[] };
  if (!vpObj.verifiableCredential || !Array.isArray(vpObj.verifiableCredential)) {
    throw new Error('VP does not contain verifiableCredential array');
  }
  
  if (vpObj.verifiableCredential.length === 0) {
    throw new Error('VP contains no credentials');
  }
  
  // Return first credential (for simplicity; could support multiple)
  return vpObj.verifiableCredential[0];
}

/**
 * Extract claims from credential subject
 */
function extractClaims(vc: unknown): Record<string, unknown> {
  const vcObj = vc as { credentialSubject?: Record<string, unknown> };
  if (!vcObj.credentialSubject) {
    throw new Error('VC does not contain credentialSubject');
  }
  
  return vcObj.credentialSubject;
}

/**
 * Verifies a Verifiable Presentation (JWT format)
 * @param presentationJwt - VP as JWT string
 * @param options - Verification options
 * @returns Verification result
 */
export async function verifyPresentation(
  presentationJwt: string,
  options: { 
    trustedIssuers?: Set<string>;
    publicKey?: CryptoKey;
    skipSignatureVerification?: boolean; // For testing only
  } = {}
): Promise<VerificationResult> {
  try {
    let payload: JWTPayload;
    let issuer: string | undefined;
    
    if (options.skipSignatureVerification) {
      // Decode without verification (TESTING ONLY)
      const parts = presentationJwt.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payloadPart = parts[1];
      if (!payloadPart) {
        throw new Error('Invalid JWT format: missing payload');
      }
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
      issuer = payload.iss as string;
    } else if (options.publicKey) {
      // Verify with provided public key (for testing with mock presentations)
      const { payload: verifiedPayload } = await jwtVerify(
        presentationJwt,
        options.publicKey
      );
      payload = verifiedPayload;
      issuer = payload.iss as string;
    } else {
      // TODO: In production, resolve issuer DID to get public key/JWKS
      // For now, we need either skipSignatureVerification or publicKey for testing
      throw new Error('Either publicKey or skipSignatureVerification must be provided');
    }
    
    // Check issuer is trusted
    const trustedIssuers = options.trustedIssuers || TRUSTED_ISSUERS;
    if (issuer && !trustedIssuers.has(issuer)) {
      return {
        valid: false,
        error: `Untrusted issuer: ${issuer}`
      };
    }
    
    // Extract VP from JWT
    const vp = extractVP(payload);
    
    // Extract VC from VP
    const vc = extractVC(vp);
    
    // Extract claims
    const claims = extractClaims(vc);
    
    return {
      valid: true,
      verifiedClaims: claims
    };
    
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract age information from claims
 */
function checkAge(claims: Record<string, unknown>, minAge: number): boolean {
  // Check age_over_X predicates
  if (minAge === 18 && claims.age_over_18 === true) return true;
  if (minAge === 21 && claims.age_over_21 === true) return true;
  
  // Check birthdate if available
  if (claims.birthdate && typeof claims.birthdate === 'string') {
    const birthDate = new Date(claims.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= minAge;
  }
  
  // Check exact age if available
  if (typeof claims.age === 'number') {
    return claims.age >= minAge;
  }
  
  return false;
}

/**
 * Convenience wrapper for age verification
 * @param presentation - VP (JWT)
 * @param minAge - Minimum age required
 * @param options - Verification options
 * @returns Age verification result
 */
export async function verifyAgeWithEudi(
  presentation: string,
  minAge: number,
  options: {
    publicKey?: CryptoKey;
    skipSignatureVerification?: boolean;
  } = {}
): Promise<AgeVerificationResult> {
  const result = await verifyPresentation(presentation, options);
  
  if (!result.valid) {
    const assertion: { method: string; ageRange: string; error?: string } = {
      method: 'eudi-wallet',
      ageRange: `>=${minAge}`
    };
    
    if (result.error) {
      assertion.error = result.error;
    }
    
    return {
      isOldEnough: false,
      assertion
    };
  }
  
  const isOldEnough = result.verifiedClaims 
    ? checkAge(result.verifiedClaims, minAge)
    : false;
  
  return {
    isOldEnough,
    assertion: {
      method: 'eudi-wallet',
      ageRange: `>=${minAge}`
    }
  };
}
