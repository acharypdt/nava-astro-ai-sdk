/**
 * @file src/index.ts
 * @description Core Cloudflare Worker for NavaAstro Platform.
 * Handles API routing, Auth, Physics Engine orchestration, and Static Asset serving.
 */

import { NavaAstroSDK } from '../lib/astrology-sdk';

export interface Env {
  DB: D1Database;
  PLATFORM_SECRETS: KVNamespace;
  AI: any;
  AI_SEARCH: any;
  SEND_EMAIL: any;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  ENVIRONMENT: string;
}

/**
 * Centralized Error Handler
 */
async function handleGlobalError(error: any, context: string, env: Env) {
  console.error(`[${context}] ERROR:`, error);
  
  try {
    // Log to D1 (ensure app_logs table exists)
    await env.DB.prepare('INSERT INTO app_logs (context, message, stack) VALUES (?, ?, ?)')
      .bind(context, error?.message || "Unknown error", error?.stack || "")
      .run();
  } catch (e) {
    console.warn("Failed to log error to D1", e);
  }

  // --- Send Email Notification using Cloudflare Email Workers ---
  if (env.SEND_EMAIL) {
    try {
      const emailContent = `Context: ${context}\n\n` +
        `Error: ${error?.message || error}\n\n` +
        `Stack: ${error?.stack || 'N/A'}`;
      
      const emailResponse = await env.SEND_EMAIL.send({
        to: "navasanganakah@gmail.com",
        from: "info@navasanganakah.com",
        subject: `Platform Error Alert - ${context}`,
        html: `<p>Context: ${context}</p><p>Error: ${error?.message || error}</p><pre>${error?.stack || 'N/A'}</pre>`,
        text: emailContent,
      });
      
      console.log("Admin notified via email successfully. MessageId:", emailResponse?.messageId);
    } catch (e) {
      console.warn("Failed to send admin email notification", e);
    }
  }

  return new Response("Internal Server Error", { status: 500, headers: { 'Content-Type': 'text/plain' } });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // 1. Route to API
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApiRequest(request, env);
      } catch (error) {
        return await handleGlobalError(error, `API_ROUTE:${url.pathname}`, env);
      }
    }

    // --- Cloudflare AI Search Endpoint ---
    if (url.pathname === '/api/ai-search' && request.method === 'POST') {
      const body = await request.json() as any;
      const sdk = new NavaAstroSDK({ env });
      
      const answer = await sdk.resolveQuestionWithAI(body.question, body.math_data);
      
      return Response.json({
        success: true,
        answer
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};

export default worker;

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // --- SDK Orchestration Endpoint ---
  if (url.pathname === '/api/astro-engine' && request.method === 'POST') {
    const body = await request.json() as any;
    
    // Initialize the SDK with environment bindings
    const sdk = new NavaAstroSDK({ env });
    
    // Execute Analysis via SDK
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
        analysis: {
          activeRules: analysis.activeRules,
          aiReport: analysis.aiReport
        }
      }
    });
  }

  return new Response("Not Found", { status: 404 });
}
