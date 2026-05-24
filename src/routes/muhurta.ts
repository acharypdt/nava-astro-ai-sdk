import { NavaAstroSDK } from '../../lib/astrology-sdk';
import { success, error } from '../lib/response';

export async function handleFindMuhurta(request: Request, env: any): Promise<Response> {
  const body = await request.json() as any;
  if (!body.birth_data) return error('birth_data is required');

  const sdk = new NavaAstroSDK({ env });
  const results = await sdk.findMuhurtas({
    ...body.birth_data,
    ayanamsa: body.config?.ayanamsa || 'LAHIRI'
  }, body.options || {});

  return success({
    muhurta_count: results.length,
    results
  });
}
