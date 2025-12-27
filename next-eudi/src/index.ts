// Main export file for @emtyg/next-eudi

// Server-side exports
export { verifyPresentation, verifyAgeWithEudi } from './server/verifier.js';
export { createPairwiseId } from './server/pairwise.js';
export { createPresentationDefinition } from './server/presentation.js';
export type { TrustCache } from './server/cache.js';
export { InMemoryAdapter } from './server/cache.js';
export { createSession, getSession, updateSession, deleteSession, configureSessionStorage } from './server/session.js';
export type { VerificationSession } from './server/session.js';

// Storage adapters
export { MemoryStorage } from './server/storage/memory.js';
export { UpstashStorage } from './server/storage/upstash.js';
export { RedisStorage } from './server/storage/redis.js';
export type { SessionStorage } from './server/storage/interface.js';

// Client-side exports
export { EudiProvider } from './client/EudiProvider.js';
export { useEudiAge } from './client/hooks/useEudiAge.js';
export { useEudiAuth } from './client/hooks/useEudiAuth.js';
export { EudiVerifyButton } from './client/components/EudiVerifyButton.js';
export { EudiQRScanner } from './client/components/EudiQRScanner.js';

// Middleware
export { middlewareEudi } from './middleware/eudiMiddleware.js';

// NextAuth adapter
export { createEudiAdapterForNextAuth } from './next-auth/adapter.js';

// Test utilities (for development/testing)
export { 
  generateMockKeyPair,
  createMockPresentation,
  createCustomMockPresentation,
  exportPublicKeyJWK
} from './test-utils/index.js';

// Types
export type * from './types/index.js';
