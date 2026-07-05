// Simple in-memory token-bucket rate limiter
// Tracks requests per user to prevent API abuse

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

// Configuration
const MAX_TOKENS = 20;        // Max requests in the bucket
const REFILL_RATE = 10;       // Tokens added per interval
const REFILL_INTERVAL = 60000; // Refill every 60 seconds

/**
 * Consume a token from the user's bucket.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function consumeToken(userId: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(userId);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(userId, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL) * REFILL_RATE;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Try to consume a token
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * Get remaining tokens for a user (useful for X-RateLimit-Remaining header)
 */
export function getRemainingTokens(userId: string): number {
  const bucket = buckets.get(userId);
  if (!bucket) return MAX_TOKENS;
  return bucket.tokens;
}

/**
 * Clean up old buckets periodically to prevent memory leaks.
 * Call this on a timer or after a certain number of requests.
 */
export function cleanupBuckets(): void {
  const now = Date.now();
  const staleThreshold = 10 * 60 * 1000; // 10 minutes

  for (const [userId, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > staleThreshold) {
      buckets.delete(userId);
    }
  }
}
