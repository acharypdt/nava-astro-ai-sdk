import React from 'react';
import { AstroChartData } from '@nava-astro/core';

const HINDI_SIGNS = ['', 'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];
const HINDI_PLANETS: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु'
};

interface KundaliChartProps {
  data: AstroChartData;
}

export function KundaliChart({ data }: KundaliChartProps) {
  const planets = Object.entries(data.planets).filter(([name]) => name !== 'Ascendant');
  const houses = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {planets.map(([name, p]) => (
        <div key={name} className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="text-[#F27D26] text-sm font-semibold">{HINDI_PLANETS[name] || name}</div>
          <div className="text-xs text-white/50 mt-1">
            {p.house}वें भाव • {HINDI_SIGNS[p.sign]} ({p.sign})
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            {p.longitude.toFixed(2)}° {p.is_retrograde ? '🔴 वक्री' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

interface PlanetPositionProps {
  name: string;
  sign: number;
  house: number;
  longitude: number;
  isRetrograde: boolean;
}

export function PlanetPosition({ name, sign, house, longitude, isRetrograde }: PlanetPositionProps) {
  return (
    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-lg p-3">
      <div className="w-10 h-10 rounded-full bg-[#F27D26]/10 flex items-center justify-center text-[#F27D26] font-bold text-sm">
        {HINDI_PLANETS[name]?.charAt(0) || name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{HINDI_PLANETS[name] || name}</div>
        <div className="text-xs text-white/50">
          {HINDI_SIGNS[sign]} • {house}वाँ भाव
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-mono text-white/70">{longitude.toFixed(1)}°</div>
        {isRetrograde && <div className="text-[10px] text-red-400">वक्री</div>}
      </div>
    </div>
  );
}
