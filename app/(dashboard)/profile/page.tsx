'use client';
import React, { useState, useEffect } from 'react';
import { User, Calendar, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '', birthData: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/user/profile')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setProfile({
            name: res.data.name || '',
            email: res.data.email || '',
            birthData: res.data.birth_data_json ? JSON.stringify(res.data.birth_data_json, null, 2) : ''
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/v1/user/history')
      .then(r => r.json())
      .then(res => { if (res.success) setHistory(res.data || []); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = { name: profile.name, email: profile.email };
      try { payload.birth_data_json = JSON.parse(profile.birthData); } catch { payload.birth_data_json = profile.birthData; }
      const res = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) setMessage({ type: 'success', text: 'प्रोफ़ाइल सहेज ली गई!' });
      else setMessage({ type: 'error', text: data.error || 'कुछ गलत हुआ' });
    } catch {
      setMessage({ type: 'error', text: 'सर्वर से कनेक्ट नहीं हो सका' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-medium tracking-tight mb-2">प्रोफ़ाइल</h1>

      <Card>
        <CardHeader>
          <User className="w-5 h-5 text-[#F27D26]" />
          <h3 className="font-medium">व्यक्तिगत जानकारी</h3>
        </CardHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">नाम</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                placeholder="आपका नाम" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">ईमेल</label>
              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
                placeholder="email@example.com" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">डिफ़ॉल्ट जन्म डेटा (JSON)</label>
              <textarea value={profile.birthData} onChange={e => setProfile({...profile, birthData: e.target.value})}
                rows={4} placeholder='{"year": 1990, "month": 5, "day": 15, ...}'
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 font-mono text-xs focus:ring-1 focus:ring-[#F27D26] outline-none" />
            </div>
            {message && (
              <div className={`flex items-center gap-2 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'सहेज रहा है...' : 'सहेजें'}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <Calendar className="w-5 h-5 text-[#F27D26]" />
          <h3 className="font-medium">हाल की गतिविधि</h3>
        </CardHeader>
        {history.length > 0 ? (
          <ul className="divide-y divide-white/5 text-sm">
            {history.map((item: any) => (
              <li key={item.id} className="py-3 flex justify-between">
                <span>{item.name || 'कुंडली'}</span>
                <span className="text-white/30">{new Date(item.created_at).toLocaleDateString('hi-IN')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/30 text-center py-6">कोई गतिविधि नहीं।</p>
        )}
      </Card>
    </div>
  );
}
