// Presentation Definition helpers

import type { PresentationDefinition } from '../types/index.js';

/**
 * Creates a Presentation Definition for age verification
 * @param minAge - Minimum age to request
 * @returns Presentation Definition
 */
export function createPresentationDefinition(minAge: number = 18): PresentationDefinition {
  return {
    id: `age-verification-${minAge}`,
    purpose: `Verify user is at least ${minAge} years old`,
    input_descriptors: [
      {
        id: 'any_credential',
        name: 'Any Verifiable Credential',
        purpose: 'We need to verify your identity',
        constraints: {
          fields: []
        }
      }
    ]
  };
}
