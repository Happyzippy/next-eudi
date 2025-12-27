// In-memory storage adapter (for local development)

import type { SessionStorage } from './interface.js';
import type { VerificationSession } from '../session.js';

export class MemoryStorage implements SessionStorage {
  private sessions = new Map<string, VerificationSession>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(sessionId: string): Promise<VerificationSession | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      await this.delete(sessionId);
      return null;
    }
    
    return session;
  }

  async set(sessionId: string, session: VerificationSession, ttl: number): Promise<void> {
    this.sessions.set(sessionId, session);
    
    // Clear existing timer if any
    const existingTimer = this.timers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Auto-cleanup after TTL
    const timer = setTimeout(() => {
      this.sessions.delete(sessionId);
      this.timers.delete(sessionId);
    }, ttl);
    
    this.timers.set(sessionId, timer);
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }
  }
}
