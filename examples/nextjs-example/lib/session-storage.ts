// Session storage configuration for Vercel deployment
// Uses Upstash Redis for serverless-compatible session storage

import { Redis } from '@upstash/redis';
import { UpstashStorage, configureSessionStorage } from '@emtyg/next-eudi';

// Initialize Upstash Redis client with REDIS_URL from Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN || ''
});

// Configure the library to use Upstash storage
// This ensures sessions persist across serverless function invocations
const storage = new UpstashStorage(redis);
configureSessionStorage(storage);

export { storage };
