// Storage adapter interface for session management

import type { VerificationSession } from '../session.js';

export interface SessionStorage {
  get(sessionId: string): Promise<VerificationSession | null>;
  set(sessionId: string, session: VerificationSession, ttl: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
}
