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
        id: 'eu.europa.ec.eudi.pid.1',
        name: 'EUDI PID',
        purpose: 'We need to verify your age',
        format: {
          'vc+sd-jwt': {
            'alg': ['ES256', 'ES384', 'ES512', 'EdDSA']
          }
        },
        constraints: {
          limit_disclosure: 'required',
          fields: [
            {
              path: ['$.vct'],
              filter: {
                type: 'string',
                const: 'eu.europa.ec.eudi.pid.1'
              }
            },
            {
              path: ['$.age_over_18'],
              filter: {
                type: 'boolean',
                const: true
              },
              intent_to_retain: false
            }
          ]
        }
      }
    ]
  };
}
