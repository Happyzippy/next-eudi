// Type definitions for @emtyg/next-eudi

export interface PresentationDefinition {
  id: string;
  input_descriptors: InputDescriptor[];
  purpose?: string;
}

export interface InputDescriptor {
  id: string;
  name?: string;
  purpose?: string;
  format?: {
    [key: string]: {
      alg?: string[];
    };
  };
  constraints: {
    limit_disclosure?: string;
    fields: Field[];
  };
}

export interface Field {
  path: string[];
  filter?: {
    type: string;
    minimum?: number;
    maximum?: number;
    const?: string | boolean | number;
  };
  intent_to_retain?: boolean;
}

export interface VerificationResult {
  valid: boolean;
  verifiedClaims?: Record<string, unknown>;
  error?: string;
}

export interface AgeVerificationResult {
  isOldEnough: boolean;
  assertion: {
    method: string;
    ageRange?: string;
    error?: string;
  };
}

export interface TrustCacheAdapter {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttl: number): Promise<void>;
}

export interface EudiConfig {
  apiBaseUrl: string;
  trustCache?: TrustCacheAdapter;
  ttl?: {
    cdn?: number;
    edge?: number;
    inFunction?: number;
  };
}
