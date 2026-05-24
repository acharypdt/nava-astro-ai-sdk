import { NavaAstroSDK } from '../lib/astrology-sdk';
import { handleCors, corsHeaders } from './middleware/cors';
import { authenticateRequest } from './middleware/auth';
import { checkRateLimit } from './middleware/rate-limit';
import { trackUsage } from './middleware/usage-tracker';
import { handleRegister, handleLogin, handleCreateApiKey, handleListApiKeys } from './routes/auth';
import { handleCalculate, handleListKundalis, handleGetKundali } from './routes/kundali';
import { handleFindMuhurta } from './routes/muhurta';
import { handleSadeSati } from './routes/sadesati';
import { handleDivisionalCharts } from './routes/divisional';
import { handleAshtakavarga } from './routes/ashtakavarga';
import { handleShadbala } from './routes/shadbala';
import { handleVarshaphal } from './routes/varshaphal';
import { handleGetProfile, handleUpdateProfile, handleGetUsage, handleGetHistory } from './routes/user';
import { handleAskAI } from './routes/ai';
import { handleHealthCheck } from './routes/health';
import { handleCreateOrder, handleVerifyPayment, handleGetSubscription, handleCancelSubscription, handleWebhook } from './routes/billing';
import { success, error, notFound } from './lib/response';

export interface Env {
  DB: D1Database;
  PLATFORM_SECRETS: KVNamespace;
  AI: any;
  AI_SEARCH: any;
  EMAIL: any;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  ENVIRONMENT: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}

type RouteHandler = (request: Request, env: Env, ...args: string[]) => Promise<Response>;

interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
  requireAuth: boolean;
}

const routes: Route[] = [
  // Health
  { method: 'GET', path: '/api/v1/health', handler: handleHealthCheck, requireAuth: false },

  // Auth
  { method: 'POST', path: '/api/v1/auth/register', handler: handleRegister, requireAuth: false },
  { method: 'POST', path: '/api/v1/auth/login', handler: handleLogin, requireAuth: false },

  // Kundali
  { method: 'POST', path: '/api/v1/kundali/calculate', handler: handleCalculate, requireAuth: true },
  { method: 'GET', path: '/api/v1/kundali', handler: handleListKundalis, requireAuth: true },
  { method: 'GET', path: '/api/v1/kundali/:id', handler: handleGetKundali, requireAuth: true },

  // Muhurta
  { method: 'POST', path: '/api/v1/muhurta', handler: handleFindMuhurta, requireAuth: false },

  // Sade Sati
  { method: 'POST', path: '/api/v1/kundali/sade-sati', handler: handleSadeSati, requireAuth: true },
  { method: 'POST', path: '/api/v1/kundali/divisional-charts', handler: handleDivisionalCharts, requireAuth: true },
  { method: 'POST', path: '/api/v1/kundali/ashtakavarga', handler: handleAshtakavarga, requireAuth: true },
  { method: 'POST', path: '/api/v1/kundali/shadbala', handler: handleShadbala, requireAuth: true },
  { method: 'POST', path: '/api/v1/kundali/varshaphal', handler: handleVarshaphal, requireAuth: true },

  // AI
  { method: 'POST', path: '/api/v1/ai/ask', handler: handleAskAI, requireAuth: false },

  // User
  { method: 'GET', path: '/api/v1/user/profile', handler: handleGetProfile, requireAuth: true },
  { method: 'PUT', path: '/api/v1/user/profile', handler: handleUpdateProfile, requireAuth: true },
  { method: 'GET', path: '/api/v1/user/usage', handler: handleGetUsage, requireAuth: true },
  { method: 'GET', path: '/api/v1/user/history', handler: handleGetHistory, requireAuth: true },

  // API Keys
  { method: 'POST', path: '/api/v1/auth/api-keys', handler: handleCreateApiKey, requireAuth: true },
  { method: 'GET', path: '/api/v1/auth/api-keys', handler: handleListApiKeys, requireAuth: true },

  // Billing
  { method: 'POST', path: '/api/v1/billing/create-order', handler: handleCreateOrder, requireAuth: true },
  { method: 'POST', path: '/api/v1/billing/verify', handler: handleVerifyPayment, requireAuth: true },
  { method: 'GET', path: '/api/v1/billing/subscription', handler: handleGetSubscription, requireAuth: true },
  { method: 'POST', path: '/api/v1/billing/cancel', handler: handleCancelSubscription, requireAuth: true },
  { method: 'POST', path: '/api/v1/billing/webhook', handler: handleWebhook, requireAuth: false },
];

function matchRoute(url: URL, method: string): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const routeParts = route.path.split('/');
    const urlParts = url.pathname.split('/');

    if (routeParts.length !== urlParts.length) continue;

    const params: Record<string, string> = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = urlParts[i];
      } else if (routeParts[i] !== urlParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { route, params };
  }
  return null;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const startTime = Date.now();

    // Handle CORS preflight
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;

    try {
      // Route matching for /api/v1/
      const match = matchRoute(url, request.method);

      if (match) {
        const { route, params } = match;

        // Auth check
        let auth: { userId: string; tier: string; apiKeyId?: string };
        if (route.requireAuth) {
          const authResult = await authenticateRequest(request, env);
          if (authResult instanceof Response) return authResult;
          auth = authResult;
        } else {
          auth = { userId: 'anonymous', tier: 'community' };
        }

        // Rate limit check
        if (auth.userId !== 'anonymous') {
          const rateLimitResult = await checkRateLimit(auth.userId, auth.tier, env);
          if (rateLimitResult) return rateLimitResult;
        }

        // Execute handler
        const response = await route.handler(request, env, auth.userId, params?.id);

        // Track usage (fire and forget)
        ctx.waitUntil(trackUsage(
          env, auth.userId, auth.apiKeyId,
          url.pathname, request.method,
          response.status, Date.now() - startTime,
          request.headers.get('CF-Connecting-IP') || 'unknown'
        ));

        // Add CORS headers
        const headers = new Headers(response.headers);
        Object.entries(corsHeaders(request)).forEach(([k, v]) => headers.set(k, v));
        return new Response(response.body, { status: response.status, headers });
      }

      // Legacy API routes for backward compatibility
      if (url.pathname.startsWith('/api/')) {
        return await handleLegacyApi(request, env);
      }

      return notFound('Route not found');
    } catch (err: any) {
      console.error(`[WORKER] Error: ${err.message}`);
      return error('Internal server error', 500);
    }
  }
};

export default worker;

/**
 * Legacy API handler for backward compatibility (will be deprecated)
 */
async function handleLegacyApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/ai-search' && request.method === 'POST') {
    const body = await request.json() as any;
    const sdk = new NavaAstroSDK({ env });
    const answer = await sdk.resolveQuestionWithAI(body.question, body.math_data, body.muhurta_results || []);
    return Response.json({ success: true, answer });
  }

  if (url.pathname === '/api/astro-engine' && request.method === 'POST') {
    const body = await request.json() as any;
    const sdk = new NavaAstroSDK({ env });
    const analysis = await sdk.analyze({
      ...body.birth_data,
      report_type: body.report_type,
      ayanamsa: body.config?.ayanamsa || 'LAHIRI'
    });
    return Response.json({
      success: true,
      sdk_version: "4.2.0-stable",
      data: {
        math: analysis.math,
        analysis: { activeRules: analysis.activeRules, aiReport: analysis.aiReport }
      }
    });
  }

  if (url.pathname === '/api/astro-engine/muhurta' && request.method === 'POST') {
    const body = await request.json() as any;
    const sdk = new NavaAstroSDK({ env });
    const results = await sdk.findMuhurtas({
      ...body.birth_data,
      ayanamsa: body.config?.ayanamsa || 'LAHIRI'
    }, body.options || {});
    return Response.json({ success: true, sdk_version: "4.2.0-stable", muhurta_count: results.length, results });
  }

  return new Response("Not Found", { status: 404 });
}
