import React from 'react';
import { YogaResult } from '@nava-astro/core';
import { Badge } from './Badge';

interface YogaListProps {
  yogas: YogaResult[];
}

const categoryVariant: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  सफलता: 'success',
  'धन और कर्म': 'success',
  धन: 'success',
  ज्ञान: 'success',
  बुद्धि: 'success',
  नेतृत्व: 'warning',
  बल: 'warning',
  सुख: 'default',
  प्रतिष्ठा: 'warning',
  'धन और यश': 'success',
  राजयोग: 'warning',
  'कर्म और मोक्ष': 'default',
};

export function YogaList({ yogas }: YogaListProps) {
  if (yogas.length === 0) {
    return <div className="text-sm text-white/50 italic">कोई विशेष योग सक्रिय नहीं है</div>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {yogas.map((yoga, i) => (
        <Badge key={i} variant={categoryVariant[yoga.category] || 'default'}>
          {yoga.name}
        </Badge>
      ))}
    </div>
  );
}
