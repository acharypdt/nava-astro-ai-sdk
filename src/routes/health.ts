import { success } from '../lib/response';

export async function handleHealthCheck(request: Request, env: any): Promise<Response> {
  let dbStatus = 'ok';
  try {
    if (env.DB) {
      await env.DB.prepare('SELECT 1').run();
    }
  } catch {
    dbStatus = 'error';
  }

  return success({
    status: 'healthy',
    version: '4.2.0-stable',
    edition: env.ENVIRONMENT === 'enterprise' ? 'enterprise' : 'community',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
}
