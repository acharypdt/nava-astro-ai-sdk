'use client';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Moon, AlertTriangle, Calendar, Clock, Shield, Loader2, ChevronRight, MapPin } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const PHASE_DETAILS: Record<string, { icon: string; color: string }> = {
  first_dhaiya: { icon: '🌑', color: 'text-yellow-400' },
  middle_dhaiya: { icon: '🌕', color: 'text-red-400' },
  last_dhaiya: { icon: '🌒', color: 'text-green-400' }
};

export default function SadeSatiPage() {
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
      const res = await fetch('/api/v1/kundali/sade-sati', {
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

  const getPhaseColor = (phase: string) => PHASE_DETAILS[phase]?.color || 'text-white';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Moon className="w-8 h-8 text-[#F27D26]" /> साढ़ेसाती विश्लेषण
        </h1>
        <p className="text-white/50">शनि की साढ़ेसाती और ढैय्या — Saturn Transit (Sade Sati) Analysis</p>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4" />}
                {loading ? 'विश्लेषण हो रहा है...' : 'साढ़ेसाती विश्लेषण'}
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
                <h2 className="text-xl font-bold">🌑 साढ़ेसाती स्थिति</h2>
                <Badge variant={result.sadeSati.isActive ? 'warning' : 'success'}>
                  {result.sadeSati.isActive ? '⚠️ सक्रिय' : '✅ सक्रिय नहीं'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">जन्म का चंद्रमा</div>
                  <div className="text-lg font-semibold">{result.sadeSati.moonSignName} राशि</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-1">वर्तमान शनि</div>
                  <div className="text-lg font-semibold">{result.sadeSati.saturnSignName} राशि</div>
                </div>
              </div>

              {result.sadeSati.currentPhase && (
                <div className="bg-[#F27D26]/5 border border-[#F27D26]/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 text-[#F27D26] font-semibold mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    वर्तमान चरण: {result.sadeSati.currentPhase.name}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {result.sadeSati.currentPhase.startDate} से {result.sadeSati.currentPhase.endDate}</span>
                    <span>तीव्रता: {result.sadeSati.currentPhase.intensity}/10</span>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{result.sadeSati.currentPhase.description}</p>
                </div>
              )}

              <h3 className="text-lg font-semibold mb-4">सभी चरण</h3>
              <div className="space-y-3">
                {result.sadeSati.phases.map((phase: any) => {
                  const isCurrent = result.sadeSati.currentPhase?.phase === phase.phase;
                  const isPast = new Date(phase.endDate) < new Date();
                  return (
                    <div key={phase.phase} className={`rounded-xl p-4 border transition-all ${isCurrent ? 'bg-[#F27D26]/10 border-[#F27D26]/30' : isPast ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{PHASE_DETAILS[phase.phase]?.icon || '🌑'}</span>
                          <span className="font-medium">{phase.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isCurrent && <Badge variant="warning">वर्तमान</Badge>}
                          {isPast && <span className="text-xs text-white/30">समाप्त</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span><Calendar className="w-3 h-3 inline" /> {phase.startDate} — {phase.endDate}</span>
                        <span>शनि {phase.houseFromMoon}वें भाव में</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.sadeSati.predictions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">🔮 भविष्यवाणियाँ</h3>
                  <div className="space-y-2">
                    {result.sadeSati.predictions.map((pred: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-[#F27D26] shrink-0" />
                        <span>{pred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-white/5 rounded-xl">
                <h3 className="text-sm font-semibold mb-2">📋 विस्तृत रिपोर्ट</h3>
                <div className="prose prose-invert prose-sm max-w-none text-white/60 whitespace-pre-wrap font-sans">
                  {result.report}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
