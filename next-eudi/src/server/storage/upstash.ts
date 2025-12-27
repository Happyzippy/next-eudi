// Upstash Redis storage adapter (works with REDIS_URL)

import type { SessionStorage } from './interface.js';
import type { VerificationSession } from '../session.js';
import type { Redis } from '@upstash/redis';

export class UpstashStorage implements SessionStorage {
  private redis: Redis;
  
  constructor(redisInstance: Redis) {
    this.redis = redisInstance;
  }

  async get(sessionId: string): Promise<VerificationSession | null> {
    const session = await this.redis.get<VerificationSession>(`session:${sessionId}`);
    
    if (!session) {
      return null;
    }
    
    // Check if expired
    if (new Date() > new Date(session.expiresAt)) {
      await this.delete(sessionId);
      return null;
    }
    
    return session as VerificationSession;
  }

  async set(sessionId: string, session: VerificationSession, ttl: number): Promise<void> {
    // Convert ttl from milliseconds to seconds
    const ttlSeconds = Math.floor(ttl / 1000);
    
    await this.redis.set(`session:${sessionId}`, session, {
      ex: ttlSeconds
    });
  }

  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
