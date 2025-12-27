// Pairwise identifier derivation

import { createHmac } from 'crypto';

/**
 * Creates a pairwise pseudonymous identifier deterministically
 * @param linkSecretOrSeed - Secret material (JWK, hex string, or Buffer)
 * @param rpIdentifier - Relying party identifier (DID, domain, or unique string)
 * @returns Pairwise identifier as hex string
 */
export function createPairwiseId(
  linkSecretOrSeed: string | Buffer,
  rpIdentifier: string
): string {
  const secret = typeof linkSecretOrSeed === 'string' 
    ? Buffer.from(linkSecretOrSeed, 'utf-8')
    : linkSecretOrSeed;
  
  const hmac = createHmac('sha256', secret);
  hmac.update(rpIdentifier);
  
  return hmac.digest('hex');
}
