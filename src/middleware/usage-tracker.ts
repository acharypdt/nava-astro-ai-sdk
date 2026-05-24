export async function trackUsage(
  env: any,
  userId: string,
  apiKeyId: string | undefined,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string
): Promise<void> {
  if (!env.DB) return;

  try {
    await env.DB.prepare(
      `INSERT INTO api_usage_logs (api_key_id, user_id, endpoint, method, status_code, response_time_ms, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(apiKeyId || null, userId, endpoint, method, statusCode, responseTimeMs, ipAddress).run();
  } catch {
    // Silently fail — don't break API for logging
  }
}
