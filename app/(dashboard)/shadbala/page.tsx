'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const HINDI_PLANETS: Record<string, string> = {
  'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
  'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि'
};

const BALA_NAMES: Record<string, string> = {
  sthanaBala: 'स्थान बल', digBala: 'दिग बल', kalaBala: 'काल बल',
  chestaBala: 'चेष्टा बल', naisargikaBala: 'नैसर्गिक बल', ayanaBala: 'अयन बल'
};

export default function ShadbalaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', year: 1990, month: 1, day: 15,
    hour: 12, minute: 0, lat: 28.6139, lng: 77.209,
    timezone: 5.5, location: 'नई दिल्ली, भारत'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/v1/kundali/shadbala', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_data: formData, config: { ayanamsa: 'LAHIRI' } })
      });
      const json = await res.json();
      setResult(json.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Zap className="w-8 h-8 text-[#F27D26]" /> षड्बल विश्लेषण
        </h1>
        <p className="text-white/50">Shadbala — Six-fold Planetary Strength Analysis</p>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">जन्म विवरण</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-white/50 block mb-1">जन्म तिथि</label>
              <div className="flex gap-2">
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}>
                  {Array.from({length: 100}, (_, i) => 1950 + i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-20" value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-20" value={formData.day} onChange={e => setFormData({...formData, day: parseInt(e.target.value)})}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">जन्म समय</label>
              <div className="flex gap-2">
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full" value={formData.hour} onChange={e => setFormData({...formData, hour: parseInt(e.target.value)})}>
                  {Array.from({length: 24}, (_, i) => i).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                </select>
                <span className="flex items-center text-white/30">:</span>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full" value={formData.minute} onChange={e => setFormData({...formData, minute: parseInt(e.target.value)})}>
                  {Array.from({length: 12}, (_, i) => i * 5).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">स्थान</label>
              <input className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? 'गणना हो रही है...' : 'षड्बल दिखाएँ'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.strengths.map((s: any) => {
              const data = result.planetary[s.planet];
              const maxBala = 360;
              return (
                <Card key={s.planet}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">{HINDI_PLANETS[s.planet]}</h3>
                      <Badge variant={data.isStrong ? 'success' : 'warning'}>
                        #{s.rank} · {data.isStrong ? 'बलवान' : 'कमजोर'}
                      </Badge>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-4 mb-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 rounded-full transition-all" style={{width: `${(data.totalBala / maxBala) * 100}%`}} />
                    </div>
                    <div className="text-2xl font-bold mb-3">{data.totalBala} <span className="text-sm font-normal text-white/40">/ {maxBala} विरूप</span></div>
                    <div className="space-y-1.5">
                      {Object.entries(BALA_NAMES).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-white/50">{label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#F27D26] rounded-full" style={{width: `${(data[key] / 60) * 100}%`}} />
                            </div>
                            <span className="w-6 text-right font-mono">{data[key]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-3">📋 विस्तृत रिपोर्ट</h3>
              <div className="prose prose-invert prose-sm max-w-none text-white/60 whitespace-pre-wrap">
                {result.report}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
