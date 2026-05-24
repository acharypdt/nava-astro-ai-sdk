'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Loader2, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const HINDI_SIGNS = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const HINDI_PLANETS: Record<string, string> = {
  'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
  'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि', 'Lagna': 'लग्न'
};

const BINDU_COLORS: Record<string, string> = {
  'Sun': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Moon': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Mars': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Mercury': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Jupiter': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Venus': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Saturn': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Lagna': 'bg-white/20 text-white border-white/30',
};

export default function AshtakavargaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string>('all');
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
      const res = await fetch('/api/v1/kundali/ashtakavarga', {
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
          <Layers className="w-8 h-8 text-[#F27D26]" /> अष्टकवर्ग विश्लेषण
        </h1>
        <p className="text-white/50">Ashtakavarga — 8-fold Strength Analysis System</p>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                {loading ? 'गणना हो रही है...' : 'अष्टकवर्ग दिखाएँ'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">🔢 सर्वाष्टकवर्ग (Total Strength)</h2>
                <Badge variant="default">कुल: {result.sarvashtakavarga.reduce((a: number, b: number) => a + b, 0)} / 96</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.signStrengths.map((s: any) => (
                  <div key={s.sign} className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{s.name}</span>
                      <span className="text-xs text-white/50">{s.bindus} बिंदु</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#F27D26] to-yellow-400 rounded-full transition-all" style={{width: `${(s.bindus / 48) * 100}%`}} />
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">{s.interpretation}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">📊 भिन्नाष्टकवर्ग (Planet-wise)</h2>
              <div className="flex gap-2 flex-wrap mb-4">
                <button onClick={() => setSelectedPlanet('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedPlanet === 'all' ? 'bg-[#F27D26] text-black' : 'bg-white/5 text-white/60'}`}>
                  सभी
                </button>
                {Object.keys(HINDI_PLANETS).map(p => (
                  <button key={p} onClick={() => setSelectedPlanet(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedPlanet === p ? 'bg-[#F27D26] text-black' : 'bg-white/5 text-white/60'}`}>
                    {p === 'Lagna' ? 'लग्न' : HINDI_PLANETS[p]}
                  </button>
                ))}
              </div>
              {Object.entries(result.binnashtakavarga)
                .filter(([k]) => selectedPlanet === 'all' || k === selectedPlanet)
                .map(([planet, bindus]) => (
                <div key={planet} className={`mb-3 p-3 rounded-xl border ${BINDU_COLORS[planet] || 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{HINDI_PLANETS[planet] || planet}</span>
                    <span className="text-xs opacity-70">{(bindus as number[]).reduce((a: number, b: number) => a + b, 0)} / 12</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(bindus as number[]).map((b: number, i: number) => (
                      <span key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono ${b === 1 ? 'bg-[#F27D26]/30 text-[#F27D26]' : 'bg-white/5 text-white/20'}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] mt-1 opacity-50">{HINDI_SIGNS.map((s, i) => `${s[0]}${i+1}`).join(' · ')}</div>
                </div>
              ))}
            </div>
          </Card>

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
