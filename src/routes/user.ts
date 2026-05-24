import { success, error } from '../lib/response';

export async function handleGetProfile(request: Request, env: any, userId: string): Promise<Response> {
  const user = await env.DB?.prepare('SELECT id, email, created_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) return error('User not found', 404);
  return success(user);
}

export async function handleUpdateProfile(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  if (body.birth_data_json) {
    await env.DB?.prepare('UPDATE users SET birth_data_json = ? WHERE id = ?').bind(body.birth_data_json, userId).run();
  }
  return success({ message: 'Profile updated' });
}

export async function handleGetUsage(request: Request, env: any, userId: string): Promise<Response> {
  const today = new Date().toISOString().split('T')[0];

  const totalUsage = await env.DB?.prepare(
    'SELECT COUNT(*) as count FROM api_usage_logs WHERE user_id = ?'
  ).bind(userId).first();

  const todayUsage = await env.DB?.prepare(
    "SELECT COUNT(*) as count FROM api_usage_logs WHERE user_id = ? AND date(created_at) = ?"
  ).bind(userId, today).first();

  const tier = await env.DB?.prepare(
    'SELECT tier FROM subscriptions WHERE user_id = ? AND status = "active"'
  ).bind(userId).first();

  return success({
    totalRequests: totalUsage?.count || 0,
    todayRequests: todayUsage?.count || 0,
    tier: tier?.tier || 'community'
  });
}

export async function handleGetHistory(request: Request, env: any, userId: string): Promise<Response> {
  const list = await env.DB?.prepare(
    'SELECT id, name, created_at FROM saved_kundalis WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
  ).bind(userId).all();

  return success(list?.results || []);
}
