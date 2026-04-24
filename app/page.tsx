/**
 * @file app/page.tsx
 * @description Main dashboard for the NavaAstro platform.
 */

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Map as MapIcon, 
  User, 
  Calendar, 
  Clock, 
  Globe, 
  Briefcase, 
  Heart, 
  Activity,
  ChevronRight,
  Loader2,
  FileJson
} from 'lucide-react';
import { NavaAstroSDK } from '@/lib/astrology-sdk';

const ASTRO_GLOSSARY: Record<string, string> = {
  'योग': 'योग (Yoga): ग्रहों का विशेष संयोजन जो जीवन के विभिन्न पहलुओं पर अनुकूल या प्रतिकूल प्रभाव डाल सकता है।',
  'दोष': 'दोष (Dosha): अवांछनीय ग्रहों की स्थिति जो जीवन में चुनौतियां या बाधाएं उत्पन्न कर सकती है (जैसे मांगलिक दोष)।',
  'राशि': 'राशि (Rasi/Zodiac Sign): आकाश का 30 डिग्री का हिस्सा, जो स्वभाव और व्यक्तित्व को प्रभावित करता है।',
  'भाव': 'भाव (Bhava/House): कुण्डली के 12 खाने, जो जीवन के विभिन्न पहलुओं (जैसे धन, विवाह, करियर) को दर्शाते हैं।',
  'लग्न': 'लग्न (Ascendant): जन्म के समय पूर्वी क्षितिज पर उदित होने वाली राशि, जो व्यक्तित्व व शरीर का प्रतिनिधित्व करती है।',
  'महादशा': 'महादशा (Mahadasha): किसी विशिष्ट ग्रह के प्रभाव की लंबी अवधि, जो जीवन के महत्वपूर्ण चरणों को निर्धारित करती है।',
  'नवमांश': 'नवमांश (D9 Chart): मुख्य कुण्डली का सूक्ष्म रूप, विशेषकर विवाह और व्यक्ति के आंतरिक स्वभाव को देखने के लिए प्रयुक्त।',
  'दृष्टि': 'दृष्टि (Aspect): जब कोई ग्रह किसी अन्य भाव या ग्रह को अपनी ऊर्जा से प्रभावित करता है (देखता है)।',
  'गोचर': 'गोचर (Transit): ग्रहों की वर्तमान आसमान में स्थिति का जन्म कुण्डली पर प्रभाव।',
  'अंतर्दशा': 'अंतर्दशा (Antardasha): महादशा के अंतर्गत एक छोटी अवधि (उप-अवधि), जो अधिक सटीक समय बताती है।',
  'नक्षत्र': 'नक्षत्र (Nakshatra): 27 तारा समूह जो चंद्रमा की स्थिति पर आधारित होते हैं और व्यक्तित्व व समय का गहरा विवरण देते हैं।',
  'ग्रह': 'ग्रह (Graha): सूर्य, चंद्रमा, मंगल आदि जो व्यक्ति के कर्मों और भाग्य का संचालन करते हैं।',
  'कुंडली': 'कुंडली (Kundli): जन्म के समय ग्रहों का आकाश में सटीक नक्शा।',
  'कुण्डली': 'कुण्डली (Kundli): जन्म के समय ग्रहों का आकाश में सटीक नक्शा।'
};

function processGlossaryTerms(text: string): string {
  if (!text) return text;
  let processed = text;
  const terms = Object.keys(ASTRO_GLOSSARY).sort((a, b) => b.length - a.length);
  
  terms.forEach(term => {
    // Only replace outside of Markdown links/headers etc. 
    // This regex ensures we only match whole words surrounded by space or punctuation.
    const regex = new RegExp(`(^|\\s|[\\.,;:'"(\\[।\\-])(${term})(?=\\s|$|[\\.,;:'"\\]।\\-])`, 'gu');
    processed = processed.replace(regex, `$1[$2](#glossary:$2)`);
  });
  
  return processed;
}

const GlossaryTooltip = ({ term, children }: { term: string, children: React.ReactNode }) => {
  const explanation = ASTRO_GLOSSARY[term] || 'Astrology term';
  
  return (
    <span className="relative inline-block group cursor-help text-[#F27D26] border-b justify-center items-center border-dashed border-[#F27D26]/50 hover:bg-[#F27D26]/10 transition-colors rounded px-0.5">
      {children}
      <span className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#111] text-[#E4E3E0] text-xs font-sans font-normal leading-relaxed text-left rounded-xl shadow-[0_0_40px_rgba(242,125,38,0.15)] border border-white/10 pointer-events-none">
        {explanation}
        <svg className="absolute text-[#111] h-3 w-4 left-1/2 -translate-x-1/2 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
        </svg>
      </span>
    </span>
  );
};

export default function AstroDashboard() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "उदाहरण उपयोगकर्ता",
    gender: "Male",
    location: "नई दिल्ली, भारत",
    year: 2005,
    month: 12,
    day: 31,
    hour: 11,
    minute: 20,
    lat: 23.91,
    lng: 76.91,
    timezone: 5.5,
    report_type: "सामान्य",
    question: "",
    useAI: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // PROD RULE: Zero API Calls for core calculation
      // We run the NavaAstroSDK directly in the browser.
      const sdk = new NavaAstroSDK();
      const analysis = await sdk.analyze({
        year: formData.year,
        month: formData.month,
        day: formData.day,
        hour: formData.hour,
        minute: formData.minute,
        lat: formData.lat,
        lng: formData.lng,
        timezone: formData.timezone,
        report_type: formData.report_type,
        gender: formData.gender,
        birthLocation: formData.location,
        ayanamsa: 'LAHIRI'
      });

      let finalAIReport = analysis.aiReport;

      // Question handling
      if (formData.question && formData.question.trim().length > 0) {
        if (formData.useAI) {
          // CALL CLOUDFLARE AI SEARCH (Backend Unified Engine)
          try {
            const aiSearchRes = await fetch('/api/ai-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question: formData.question,
                math_data: analysis.math
              })
            });
            const aiSearchResult = await aiSearchRes.json() as any;
            
            if (aiSearchResult.answer) {
              finalAIReport = `### 🔍 Cloudflare Native AI Search (April 16 Update - BETA)\n\n**प्रश्न:** ${formData.question}\n\n**उत्तर:**\n${aiSearchResult.answer}\n\n---\n\n` + finalAIReport;
            }
          } catch (genErr) {
            console.error("Cloudflare AI Search Error:", genErr);
            finalAIReport = `### ❓ Cloudflare Native AI Search (BETA) - ERROR\n\n**प्रश्न:** ${formData.question}\n\n*(Cloudflare Native AI से उत्तर प्राप्त करने में तकनीकी समस्या हुई। क्योंकि यह फ़ीचर अभी Beta में है, यह कभी-कभी अनुपलब्ध हो सकता है।)*\n\n---\n\n` + finalAIReport;
          }
        } else {
           // Powerful Custom SDK Heuristic Response (Offline/No-AI mode)
           const hAnswer = sdk.resolveQuestionHeuristically(formData.question, analysis.math);
           finalAIReport = `### 🔍 आपके प्रश्न का उत्तर (Custom SDK: ON)\n\n${hAnswer}\n\n---\n\n` + finalAIReport;
        }
      }

      // Align with the standardized 'AnalysisResult' structure
      setReport({
        math: analysis.math,
        analysis: {
          activeRules: analysis.activeRules,
          aiReport: finalAIReport
        }
      });
    } catch (err: any) {
      console.error("Local Analysis Error:", err);
      // Fallback for visual demo if something breaks locally
      setReport({
        math: {
          planets: {
            'Sun': { name: 'Sun', longitude: 10.5, sign: 1, house: 1, is_retrograde: false },
            'Moon': { name: 'Moon', longitude: 155.2, sign: 6, house: 10, is_retrograde: false },
          },
          houses: {}
        },
        analysis: {
          activeRules: [{ name: "System Error", category: "Engine" }],
          aiReport: "Local calculation failed. Please check console."
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#F27D26] to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-[#F27D26] to-transparent rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F27D26] rounded-lg">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs font-mono tracking-widest uppercase opacity-60">सिस्टम // NavaAstro v4.0</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-medium tracking-tighter leading-none mb-4 italic serif">
            वैदिक <span className="text-[#F27D26]">ज्योतिष</span>
          </h1>
          <p className="text-lg opacity-60 max-w-2xl font-light">
            एक अत्याधुनिक और पूर्णत: ऑटोनॉमस ज्योतिष इंजन। किसी भी बाहरी API के बिना उच्च-सटीकता वाला व्यक्तिगत मार्गदर्शन।
          </p>
        </header>

        <div className="grid lg:grid-cols-[400px_1fr] gap-12">
          {/* Input Panel */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#F27D26]" /> जन्म विवरण
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">पूरा नाम</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none transition-all"
                  suppressHydrationWarning
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">लिंग (Gender)</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 appearance-none outline-none focus:ring-1 focus:ring-[#F27D26]"
                    suppressHydrationWarning
                  >
                    <option value="Male">पुरुष (Male)</option>
                    <option value="Female">स्त्री (Female)</option>
                    <option value="Other">अन्य (Other)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">जन्म स्थान (City)</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Delhi, India"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none transition-all"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">वर्ष</label>
                  <input type="number" 
                    value={formData.year}
                    onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-2 text-center" 
                    suppressHydrationWarning
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">माह</label>
                  <input type="number" 
                    value={formData.month}
                    onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-2 text-center" 
                    suppressHydrationWarning
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">दिन</label>
                  <input type="number" 
                    value={formData.day}
                    onChange={e => setFormData({...formData, day: parseInt(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-2 text-center" 
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">घंटा (Hour)</label>
                  <input type="number" 
                    value={formData.hour}
                    onChange={e => setFormData({...formData, hour: parseInt(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4" 
                    suppressHydrationWarning
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">मिनट (Min)</label>
                  <input type="number" 
                    value={formData.minute}
                    onChange={e => setFormData({...formData, minute: parseInt(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4" 
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">अक्षांश (Latitude)</label>
                  <input type="number" step="0.0001"
                    value={formData.lat}
                    onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4" 
                    suppressHydrationWarning
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider opacity-50 block">देशांतर (Longitude)</label>
                  <input type="number" step="0.0001"
                    value={formData.lng}
                    onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4" 
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">टाइमज़ोन और ऑफसेट (Timezone Offset, e.g. +5.5)</label>
                <input type="number" step="0.1"
                  value={formData.timezone}
                  onChange={e => setFormData({...formData, timezone: parseFloat(e.target.value)})}
                  placeholder="e.g. 5.5 for India"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none"
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">विश्लेषण का विषय</label>
                <select 
                  value={formData.report_type}
                  onChange={e => setFormData({...formData, report_type: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 appearance-none"
                  suppressHydrationWarning
                >
                  <option value="Career">करियर</option>
                  <option value="Marriage">विवाह</option>
                  <option value="Spiritual">अध्यात्म</option>
                  <option value="General">सामान्य</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider opacity-50 block">अपना विशिष्ट प्रश्न पूछें (Optional)</label>
                <textarea 
                  value={formData.question}
                  onChange={e => setFormData({...formData, question: e.target.value})}
                  placeholder="उदा. 'क्या मुझे इस वर्ष विदेश जाने का अवसर मिलेगा?' या 'मेरे विवाह का सही समय क्या है?'"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none min-h-[80px]"
                  suppressHydrationWarning
                />
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer select-none"
                   onClick={() => setFormData({...formData, useAI: !formData.useAI})}>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.useAI ? 'bg-[#F27D26]' : 'bg-gray-600'}`}>
                  <motion.div 
                    animate={{ x: formData.useAI ? 22 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full"
                  />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider">AI विश्लेषण का उपयोग करें</span>
                <Sparkles className={`w-4 h-4 ${formData.useAI ? 'text-[#F27D26]' : 'text-gray-600'}`} />
              </div>

              <button 
                disabled={loading}
                className="w-full bg-[#F27D26] text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#ff8e3d] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>कुण्डली का विश्लेषण करें <ChevronRight className="w-5 h-5" /></>}
              </button>
            </form>
          </section>

          {/* Results Panel */}
          <section className="min-h-[600px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative">
            <AnimatePresence mode="wait">
              {!report ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                >
                  <MapIcon className="w-12 h-12 mb-4 opacity-20" />
                  <h3 className="text-xl font-medium mb-2 opacity-40">गणना की प्रतीक्षा है</h3>
                  <p className="max-w-xs opacity-30 text-sm">डायनामिक नियम और ज्योतिष विश्लेषण शुरू करने के लिए अपना जन्म विवरण दर्ज करें।</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 md:p-12 space-y-12"
                >
                  {/* Planetary Grid */}
                  <div>
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                      <Briefcase className="w-5 h-5 text-[#F27D26]" />
                      <h3 className="text-sm font-mono tracking-widest uppercase">जन्म कुण्डली (D1) व ग्रहों की स्थिति</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.values(report.math.planets).map((p: any) => {
                        const hindiMap: any = {
                          'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
                          'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि',
                          'Rahu': 'राहु', 'Ketu': 'केतु', 'Ascendant': 'लग्न'
                        };
                        return (
                          <div key={p.name} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-[#F27D26]/30 transition-colors cursor-default">
                            <p className="text-[10px] uppercase opacity-40 mb-1">{hindiMap[p.name] || p.name}</p>
                            <p className="text-lg font-mono tracking-tight">{p.longitude.toFixed(2)}&deg;</p>
                            <p className="text-[10px] opacity-60">भाव (House) {p.house} / राशि {p.sign}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navamsha and Dashas Row */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {report.math.d9Planets && (
                      <div>
                         <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                           <Globe className="w-4 h-4 text-[#F27D26]" />
                           <h3 className="text-xs font-mono tracking-widest uppercase">नवमांश (D9)</h3>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           {Object.values(report.math.d9Planets).slice(0, 4).map((p: any) => {
                             const hindiMap: any = {
                               'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
                               'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि',
                               'Rahu': 'राहु', 'Ketu': 'केतु', 'Ascendant': 'लग्न'
                             };
                             return (
                               <div key={p.name} className="bg-white/5 p-2 rounded border border-white/5">
                                 <p className="text-[10px] opacity-50">{hindiMap[p.name] || p.name}</p>
                                 <p className="text-sm font-mono">राशि {p.sign}</p>
                               </div>
                             );
                           })}
                         </div>
                      </div>
                    )}
                    
                    {report.math.dasha && (
                      <div>
                         <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                           <Clock className="w-4 h-4 text-[#F27D26]" />
                           <h3 className="text-xs font-mono tracking-widest uppercase">वर्तमान महादशा</h3>
                         </div>
                         <div className="bg-[#F27D26]/10 p-4 rounded-xl border border-[#F27D26]/30">
                            <p className="text-sm opacity-60 mb-1">महादशा स्वामी</p>
                            <p className="text-2xl font-serif text-[#F27D26]">{report.math.dasha.currentLord}</p>
                            <div className="mt-4 h-1 w-full bg-black/40 rounded overflow-hidden">
                              <div className="h-full bg-[#F27D26]" style={{ width: `${(report.math.dasha.balanceFraction * 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] font-mono opacity-40 mt-2 text-right">दशा प्रगति</p>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Active Rules / Yogas */}
                  <div>
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                      <Sparkles className="w-5 h-5 text-[#F27D26]" />
                      <h3 className="text-sm font-mono tracking-widest uppercase">निर्मित योग (सक्रिय ज्योतिष नियम)</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {report.analysis.activeRules.map((y: any) => (
                        <div key={y.name} className="px-4 py-2 bg-[#F27D26]/10 border border-[#F27D26]/30 rounded-full text-xs text-[#F27D26] font-medium">
                          {y.name} <span className="opacity-50 ml-1">[{y.category}]</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Report */}
                  <div>
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                      <Activity className="w-5 h-5 text-[#F27D26]" />
                      <h3 className="text-sm font-mono tracking-widest uppercase">विस्तृत ज्योतिषीय विश्लेषण (AI Report)</h3>
                    </div>
                    <div className="prose prose-invert prose-orange max-w-none prose-p:leading-relaxed prose-headings:font-medium prose-h2:text-[#F27D26] prose-h3:text-orange-300">
                      <div className="markdown-body">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => {
                              if (props.href && props.href.startsWith('#glossary:')) {
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
                  </div>

                  {/* SDK Integration Snippet */}
                  <div className="pt-8 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <FileJson className="w-4 h-4 text-[#F27D26]" />
                      <h3 className="text-xs font-mono tracking-widest uppercase opacity-60">डेवलपर एसडीके (SDK) कोड</h3>
                    </div>
                    <div className="bg-black/60 rounded-xl p-4 font-mono text-[11px] overflow-x-auto border border-white/5">
                      <pre className="text-blue-300">
{`// Install: npm install @nava-astro/sdk
import { NavaAstroSDK } from '@nava-astro/sdk';

const sdk = new NavaAstroSDK({ apiKey: 'YOUR_KEY' });
const result = await sdk.analyze({
  year: 1990, month: 5, day: 15,
  hour: 10, minute: 30,
  lat: 40.7128, lng: -74.006,
  report_type: 'Career'
});

console.log(result.activeRules);`}
                      </pre>
                    </div>
                  </div>

                  {/* Raw Data Toggle */}
                  <div className="pt-8 opacity-30 hover:opacity-100 transition-opacity">
                    <button className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase">
                      <FileJson className="w-4 h-4" /> कच्चा डेटा देखें (Inspect Raw Trace)
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xs opacity-40 font-mono">
          &copy; 2026 NAVAASTRO CORP // SECURE EDGE INFRASTRUCTURE
        </div>
        <div className="flex gap-8 text-[10px] uppercase tracking-widest font-medium opacity-50">
          <a href="#" className="hover:text-[#F27D26] transition-colors">Documentation</a>
          <a href="#" className="hover:text-[#F27D26] transition-colors">API Keys</a>
          <a href="#" className="hover:text-[#F27D26] transition-colors">Status</a>
        </div>
      </footer>
    </div>
  );
}
