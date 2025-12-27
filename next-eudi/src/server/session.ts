// Session management for OIDC4VP flow

import { randomUUID } from 'crypto';
import type { SessionStorage } from './storage/interface.js';
import { MemoryStorage } from './storage/memory.js';

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

// Default to in-memory storage
let storage: SessionStorage = new MemoryStorage();

/**
 * Configure session storage backend
 * @param storageAdapter - Custom storage adapter (e.g., Vercel KV, Redis)
 */
export function configureSessionStorage(storageAdapter: SessionStorage): void {
  storage = storageAdapter;
}

/**
 * Creates a new verification session
 */
export async function createSession(minAge: number): Promise<VerificationSession> {
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
  
  await storage.set(sessionId, session, 10 * 60 * 1000);
  
  return session;
}

/**
 * Gets a session by ID
 */
export async function getSession(sessionId: string): Promise<VerificationSession | null> {
  return await storage.get(sessionId);
}

/**
 * Updates a session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<VerificationSession>
): Promise<VerificationSession | null> {
  const session = await getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  Object.assign(session, updates);
  await storage.set(sessionId, session, 10 * 60 * 1000);
  
  return session;
}

/**
 * Deletes a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await storage.delete(sessionId);
}
