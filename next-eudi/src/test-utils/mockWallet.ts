// Mock EUDI Wallet for testing without real wallet

import { SignJWT, generateKeyPair, exportJWK } from 'jose';

/**
 * Generates a mock key pair for testing
 */
export async function generateMockKeyPair() {
  return await generateKeyPair('ES256');
}

/**
 * Creates a mock Verifiable Presentation (VP) containing age credentials
 * Follows W3C VC Data Model and JWT-VC format
 * 
 * @param age - User's age for the mock credential
 * @param options - Additional options for customization
 * @returns JWT-encoded Verifiable Presentation
 */
export async function createMockPresentation(
  age: number,
  options: {
    includeAge?: boolean;
    includeBirthdate?: boolean;
    privateKey?: CryptoKey;
  } = {}
) {
  const { privateKey } = options.privateKey 
    ? { privateKey: options.privateKey }
    : await generateKeyPair('ES256');
  
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  
  // Build credential subject with age attestations
  const credentialSubject: Record<string, unknown> = {
    id: 'did:example:holder123',
  };
  
  if (options.includeAge !== false) {
    credentialSubject.age_over_18 = age >= 18;
    credentialSubject.age_over_21 = age >= 21;
  }
  
  if (options.includeBirthdate) {
    credentialSubject.birthdate = `${birthYear}-01-15`;
  }
  
  // Create Verifiable Credential
  const verifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ],
    type: ['VerifiableCredential', 'AgeCredential'],
    issuer: 'did:example:eudi-issuer',
    issuanceDate: new Date().toISOString(),
    credentialSubject
  };
  
  // Create Verifiable Presentation
  const vp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [verifiableCredential],
    holder: 'did:example:holder123'
  };
  
  // Sign as JWT
  const jwt = await new SignJWT({ vp })
    .setProtectedHeader({ 
      alg: 'ES256',
      typ: 'JWT'
    })
    .setIssuedAt()
    .setIssuer('did:example:eudi-issuer')
    .setSubject('did:example:holder123')
    .setExpirationTime('2h')
    .sign(privateKey);
  
  return jwt;
}

/**
 * Creates a mock presentation with custom claims
 */
export async function createCustomMockPresentation(
  claims: Record<string, unknown>,
  options: {
    privateKey?: CryptoKey;
  } = {}
) {
  const { privateKey } = options.privateKey 
    ? { privateKey: options.privateKey }
    : await generateKeyPair('ES256');
  
  const verifiableCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:eudi-issuer',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: 'did:example:holder123',
      ...claims
    }
  };
  
  const vp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [verifiableCredential],
    holder: 'did:example:holder123'
  };
  
  const jwt = await new SignJWT({ vp })
    .setProtectedHeader({ 
      alg: 'ES256',
      typ: 'JWT'
    })
    .setIssuedAt()
    .setIssuer('did:example:eudi-issuer')
    .setSubject('did:example:holder123')
    .setExpirationTime('2h')
    .sign(privateKey);
  
  return jwt;
}

/**
 * Export a public key as JWK for verification
 */
export async function exportPublicKeyJWK(keyPair: CryptoKeyPair) {
  return await exportJWK(keyPair.publicKey);
}
