'use client';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapIcon, User, Calendar, Clock, Globe, Briefcase, Heart, Activity, ChevronRight, Loader2, FileJson } from 'lucide-react';
import { NavaAstroSDK } from '../../../lib/astrology-sdk';
import { geocodeLocation, getCurrentPosition } from '../../../lib/geocode';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

const ASTRO_GLOSSARY: Record<string, string> = {
  'योग': 'योग (Yoga): ग्रहों का विशेष संयोजन जो जीवन के विभिन्न पहलुओं पर अनुकूल या प्रतिकूल प्रभाव डाल सकता है।',
  'दोष': 'दोष (Dosha): अवांछनीय ग्रहों की स्थिति जो जीवन में चुनौतियां या बाधाएं उत्पन्न कर सकती है।',
  'राशि': 'राशि (Rasi/Zodiac Sign): आकाश का 30 डिग्री का हिस्सा।',
  'भाव': 'भाव (Bhava/House): कुण्डली के 12 खाने, जो जीवन के विभिन्न पहलुओं को दर्शाते हैं।',
  'लग्न': 'लग्न (Ascendant): जन्म के समय पूर्वी क्षितिज पर उदित होने वाली राशि।',
  'महादशा': 'महादशा (Mahadasha): किसी विशिष्ट ग्रह के प्रभाव की लंबी अवधि।',
  'नवमांश': 'नवमांश (D9 Chart): मुख्य कुण्डली का सूक्ष्म रूप, विशेषकर विवाह के लिए।',
  'गोचर': 'गोचर (Transit): ग्रहों की वर्तमान आसमान में स्थिति का प्रभाव।',
  'नक्षत्र': 'नक्षत्र (Nakshatra): 27 तारा समूह जो चंद्रमा की स्थिति पर आधारित होते हैं।',
  'ग्रह': 'ग्रह (Graha): सूर्य, चंद्रमा, मंगल आदि।',
  'कुंडली': 'कुंडली (Kundli): जन्म के समय ग्रहों का आकाश में सटीक नक्शा।',
};

function processGlossaryTerms(text: string): string {
  if (!text) return text;
  let processed = text;
  const terms = Object.keys(ASTRO_GLOSSARY).sort((a, b) => b.length - a.length);
  terms.forEach(term => {
    const regex = new RegExp(`(^|\\s|[\\.,;:'"(\\[।\\-])(${term})(?=\\s|$|[\\.,;:'"\\]।\\-])`, 'gu');
    processed = processed.replace(regex, `$1[$2](#glossary:$2)`);
  });
  return processed;
}

function isMuhurtaQuery(question: string) {
  if (!question || question.trim().length === 0) return false;
  const text = question.toLowerCase();
  const muhurtaWords = ['मुहूर्त', 'muhurta', 'शुभ समय', 'शुभ तारीख', 'उपयुक्त समय'];
  if (muhurtaWords.some(word => text.includes(word))) return true;
  return /(कब|तारीख|दिन|समय)/i.test(text) && /(शुभ|उपयुक्त|best|auspicious)/i.test(text);
}

const GlossaryTooltip = ({ term, children }: { term: string, children: React.ReactNode }) => {
  const explanation = ASTRO_GLOSSARY[term] || 'Astrology term';
  return (
    <span className="relative inline-block group cursor-help text-[#F27D26] border-b border-dashed border-[#F27D26]/50 hover:bg-[#F27D26]/10 transition-colors rounded px-0.5">
      {children}
      <span className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#111] text-[#E4E3E0] text-xs font-sans font-normal leading-relaxed text-left rounded-xl shadow-[0_0_40px_rgba(242,125,38,0.15)] border border-white/10 pointer-events-none">
        {explanation}
        <svg className="absolute text-[#111] h-3 w-4 left-1/2 -translate-x-1/2 top-full" x="0px" y="0px" viewBox="0 0 255 255">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </span>
    </span>
  );
};

export default function KundaliPage() {
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [muhurtaResults, setMuhurtaResults] = useState<any[]>([]);
  const geocodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGeocodeRef = useRef<string>('');
  const [formData, setFormData] = useState({
    name: "उदाहरण उपयोगकर्ता", gender: "Male", location: "नई दिल्ली, भारत",
    year: 2005, month: 12, day: 31, hour: 11, minute: 20,
    lat: 28.6139, lng: 77.209, timezone: 5.5,
    report_type: "General", question: "", useAI: true
  });

  useEffect(() => {
    const location = formData.location?.trim();
    if (!location || location.length < 2) return;
    if (location === lastGeocodeRef.current) return;
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      lastGeocodeRef.current = location;
      setGeocoding(true);
      try {
        const result = await geocodeLocation(location);
        if (result) setFormData(prev => ({ ...prev, lat: parseFloat(result.lat.toFixed(4)), lng: parseFloat(result.lng.toFixed(4)) }));
      } catch (err) { console.warn('Geocoding error:', err); }
      finally { setGeocoding(false); }
    }, 600);
    return () => { if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current); };
  }, [formData.location]);

  const handleUseMyLocation = async () => {
    try {
      setGeocoding(true);
      const location = await getCurrentPosition();
      if (location) setFormData(prev => ({ ...prev, lat: parseFloat(location.lat.toFixed(4)), lng: parseFloat(location.lng.toFixed(4)), location: location.displayName }));
    } finally { setGeocoding(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMuhurtaResults([]);
    try {
      const sdk = new NavaAstroSDK();
      const analysis = await sdk.analyze({
        year: formData.year, month: formData.month, day: formData.day,
        hour: formData.hour, minute: formData.minute,
        lat: formData.lat, lng: formData.lng, timezone: formData.timezone,
        report_type: formData.report_type, gender: formData.gender,
        birthLocation: formData.location, ayanamsa: 'LAHIRI'
      });

      let muhurtaInfo: any[] = [];
      if (isMuhurtaQuery(formData.question)) {
        muhurtaInfo = await sdk.findMuhurtas({
          year: formData.year, month: formData.month, day: formData.day,
          hour: formData.hour, minute: formData.minute,
          lat: formData.lat, lng: formData.lng, timezone: formData.timezone,
          ayanamsa: 'LAHIRI', gender: formData.gender, birthLocation: formData.location, report_type: formData.report_type
        }, { rangeHours: 24, stepMinutes: 30, top: 5 });
      }
      setMuhurtaResults(muhurtaInfo);

      let finalAIReport = analysis.aiReport;
      if (formData.question && formData.question.trim().length > 0) {
        if (formData.useAI) {
          try {
            const res = await fetch('/api/v1/ai/ask', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question: formData.question, math_data: analysis.math, muhurta_results: muhurtaInfo })
            });
            const result = await res.json() as any;
            finalAIReport = result.data?.answer
              ? `### 🔍 AI उत्तर\n\n**प्रश्न:** ${formData.question}\n\n**उत्तर:**\n${result.data.answer}\n\n---\n\n${finalAIReport}`
              : `### 🔍 AI उत्तर\n\n*(AI ने उत्तर नहीं भेजा)*\n\n---\n\n${finalAIReport}`;
          } catch { finalAIReport = `### ❓ AI Error\n\n---\n\n${finalAIReport}`; }
        } else {
          finalAIReport = `### 🔍 आपके प्रश्न का उत्तर\n\n${sdk.resolveQuestionHeuristically(formData.question, analysis.math)}\n\n---\n\n${finalAIReport}`;
        }
      }

      setReport({ math: analysis.math, analysis: { activeRules: analysis.activeRules, aiReport: finalAIReport } });
    } catch (err: any) {
      console.error('Error:', err);
      setReport({
        math: { planets: { 'Sun': { name: 'Sun', longitude: 10.5, sign: 1, house: 1, is_retrograde: false }, 'Moon': { name: 'Moon', longitude: 155.2, sign: 6, house: 10, is_retrograde: false } }, houses: {} },
        analysis: { activeRules: [{ name: 'System Error', category: 'Engine' }], aiReport: 'Calculation failed. Please check console.' }
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-medium tracking-tight mb-2">कुंडली <span className="text-[#F27D26]">कैलकुलेटर</span></h1>

      <div className="grid lg:grid-cols-[420px_1fr] gap-8">
        {/* Input Panel */}
        <Card>
          <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[#F27D26]" /> जन्म विवरण
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider opacity-50 block">पूरा नाम</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">लिंग</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 appearance-none outline-none focus:ring-1 focus:ring-[#F27D26]">
                  <option value="Male">पुरुष</option>
                  <option value="Female">स्त्री</option>
                  <option value="Other">अन्य</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">जन्म स्थान</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[{key:'year',label:'वर्ष'},{key:'month',label:'माह'},{key:'day',label:'दिन'}].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">{f.label}</label>
                  <input type="number" value={(formData as any)[f.key]} onChange={e => setFormData({...formData, [f.key]: parseInt(e.target.value) || 0})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-2 text-center focus:ring-1 focus:ring-[#F27D26] outline-none" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">घंटा</label>
                <input type="number" value={formData.hour} onChange={e => setFormData({...formData, hour: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">मिनट</label>
                <input type="number" value={formData.minute} onChange={e => setFormData({...formData, minute: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">अक्षांश</label>
                <input type="number" step="0.0001" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">देशांतर</label>
                <input type="number" step="0.0001" value={formData.lng} onChange={e => setFormData({...formData, lng: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
              </div>
            </div>

            <Button type="button" variant="secondary" size="sm" onClick={handleUseMyLocation} disabled={geocoding} className="w-full">
              <MapIcon className="w-3.5 h-3.5 text-[#F27D26]" />
              {geocoding ? 'लोकेशन प्राप्त कर रहे हैं...' : 'मेरी वर्तमान लोकेशन का उपयोग करें'}
            </Button>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider opacity-50 block">टाइमज़ोन ऑफसेट</label>
              <input type="number" step="0.1" value={formData.timezone} onChange={e => setFormData({...formData, timezone: parseFloat(e.target.value) || 0})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider opacity-50 block">विश्लेषण का विषय</label>
              <select value={formData.report_type} onChange={e => setFormData({...formData, report_type: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 appearance-none focus:ring-1 focus:ring-[#F27D26] outline-none">
                <option value="Career">करियर</option>
                <option value="Marriage">विवाह</option>
                <option value="Spiritual">अध्यात्म</option>
                <option value="General">सामान्य</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider opacity-50 block">प्रश्न (Optional)</label>
              <textarea value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})}
                placeholder="उदा. 'क्या मुझे इस वर्ष विदेश जाने का अवसर मिलेगा?'"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none min-h-[80px]" />
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer select-none"
              onClick={() => setFormData({...formData, useAI: !formData.useAI})}>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.useAI ? 'bg-[#F27D26]' : 'bg-gray-600'}`}>
                <motion.div animate={{ x: formData.useAI ? 22 : 2 }} className="absolute top-1 w-3 h-3 bg-white rounded-full" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider">AI विश्लेषण</span>
              <Sparkles className={`w-4 h-4 ${formData.useAI ? 'text-[#F27D26]' : 'text-gray-600'}`} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>कुण्डली का विश्लेषण करें <ChevronRight className="w-5 h-5" /></>}
            </Button>
          </form>
        </Card>

        {/* Results Panel */}
        <Card className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {!report ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-20 text-center">
                <MapIcon className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2 opacity-40">गणना की प्रतीक्षा है</h3>
                <p className="max-w-xs opacity-30 text-sm">जन्म विवरण दर्ज करें और विश्लेषण शुरू करें।</p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                {/* Planetary Grid */}
                <div>
                  <CardHeader>
                    <Briefcase className="w-5 h-5 text-[#F27D26]" />
                    <h3 className="text-sm font-mono tracking-widest uppercase">जन्म कुण्डली (D1) — ग्रहों की स्थिति</h3>
                  </CardHeader>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.values(report.math.planets).map((p: any) => {
                      const hindiMap: any = { 'Sun': 'सूर्य','Moon': 'चंद्रमा','Mars': 'मंगल','Mercury': 'बुध','Jupiter': 'गुरु','Venus': 'शुक्र','Saturn': 'शनि','Rahu': 'राहु','Ketu': 'केतु','Ascendant': 'लग्न' };
                      return (
                        <div key={p.name} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-[#F27D26]/30 transition-colors">
                          <p className="text-[10px] uppercase opacity-40 mb-1">{hindiMap[p.name] || p.name}</p>
                          <p className="text-lg font-mono tracking-tight">{p.longitude.toFixed(2)}&deg;</p>
                          <p className="text-[10px] opacity-60">भाव {p.house} / राशि {p.sign}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* D9 + Dasha Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  {report.math.d9Planets && (
                    <div>
                      <CardHeader>
                        <Globe className="w-4 h-4 text-[#F27D26]" />
                        <h3 className="text-xs font-mono tracking-widest uppercase">नवमांश (D9)</h3>
                      </CardHeader>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(report.math.d9Planets).slice(0, 4).map((p: any) => (
                          <div key={p.name} className="bg-white/5 p-2 rounded border border-white/5">
                            <p className="text-[10px] opacity-50">{p.name}</p>
                            <p className="text-sm font-mono">राशि {p.sign}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.math.dasha && (
                    <div>
                      <CardHeader>
                        <Clock className="w-4 h-4 text-[#F27D26]" />
                        <h3 className="text-xs font-mono tracking-widest uppercase">वर्तमान महादशा</h3>
                      </CardHeader>
                      <div className="bg-[#F27D26]/10 p-4 rounded-xl border border-[#F27D26]/30">
                        <p className="text-sm opacity-60 mb-1">महादशा स्वामी</p>
                        <p className="text-2xl font-serif text-[#F27D26]">{report.math.dasha.currentLord}</p>
                        <div className="mt-4 h-1 w-full bg-black/40 rounded overflow-hidden">
                          <div className="h-full bg-[#F27D26]" style={{ width: `${(report.math.dasha.balanceFraction * 100)}%` }} />
                        </div>
                        <p className="text-[10px] font-mono opacity-40 mt-2 text-right">दशा प्रगति</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Yogas */}
                <div>
                  <CardHeader>
                    <Sparkles className="w-5 h-5 text-[#F27D26]" />
                    <h3 className="text-sm font-mono tracking-widest uppercase">निर्मित योग</h3>
                  </CardHeader>
                  <div className="flex flex-wrap gap-3">
                    {report.analysis.activeRules.map((y: any) => (
                      <Badge key={y.name}>{y.name} <span className="opacity-50 ml-1">[{y.category}]</span></Badge>
                    ))}
                  </div>
                </div>

                {/* Muhurta Results */}
                {muhurtaResults.length > 0 && (
                  <div>
                    <CardHeader>
                      <Heart className="w-5 h-5 text-[#F27D26]" />
                      <h3 className="text-sm font-mono tracking-widest uppercase">मुहूर्त चयनित समय</h3>
                    </CardHeader>
                    <div className="grid gap-4">
                      {muhurtaResults.map((item, index) => (
                        <div key={item.startISO} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                          <div className="flex justify-between items-center gap-4">
                            <p className="text-sm font-semibold">#{index + 1} — {new Date(item.startISO).toLocaleString('hi-IN')}</p>
                            <span className="text-xs uppercase tracking-widest opacity-60">स्कोर {item.score}</span>
                          </div>
                          <p className="mt-3 text-sm opacity-80">तिथि: {item.tithi}, नक्षत्र: {item.nakshatra} ({item.nakshatraName})</p>
                          <ul className="mt-2 list-disc list-inside text-xs opacity-70 space-y-1">
                            {item.reasons.map((reason: string) => <li key={reason}>{reason}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Report */}
                <div>
                  <CardHeader>
                    <Activity className="w-5 h-5 text-[#F27D26]" />
                    <h3 className="text-sm font-mono tracking-widest uppercase">ज्योतिषीय विश्लेषण</h3>
                  </CardHeader>
                  <div className="prose prose-invert prose-orange max-w-none prose-p:leading-relaxed prose-headings:font-medium prose-h2:text-[#F27D26] prose-h3:text-orange-300">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => {
                          if (props.href?.startsWith('#glossary:')) {
                            const term = decodeURIComponent(props.href.replace('#glossary:', ''));
                            return <GlossaryTooltip term={term}>{props.children}</GlossaryTooltip>;
                          }
                          return <a {...props} />;
                        }
                      }}
                    >
                      {processGlossaryTerms(report.analysis.aiReport)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* SDK Code */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <FileJson className="w-4 h-4 text-[#F27D26]" />
                    <h3 className="text-xs font-mono tracking-widest uppercase opacity-60">SDK कोड</h3>
                  </div>
                  <div className="bg-black/60 rounded-xl p-4 font-mono text-[11px] overflow-x-auto border border-white/5">
                    <pre className="text-blue-300">{`import { NavaAstroSDK } from '@nava-astro/sdk';\n\nconst sdk = new NavaAstroSDK({ apiKey: 'YOUR_KEY' });\nconst result = await sdk.analyze({\n  year: ${formData.year}, month: ${formData.month}, day: ${formData.day},\n  hour: ${formData.hour}, minute: ${formData.minute},\n  lat: ${formData.lat}, lng: ${formData.lng},\n  report_type: '${formData.report_type}'\n});`}</pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
