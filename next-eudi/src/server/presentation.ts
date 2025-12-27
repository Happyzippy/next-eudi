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
        name: 'Age Credential',
        purpose: 'We need to verify your age',
        constraints: {
          fields: [
            {
              // Look for age_over_18 in multiple possible locations
              path: [
                `$.age_over_${minAge}`,
                `$.credentialSubject.age_over_${minAge}`,
                `$.vc.credentialSubject.age_over_${minAge}`,
                '$.age_over_18',
                '$.credentialSubject.age_over_18',
                '$.vc.credentialSubject.age_over_18'
              ],
              filter: {
                type: 'boolean'
              },
              intent_to_retain: false
            }
          ]
        }
      }
    ]
  };
}
