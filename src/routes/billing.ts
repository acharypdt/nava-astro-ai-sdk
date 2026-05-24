import { success, error } from '../lib/response';

const RAZORPAY_API = 'https://api.razorpay.com/v1';
const PLANS: Record<string, { amount: number; currency: string; name: string }> = {
  pro:     { amount: 99900, currency: 'INR', name: 'NavaAstro Pro' },
  enterprise: { amount: 0, currency: 'INR', name: 'NavaAstro Enterprise' },
};

function basicAuth(keyId: string, keySecret: string): string {
  return btoa(`${keyId}:${keySecret}`);
}

export async function handleCreateOrder(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const plan = body.plan as string;
  const planConfig = PLANS[plan];
  if (!planConfig) return error('Invalid plan. Use: pro, enterprise', 400);

  try {
    const resp = await fetch(`${RAZORPAY_API}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: planConfig.amount,
        currency: planConfig.currency,
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: { userId, plan },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return error(`Razorpay error: ${err}`, 500);
    }

    const order = await resp.json();
    return success({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (e: any) {
    return error(e.message || 'Failed to create order', 500);
  }
}

export async function handleVerifyPayment(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    return error('Missing payment fields', 400);
  }

  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSig = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.RAZORPAY_KEY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['verify']
  ).then(key => crypto.subtle.verify(
    'HMAC', key, hexToBuffer(razorpay_signature), new TextEncoder().encode(text)
  ));

  if (!expectedSig) return error('Invalid signature', 400);

  const subId = crypto.randomUUID();
  await env.DB?.prepare(
    `INSERT INTO subscriptions (id, user_id, tier, status, razorpay_order_id, current_period_start, current_period_end)
     VALUES (?, ?, ?, 'active', ?, datetime('now'), datetime('now', '+30 days'))
     ON CONFLICT(user_id) DO UPDATE SET tier = excluded.tier, status = 'active', updated_at = datetime('now')`
  ).bind(subId, userId, plan, razorpay_order_id).run();

  return success({ message: 'Payment verified', tier: plan, subscriptionId: subId });
}

export async function handleGetSubscription(request: Request, env: any, userId: string): Promise<Response> {
  const sub = await env.DB?.prepare(
    'SELECT tier, status, current_period_end, created_at FROM subscriptions WHERE user_id = ?'
  ).bind(userId).first();

  return success(sub || { tier: 'community', status: 'active', current_period_end: null });
}

export async function handleCancelSubscription(request: Request, env: any, userId: string): Promise<Response> {
  await env.DB?.prepare(
    "UPDATE subscriptions SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"
  ).bind(userId).run();
  return success({ message: 'Subscription cancelled' });
}

export async function handleWebhook(request: Request, env: any): Promise<Response> {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  const text = body + env.RAZORPAY_WEBHOOK_SECRET;
  const expectedHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    .then(h => bufferToHex(h));

  if (signature !== expectedHash) return error('Invalid webhook signature', 401);

  const event = JSON.parse(body);
  switch (event.event) {
    case 'subscription.charged': {
      const sub = event.payload.subscription.entity;
      const userId = sub.notes?.userId;
      if (userId) {
        await env.DB?.prepare(
          'UPDATE subscriptions SET razorpay_subscription_id = ?, current_period_end = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
        ).bind(sub.id, sub.charge_at, userId).run();
      }
      break;
    }
    case 'subscription.cancelled': {
      const cancelledSub = event.payload.subscription.entity;
      const cancelledUserId = cancelledSub.notes?.userId;
      if (cancelledUserId) {
        await env.DB?.prepare(
          "UPDATE subscriptions SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"
        ).bind(cancelledUserId).run();
      }
      break;
    }
  }

  return new Response('OK', { status: 200 });
}

function hexToBuffer(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []);
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
