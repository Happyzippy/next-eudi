// Vercel KV storage adapter

import type { SessionStorage } from './interface.js';
import type { VerificationSession } from '../session.js';

export class VercelKVStorage implements SessionStorage {
  private kv: any;
  
  constructor(kvInstance: any) {
    this.kv = kvInstance;
  }

  async get(sessionId: string): Promise<VerificationSession | null> {
    const session = await this.kv.get<VerificationSession>(`session:${sessionId}`);
    
    if (!session) {
      return null;
    }
    
    // Check if expired (in case TTL didn't trigger)
    if (new Date() > new Date(session.expiresAt)) {
      await this.delete(sessionId);
      return null;
    }
    
    return session;
  }

  async set(sessionId: string, session: VerificationSession, ttl: number): Promise<void> {
    // Convert ttl from milliseconds to seconds for Vercel KV
    const ttlSeconds = Math.floor(ttl / 1000);
    
    await this.kv.set(`session:${sessionId}`, session, {
      ex: ttlSeconds // EX = expiration in seconds
    });
  }

  async delete(sessionId: string): Promise<void> {
    await this.kv.del(`session:${sessionId}`);
  }
}
