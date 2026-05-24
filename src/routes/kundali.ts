import { NavaAstroSDK } from '../../lib/astrology-sdk';
import { success, error } from '../lib/response';
import { encrypt, decrypt } from '../lib/encryption';
import { v4 as uuid } from 'uuid';

export async function handleCalculate(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const birthData = body.birth_data;
  if (!birthData) return error('birth_data is required');

  const sdk = new NavaAstroSDK({ env });
  const analysis = await sdk.analyze({
    ...birthData,
    report_type: body.report_type,
    ayanamsa: body.config?.ayanamsa || 'LAHIRI'
  });

  // Auto-save to history
  const secret = await env.PLATFORM_SECRETS?.get('ENCRYPTION_KEY') || 'default-key';
  const id = uuid();
  const encryptedBirth = await encrypt(JSON.stringify(birthData), secret);
  const encryptedResult = await encrypt(JSON.stringify(analysis), secret);

  await env.DB?.prepare(
    'INSERT INTO saved_kundalis (id, user_id, name, birth_data_json, result_json) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, body.name || null, encryptedBirth, encryptedResult).run();

  return success({
    id,
    math: analysis.math,
    analysis: {
      activeRules: analysis.activeRules,
      aiReport: analysis.aiReport
    }
  });
}

export async function handleListKundalis(request: Request, env: any, userId: string): Promise<Response> {
  const list = await env.DB?.prepare(
    'SELECT id, name, created_at FROM saved_kundalis WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(userId).all();

  return success(list?.results || []);
}

export async function handleGetKundali(request: Request, env: any, userId: string, kundaliId: string): Promise<Response> {
  const record = await env.DB?.prepare(
    'SELECT * FROM saved_kundalis WHERE id = ? AND user_id = ?'
  ).bind(kundaliId, userId).first<any>();

  if (!record) return error('Kundali not found', 404);

  const secret = await env.PLATFORM_SECRETS?.get('ENCRYPTION_KEY') || 'default-key';
  const birthData = JSON.parse(await decrypt(record.birth_data_json, secret));
  const result = record.result_json ? JSON.parse(await decrypt(record.result_json, secret)) : null;

  return success({ id: record.id, name: record.name, birthData, result, createdAt: record.created_at });
}
