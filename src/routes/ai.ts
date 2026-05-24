import { NavaAstroSDK } from '../../lib/astrology-sdk';
import { success, error } from '../lib/response';

export async function handleAskAI(request: Request, env: any): Promise<Response> {
  const body = await request.json() as any;
  if (!body.question) return error('question is required');
  if (!body.math_data) return error('math_data is required');

  const sdk = new NavaAstroSDK({ env });
  const answer = await sdk.resolveQuestionWithAI(body.question, body.math_data, body.muhurta_results || []);

  return success({ answer });
}
