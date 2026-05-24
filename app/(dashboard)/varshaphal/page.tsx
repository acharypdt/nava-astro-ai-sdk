'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Loader2, ChevronRight, Sun, Moon, Star } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const HINDI_SIGNS = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const HINDI_MONTHS = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

export default function VarshaphalPage() {
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', year: 1990, month: 1, day: 15,
    hour: 12, minute: 0, lat: 28.6139, lng: 77.209,
    timezone: 5.5, location: 'नई दिल्ली, भारत'
  });
  const [targetYear, setTargetYear] = useState(currentYear);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/v1/kundali/varshaphal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_data: formData, target_year: targetYear,
          config: { ayanamsa: 'LAHIRI' }
        })
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
          <CalendarDays className="w-8 h-8 text-[#F27D26]" /> वार्षिक वर्षफल
        </h1>
        <p className="text-white/50">Varshaphal — Annual Horoscope / Solar Return Analysis</p>
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
            <div>
              <label className="text-xs text-white/50 block mb-1">वर्ष चुनें</label>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full" value={targetYear} onChange={e => setTargetYear(parseInt(e.target.value))}>
                {Array.from({length: 10}, (_, i) => currentYear - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                {loading ? 'गणना हो रही है...' : 'वर्षफल दिखाएँ'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-[#F27D26]/10 rounded-xl">
                  <Sun className="w-10 h-10 text-[#F27D26]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{result.varshaphal.year} का वर्षफल</h2>
                  <p className="text-white/50">आयु: {result.varshaphal.age} वर्ष</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">सौर वापसी</div>
                  <div className="font-semibold flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#F27D26]" />
                    {result.varshaphal.solarReturnDate}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">मुंथा (वार्षिक लग्न)</div>
                  <div className="font-semibold">{HINDI_SIGNS[result.varshaphal.munthaSign]} राशि</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">आयु</div>
                  <div className="font-semibold">{result.varshaphal.age} वर्ष</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3">🔮 वार्षिक भविष्यवाणी</h3>
              <div className="space-y-2 mb-6">
                {result.varshaphal.predictions.map((pred: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-[#F27D26] shrink-0" />
                    <span>{pred}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-4">📅 मासिक भविष्यवाणी</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.varshaphal.monthlyPredictions.map((mp: any) => (
                  <div key={mp.month} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">{mp.month}</Badge>
                      <span className="font-medium text-sm">{HINDI_MONTHS[mp.month - 1]}</span>
                    </div>
                    <p className="text-xs text-white/60">{mp.prediction}</p>
                  </div>
                ))}
              </div>
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
