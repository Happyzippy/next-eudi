// Configure session storage for the application
// This file should be imported once at app initialization

import { configureSessionStorage, VercelKVStorage } from '@emtyg/next-eudi';
import { kv } from '@vercel/kv';

// Configure to use Vercel KV in production, memory in development
if (process.env.KV_REST_API_URL) {
  configureSessionStorage(new VercelKVStorage(kv));
  console.log('Using Vercel KV for session storage');
} else {
  console.log('Using in-memory storage (local development)');
  // Default MemoryStorage is used automatically
}
