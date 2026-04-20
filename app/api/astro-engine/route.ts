import { NextResponse } from 'next/server';
import { NavaAstroSDK } from '@/lib/astrology-sdk';

/**
 * @file app/api/astro-engine/route.ts
 * @description Next.js API route to handle astrology requests in the development environment.
 * This mirrors the Cloudflare Worker logic to make the preview functional.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In the Next.js dev environment, we don't have D1/AI bindings directly.
    // However, the SDK is designed to fallback to heuristic interpretations if bindings are missing.
    const sdk = new NavaAstroSDK();
    
    const analysis = await sdk.analyze({
      ...body.birth_data,
      report_type: body.report_type,
      ayanamsa: body.config?.ayanamsa || 'LAHIRI'
    });

    return NextResponse.json({
      success: true,
      sdk_version: "4.2.0-stable",
      runtime: "Next.js Dev Fallback",
      data: {
        math: analysis.math,
        analysis: {
          activeRules: analysis.activeRules,
          aiReport: analysis.aiReport
        }
      }
    });
  } catch (error: any) {
    console.error("API Error in Next.js route:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
