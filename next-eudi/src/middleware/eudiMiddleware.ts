// Next.js middleware factory for EUDI age verification

/**
 * Creates Next.js middleware to protect routes by age
 * @param options - Middleware options
 * @returns Middleware function
 */
export function middlewareEudi(options: { minAge: number; redirectTo: string }) {
  // TODO: Implement actual middleware
  // This is a stub for now
  console.log('Creating EUDI middleware', options);
  
  return async function middleware(request: unknown) {
    console.log('EUDI middleware called', request);
    return null;
  };
}
