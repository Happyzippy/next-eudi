// Session storage configuration for Vercel deployment
// Uses standard Redis for serverless-compatible session storage

import { createClient } from 'redis';
import { RedisStorage, configureSessionStorage } from '@emtyg/next-eudi';

// Initialize Redis client with REDIS_URL from Vercel
const redis = createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis (required for standard redis client)
redis.connect().catch(console.error);

// Handle connection errors
redis.on('error', (err) => console.error('Redis Client Error', err));

// Configure the library to use Redis storage
// This ensures sessions persist across serverless function invocations
const storage = new RedisStorage(redis);
configureSessionStorage(storage);

export { storage };
