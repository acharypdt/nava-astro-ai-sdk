import React from 'react';
import { DashaInfo } from '@nava-astro/core';

interface DashaTimelineProps {
  dasha: DashaInfo;
}

const dashaColors: Record<string, string> = {
  Sun: 'bg-yellow-500', Moon: 'bg-white', Mars: 'bg-red-500',
  Mercury: 'bg-green-400', Jupiter: 'bg-yellow-600', Venus: 'bg-pink-400',
  Saturn: 'bg-blue-800', Rahu: 'bg-purple-600', Ketu: 'bg-gray-500'
};

export function DashaTimeline({ dasha }: DashaTimelineProps) {
  const color = dashaColors[dasha.currentLord] || 'bg-[#F27D26]';
  const progress = Math.round(dasha.balanceFraction * 100);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
      <div className="text-sm font-medium text-white mb-2">
        महादशा: {dasha.currentLord}
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="text-xs text-white/50 mt-1">प्रगति: {progress}%</div>
    </div>
  );
}
