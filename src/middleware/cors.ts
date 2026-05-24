export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = [
    'https://nava-astro.com',
    'https://app.nava-astro.com',
    'http://localhost:3000',
    'http://localhost:8787'
  ];

  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://app.nava-astro.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCors(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders(request), 'Content-Length': '0' }
    });
  }
  return null;
}
