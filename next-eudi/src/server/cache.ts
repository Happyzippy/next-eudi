// TrustCache interface and adapters

import type { TrustCacheAdapter } from '../types/index.js';

export type { TrustCacheAdapter as TrustCache };

/**
 * In-memory cache adapter for development
 */
export class InMemoryAdapter implements TrustCacheAdapter {
  private cache = new Map<string, { value: unknown; expires: number }>();

  async get(key: string): Promise<unknown | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    });
  }
}
