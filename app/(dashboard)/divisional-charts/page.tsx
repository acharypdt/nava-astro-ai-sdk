'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Loader2, ChevronRight, MapPin, Moon, Sun, Star } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const CHART_INFO: Record<string, { name: string; purpose: string; icon: any }> = {
  D3: { name: 'द्रेष्काण (D3)', purpose: 'सहोदर, साहस, स्वभाव', icon: Star },
  D7: { name: 'सप्तमांश (D7)', purpose: 'संतान, रचनात्मकता', icon: Sun },
  D10: { name: 'दशमांश (D10)', purpose: 'करियर, कर्म, प्रतिष्ठा', icon: Moon }
};

const HINDI_SIGNS = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const HINDI_PLANETS: Record<string, string> = {
  'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
  'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि', 'Rahu': 'राहु', 'Ketu': 'केतु', 'Ascendant': 'लग्न'
};

export default function DivisionalChartsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeChart, setActiveChart] = useState<string>('D3');
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
      const res = await fetch('/api/v1/kundali/divisional-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_data: formData,
          config: { ayanamsa: 'LAHIRI' }
        })
      });
      const json = await res.json();
      setResult(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-[#F27D26]" /> वर्गीय कुण्डलियाँ
        </h1>
        <p className="text-white/50">D3 (द्रेष्काण), D7 (सप्तमांश), D10 (दशमांश) — Divisional Charts Analysis</p>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
                {loading ? 'गणना हो रही है...' : 'कुण्डलियाँ दिखाएँ'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CHART_INFO).map(([key, info]) => (
              <button key={key} onClick={() => setActiveChart(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  activeChart === key ? 'bg-[#F27D26] text-black font-semibold' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}>
                <info.icon className="w-4 h-4" />
                {info.name}
              </button>
            ))}
          </div>

          {result.charts && (
            <Card key={activeChart}>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-1">{CHART_INFO[activeChart]?.name}</h2>
                <p className="text-sm text-white/50 mb-4">{CHART_INFO[activeChart]?.purpose}</p>

                <div className="mb-4">
                  <Badge>लग्न: {HINDI_SIGNS[result.charts[activeChart]?.lagnaSign]} राशि</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(result.charts[activeChart]?.planets || {})
                    .filter(([name]) => name !== 'Ascendant')
                    .map(([name, p]: [string, any]) => (
                      <div key={name} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                        <span className="font-medium">{HINDI_PLANETS[name] || name}</span>
                        <span className="text-sm text-white/60">{HINDI_SIGNS[p.sign]} राशि · {p.house}वाँ भाव</span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          )}

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
