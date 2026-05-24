import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans flex flex-col items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#F27D26] to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-[#F27D26] to-transparent rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 text-center max-w-2xl px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-[#F27D26] rounded-xl">
            <Sparkles className="w-8 h-8 text-black" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-none mb-6">
          नव-<span className="text-[#F27D26]">एस्ट्रो</span>
        </h1>
        <p className="text-lg opacity-60 mb-8">
          स्वदेशी और स्वायत्त वैदिक ज्योतिष इंजन — 100% स्वतंत्र
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/kundali"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#F27D26] text-black font-semibold rounded-xl hover:bg-[#ff8e3d] transition-all"
          >
            <Sparkles className="w-5 h-5" />
            कुंडली देखें
          </Link>
          <Link
            href="/kundali"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
          >
            डैशबोर्ड खोलें
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          {[
            { value: '100%', label: 'स्वायत्त इंजन' },
            { value: '9', label: 'ग्रह' },
            { value: '24/7', label: 'उपलब्ध' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-medium text-[#F27D26]">{s.value}</div>
              <div className="text-xs opacity-50 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <footer className="mt-16 text-xs opacity-30 font-mono">
          AGPL-3.0 · NavaAstro · v4.2.0
        </footer>
      </main>
    </div>
  );
}
