import React from 'react';
import { SadeSatiResult, SadeSatiPhase } from '@nava-astro/core';
import { Badge } from './Badge';

interface SadeSatiPhaseProps {
  sadeSati: SadeSatiResult;
}

const phaseIcons: Record<string, string> = {
  first_dhaiya: '🌙',
  middle_dhaiya: '☀️',
  last_dhaiya: '🌑',
};

export function SadeSatiPhaseView({ sadeSati }: SadeSatiPhaseProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Badge variant={sadeSati.isActive ? 'warning' : 'success'}>
          {sadeSati.isActive ? '⚠️ साढ़ेसाती सक्रिय' : '✅ साढ़ेसाती नहीं'}
        </Badge>
        <span className="text-xs text-white/50">
          चंद्र: {sadeSati.moonSignName} • शनि: {sadeSati.saturnSignName}
        </span>
      </div>

      {sadeSati.phases.map((phase: SadeSatiPhase) => {
        const isCurrent = sadeSati.currentPhase?.phase === phase.phase;
        const isPast = !isCurrent && new Date(phase.endDate) < new Date();
        return (
          <div
            key={phase.phase}
            className={`border rounded-xl p-4 transition-all ${
              isCurrent ? 'bg-[#F27D26]/10 border-[#F27D26]/30' :
              isPast ? 'bg-white/5 border-white/5 opacity-50' :
              'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{phaseIcons[phase.phase] || '📅'}</span>
                <span className="text-sm font-medium">{phase.name}</span>
              </div>
              {isCurrent && <span className="text-[10px] text-[#F27D26] font-semibold">वर्तमान</span>}
            </div>
            <div className="text-xs text-white/50">
              {phase.startDate} → {phase.endDate}
            </div>
            <div className="text-xs text-white/70 mt-1">{phase.description}</div>
          </div>
        );
      })}

      {sadeSati.predictions.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">भविष्यवाणी</div>
          {sadeSati.predictions.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-white/80 mb-1">
              <span className="text-[#F27D26] mt-0.5">▸</span>
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
