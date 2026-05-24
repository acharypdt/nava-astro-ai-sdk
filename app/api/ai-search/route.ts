import { NextResponse } from 'next/server';
import { NavaAstroSDK } from '@/lib/astrology-sdk';

/**
 * @file app/api/ai-search/route.ts
 * @description Next.js API route for Cloudflare AI Search queries in the development environment.
 * Mirrors the Cloudflare Worker logic from src/index.ts.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sdk = new NavaAstroSDK();

    const answer = await sdk.resolveQuestionWithAI(
      body.question,
      body.math_data,
      body.muhurta_results || []
    );

    return NextResponse.json({
      success: true,
      answer
    });
  } catch (error: any) {
    console.error("API Error in Next.js AI Search route:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      answer: null
    }, { status: 500 });
  }
}