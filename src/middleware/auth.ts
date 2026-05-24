import { verifyToken, hashPassword as sha256 } from '../../lib/astro-core';
import { unauthorized } from '../lib/response';

export interface AuthResult {
  userId: string;
  tier: string;
  apiKeyId?: string;
}

export async function authenticateRequest(request: Request, env: any): Promise<AuthResult | Response> {
  const authHeader = request.headers.get('Authorization') || '';
  const apiKeyHeader = request.headers.get('X-API-Key') || '';

  // Try JWT Bearer token first
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const secret = await env.PLATFORM_SECRETS?.get('JWT_SECRET') || 'default-secret';
    const payload = await verifyToken(token, secret);
    if (payload?.sub) {
      return { userId: payload.sub as string, tier: (payload.tier as string) || 'community' };
    }
    return unauthorized('Invalid or expired token');
  }

  // Try API key
  if (apiKeyHeader) {
    const keyHash = await sha256(apiKeyHeader);
    const result = await env.DB?.prepare(
      'SELECT ak.id, ak.user_id, ak.tier FROM api_keys ak WHERE ak.key_hash = ? AND ak.is_active = 1 AND (ak.expires_at IS NULL OR ak.expires_at > datetime("now"))'
    ).bind(keyHash).first();

    if (result) {
      // Update last_used_at
      await env.DB?.prepare('UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?').bind(result.id).run();
      return { userId: result.user_id, tier: result.tier || 'community', apiKeyId: result.id };
    }
    return unauthorized('Invalid or expired API key');
  }

  // No auth — community tier with default rate limit
  return { userId: 'anonymous', tier: 'community' };
}
