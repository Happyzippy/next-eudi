// Standard Redis storage adapter (works with redis:// URLs)

import type { SessionStorage } from './interface.js';
import type { VerificationSession } from '../session.js';

/**
 * Minimal Redis client interface - compatible with standard 'redis' npm package
 * This avoids requiring 'redis' as a direct dependency
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<string | void>;
  del(key: string): Promise<number>;
}

export class RedisStorage implements SessionStorage {
  private redis: RedisClient;
  
  constructor(redisInstance: RedisClient) {
    this.redis = redisInstance;
  }

  async get(sessionId: string): Promise<VerificationSession | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    
    if (!data) {
      return null;
    }
    
    const session = JSON.parse(data) as VerificationSession;
    
    // Check if expired
    if (new Date() > new Date(session.expiresAt)) {
      await this.delete(sessionId);
      return null;
    }
    
    return session;
  }

  async set(sessionId: string, session: VerificationSession, ttl: number): Promise<void> {
    // Convert ttl from milliseconds to seconds
    const ttlSeconds = Math.floor(ttl / 1000);
    
    await this.redis.setEx(
      `session:${sessionId}`,
      ttlSeconds,
      JSON.stringify(session)
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
