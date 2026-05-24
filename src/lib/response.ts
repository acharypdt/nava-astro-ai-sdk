export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    sdk_version: string;
    tier: string;
    rate_limit?: { limit: number; remaining: number; reset: number };
  };
}

export function success<T>(data: T, meta?: Partial<ApiResponse['meta']>): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      sdk_version: "4.2.0-stable",
      tier: meta?.tier || 'community',
      ...(meta?.rate_limit ? { rate_limit: meta.rate_limit } : {})
    }
  };
  return Response.json(body, { status: 200 });
}

export function error(message: string, status: number = 400): Response {
  const body: ApiResponse = {
    success: false,
    error: message,
    meta: { sdk_version: "4.2.0-stable", tier: 'community' }
  };
  return Response.json(body, { status });
}

export function notFound(message: string = 'Not found'): Response {
  return error(message, 404);
}

export function unauthorized(message: string = 'Unauthorized'): Response {
  return error(message, 401);
}

export function rateLimited(message: string = 'Rate limit exceeded'): Response {
  return error(message, 429);
}
