// Standard Redis storage adapter (works with redis:// URLs)

import type { SessionStorage } from './interface.js';
import type { VerificationSession } from '../session.js';
import type { RedisClientType } from 'redis';

export class RedisStorage implements SessionStorage {
  private redis: RedisClientType;
  
  constructor(redisInstance: RedisClientType) {
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
