import { NavaAstroSDK } from '../../lib/astrology-sdk';
import { success, error } from '../lib/response';

export async function handleDivisionalCharts(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const birthData = body.birth_data;
  if (!birthData) return error('birth_data is required');

  const sdk = new NavaAstroSDK({ env });
  const result = await sdk.analyzeDivisionalCharts({
    ...birthData,
    ayanamsa: body.config?.ayanamsa || 'LAHIRI'
  });

  return success(result);
}
