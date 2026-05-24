import { NavaAstroSDK } from '../../lib/astrology-sdk';
import { success, error } from '../lib/response';

export async function handleVarshaphal(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const birthData = body.birth_data;
  if (!birthData) return error('birth_data is required');

  const sdk = new NavaAstroSDK({ env });
  const result = await sdk.analyzeVarshaphal({
    ...birthData,
    ayanamsa: body.config?.ayanamsa || 'LAHIRI'
  }, body.target_year);

  return success(result);
}
