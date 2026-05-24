import { NextResponse } from 'next/server';
import { NavaAstroSDK } from '@/lib/astrology-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sdk = new NavaAstroSDK();

    const results = await sdk.findMuhurtas({
      ...body.birth_data,
      report_type: body.report_type,
      ayanamsa: body.config?.ayanamsa || 'LAHIRI'
    }, body.options || {});

    return NextResponse.json({
      success: true,
      sdk_version: '4.2.0-stable',
      runtime: 'Next.js Dev Fallback',
      muhurta_count: results.length,
      results
    });
  } catch (error: any) {
    console.error('API Error in Next.js Muhurta route:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
