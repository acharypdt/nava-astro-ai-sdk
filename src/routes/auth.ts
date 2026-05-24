import { NavaAstroSDK } from '../../lib/astrology-sdk';
import { hashPassword, createToken } from '../../lib/astro-core';
import { success, error } from '../lib/response';
import { v4 as uuid } from 'uuid';

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function handleRegister(request: Request, env: any): Promise<Response> {
  const body: RegisterBody = await request.json();
  if (!body.email || !body.password) return error('Email and password required');

  const existing = await env.DB?.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
  if (existing) return error('Email already registered', 409);

  const id = uuid();
  const passwordHash = await hashPassword(body.password);

  await env.DB?.prepare(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
  ).bind(id, body.email, passwordHash, body.name || '').run();

  const secret = await env.PLATFORM_SECRETS?.get('JWT_SECRET') || 'default-secret';
  const token = await createToken({ sub: id, email: body.email, tier: 'community' }, secret);

  return success({ userId: id, token }, { tier: 'community' });
}

export async function handleLogin(request: Request, env: any): Promise<Response> {
  const body: LoginBody = await request.json();
  if (!body.email || !body.password) return error('Email and password required');

  const user = await env.DB?.prepare('SELECT id, password_hash FROM users WHERE email = ?').bind(body.email).first<any>();
  if (!user) return error('Invalid credentials', 401);

  const passwordHash = await hashPassword(body.password);
  if (passwordHash !== user.password_hash) return error('Invalid credentials', 401);

  const secret = await env.PLATFORM_SECRETS?.get('JWT_SECRET') || 'default-secret';
  const token = await createToken({ sub: user.id, email: body.email, tier: 'community' }, secret);

  return success({ userId: user.id, token });
}

export async function handleCreateApiKey(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const name = body.name || 'API Key';
  const apiKey = uuid().replace(/-/g, '') + uuid().replace(/-/g, '');
  const keyHash = await hashPassword(apiKey);
  const id = uuid();

  await env.DB?.prepare(
    'INSERT INTO api_keys (id, user_id, key_hash, name) VALUES (?, ?, ?, ?)'
  ).bind(id, userId, keyHash, name).run();

  return success({ apiKey, id, name }, { tier: 'community' });
}

export async function handleListApiKeys(request: Request, env: any, userId: string): Promise<Response> {
  const keys = await env.DB?.prepare(
    'SELECT id, name, tier, is_active, last_used_at, created_at FROM api_keys WHERE user_id = ?'
  ).bind(userId).all();

  return success(keys?.results || []);
}
