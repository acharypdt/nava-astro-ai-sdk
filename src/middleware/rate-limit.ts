import { rateLimited } from '../lib/response';

const TIER_LIMITS: Record<string, number> = {
  community: 100,
  pro: 1000,
  enterprise: 10000,
};

export async function checkRateLimit(userId: string, tier: string, env: any): Promise<Response | null> {
  if (!env.DB) return null;

  const limit = TIER_LIMITS[tier] || TIER_LIMITS.community;
  const windowSeconds = 3600; // 1 hour sliding window
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Count requests in current window
  const result = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM rate_limits WHERE key_identifier = ? AND window_start > ?'
  ).bind(`user:${userId}`, windowStart.toISOString()).first();

  const currentCount = result?.count || 0;

  if (currentCount >= limit) {
    const resetTime = Math.floor(now.getTime() / 1000) + windowSeconds;
    return rateLimited(`Rate limit exceeded. Limit: ${limit} requests/hour. Resets at ${new Date(resetTime * 1000).toISOString()}`);
  }

  // Log this request
  await env.DB.prepare(
    'INSERT INTO rate_limits (key_identifier, window_start) VALUES (?, ?)'
  ).bind(`user:${userId}`, now.toISOString()).run();

  return null;
}
