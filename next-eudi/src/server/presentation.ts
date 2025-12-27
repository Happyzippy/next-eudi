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
        id: 'age_credential',
        constraints: {
          fields: [
            {
              path: ['$.credentialSubject.age', '$.vc.credentialSubject.age'],
              filter: {
                type: 'number',
                minimum: minAge
              }
            }
          ]
        }
      }
    ]
  };
}
