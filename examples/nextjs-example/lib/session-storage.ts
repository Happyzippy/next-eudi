// Session storage configuration for Vercel deployment
// Uses Upstash Redis for serverless-compatible session storage

import { Redis } from '@upstash/redis';
import { UpstashStorage, configureSessionStorage } from '@emtyg/next-eudi';

// Initialize Upstash Redis client
const redis = Redis.fromEnv();

// Configure the library to use Upstash storage
// This ensures sessions persist across serverless function invocations
const storage = new UpstashStorage(redis);
configureSessionStorage(storage);

export { storage };
