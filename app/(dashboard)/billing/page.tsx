'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Crown, Zap, Star, CheckCircle2, Loader2, XCircle } from 'lucide-react';

declare global {
  interface Window { Razorpay: any; }
}

const PLANS = [
  { id: 'community', name: 'Community', price: 'मुफ़्त', period: '', icon: Star, features: ['100 अनुरोध/घंटा', 'बेसिक कुंडली', '1 API Key'], color: 'text-white/60', popular: false },
  { id: 'pro', name: 'Pro', price: '₹999', period: '/माह', icon: Zap, features: ['1000 अनुरोध/घंटा', 'AI रिपोर्ट', '10 API Keys', 'मुहूर्त खोजक', 'प्राथमिकता सपोर्ट'], color: 'text-[#F27D26]', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 'कस्टम', period: '', icon: Crown, features: ['10000 अनुरोध/घंटा', 'सम्पूर्ण AI सूट', 'असीमित API Keys', 'कुंडली मिलान', 'गोचर विश्लेषण', 'समर्पित सपोर्ट'], color: 'text-yellow-400', popular: false },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<{ tier: string; status: string; current_period_end: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/billing/subscription')
      .then(r => r.json())
      .then(res => { if (res.success) setSubscription(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadRazorpay = (): Promise<boolean> => new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleUpgrade = async (plan: string) => {
    if (plan === 'community') return;
    setProcessing(plan);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { alert('Razorpay लोड नहीं हो सका'); setProcessing(null); return; }

      const res = await fetch('/api/v1/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const orderData = await res.json();
      if (!orderData.success) { alert(orderData.error); setProcessing(null); return; }

      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'NavaAstro',
        description: `${plan === 'pro' ? 'Pro' : 'Enterprise'} Plan`,
        order_id: orderData.data.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/v1/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, plan }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSubscription({ tier: plan, status: 'active', current_period_end: null });
            alert(`${plan === 'pro' ? 'Pro' : 'Enterprise'} प्लान में अपग्रेड हो गया!`);
          } else {
            alert(verifyData.error || 'वेरिफिकेशन फेल');
          }
        },
        modal: { ondismiss: () => setProcessing(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setProcessing(null));
      rzp.open();
    } catch {
      alert('कुछ गलत हुआ');
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-medium tracking-tight mb-2">बिलिंग और सब्सक्रिप्शन</h1>

      {!loading && subscription && subscription.tier !== 'community' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          {subscription.status === 'active' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm">वर्तमान प्लान: <strong>{subscription.tier}</strong> — {subscription.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}</span>
          {subscription.current_period_end && <span className="text-xs text-white/40">नवीनीकरण: {new Date(subscription.current_period_end).toLocaleDateString('hi-IN')}</span>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = subscription?.tier === plan.id;
            return (
              <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'ring-2 ring-[#F27D26]' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#F27D26] text-black text-xs font-semibold rounded-full">लोकप्रिय</div>}
                <CardHeader>
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                  <h3 className="font-medium">{plan.name}</h3>
                </CardHeader>
                <div className="px-5 pb-5 flex flex-col flex-1">
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-white/40">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/70"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />{f}</li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Badge variant="secondary">वर्तमान प्लान</Badge>
                  ) : plan.id === 'community' ? (
                    <Badge variant="outline">मुफ़्त</Badge>
                  ) : (
                    <Button variant={plan.popular ? 'primary' : 'secondary'} onClick={() => handleUpgrade(plan.id)} disabled={processing !== null} className="w-full">
                      {processing === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {processing === plan.id ? 'प्रोसेसिंग...' : 'अपग्रेड करें'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
