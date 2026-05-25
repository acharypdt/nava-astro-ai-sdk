import React from 'react';
import { MuhurtaResult } from '@nava-astro/core';

interface MuhurtaCardProps {
  result: MuhurtaResult;
}

export function MuhurtaCard({ result }: MuhurtaCardProps) {
  const scoreColor = result.score >= 80 ? 'text-green-400' : result.score >= 60 ? 'text-[#F27D26]' : 'text-yellow-400';

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-white/50">{new Date(result.startISO).toLocaleString('hi-IN')}</div>
        <div className={`text-lg font-bold ${scoreColor}`}>{result.score}/100</div>
      </div>
      <div className="flex gap-4 text-xs text-white/70">
        <span>तिथि: {result.tithi}</span>
        <span>नक्षत्र: {result.nakshatraName} ({result.nakshatra})</span>
      </div>
      {result.reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {result.reasons.map((r, i) => (
            <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded">{r}</span>
          ))}
        </div>
      )}
    </div>
  );
}
