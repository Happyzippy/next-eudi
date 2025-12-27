// Session management for OIDC4VP flow

import { randomUUID } from 'crypto';

export interface VerificationSession {
  sessionId: string;
  status: 'pending' | 'scanned' | 'completed' | 'failed';
  minAge: number;
  createdAt: Date;
  expiresAt: Date;
  presentationDefinition?: unknown;
  result?: {
    isOldEnough: boolean;
    claims: Record<string, unknown>;
  };
  error?: string;
}

// In-memory session storage (use Redis/database in production)
const sessions = new Map<string, VerificationSession>();

/**
 * Creates a new verification session
 */
export function createSession(minAge: number): VerificationSession {
  const sessionId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
  
  const session: VerificationSession = {
    sessionId,
    status: 'pending',
    minAge,
    createdAt: now,
    expiresAt
  };
  
  sessions.set(sessionId, session);
  
  // Auto-cleanup expired session
  setTimeout(() => {
    sessions.delete(sessionId);
  }, 10 * 60 * 1000);
  
  return session;
}

/**
 * Gets a session by ID
 */
export function getSession(sessionId: string): VerificationSession | null {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (new Date() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

/**
 * Updates a session
 */
export function updateSession(
  sessionId: string,
  updates: Partial<VerificationSession>
): VerificationSession | null {
  const session = getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  Object.assign(session, updates);
  sessions.set(sessionId, session);
  
  return session;
}

/**
 * Deletes a session
 */
export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}
