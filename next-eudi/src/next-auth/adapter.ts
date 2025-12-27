// NextAuth adapter helpers

/**
 * Creates adapter functions for NextAuth integration
 * @returns Adapter with onJwt and onSession callbacks
 */
export function createEudiAdapterForNextAuth() {
  return {
    onJwt: async (token: unknown) => {
      // TODO: Implement JWT callback enrichment
      console.log('EUDI onJwt', token);
      return token;
    },
    onSession: async (session: unknown) => {
      // TODO: Implement session callback enrichment
      console.log('EUDI onSession', session);
      return session;
    }
  };
}
