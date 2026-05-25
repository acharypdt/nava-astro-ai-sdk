import { calculateChart } from './astro-core';
import { MuhurtaRequest, MuhurtaResult, CalculationParams } from './types';

const DEFAULT_FAVORABLE_NAKSHATRAS = [4, 8, 11, 12, 13, 15, 17];
const DEFAULT_AVOID_TITHIS = [8, 30];
const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha',
  'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha',
  'Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

function computeNakshatra(moonLongitude: number): number {
  return Math.floor(moonLongitude / (360 / 27));
}

function computeTithi(moonLongitude: number, sunLongitude: number): number {
  const diff = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
  return Math.floor(diff / 12) + 1;
}

export async function findMuhurtas(
  baseParams: CalculationParams & { report_type?: string },
  opts: MuhurtaRequest = {}
): Promise<MuhurtaResult[]> {
  const rangeHours = opts.rangeHours || 24;
  const stepMinutes = opts.stepMinutes || 30;
  const top = opts.top || 5;
  const favorableNakshatras = opts.preferNakshatras || DEFAULT_FAVORABLE_NAKSHATRAS;
  const avoidTithis = opts.avoidTithis || DEFAULT_AVOID_TITHIS;

  const results: MuhurtaResult[] = [];
  const totalSlots = Math.floor((rangeHours * 60) / stepMinutes);

  const baseDate = new Date(baseParams.year, baseParams.month - 1, baseParams.day, baseParams.hour, baseParams.minute);

  for (let i = 0; i < totalSlots; i++) {
    const slotDate = new Date(baseDate.getTime() + i * stepMinutes * 60000);
    const slotParams: CalculationParams = {
      year: slotDate.getFullYear(),
      month: slotDate.getMonth() + 1,
      day: slotDate.getDate(),
      hour: slotDate.getHours(),
      minute: slotDate.getMinutes(),
      lat: baseParams.lat,
      lng: baseParams.lng,
      timezone: baseParams.timezone || 5.5,
      ayanamsa: baseParams.ayanamsa || 'LAHIRI'
    };

    try {
      const chart = await calculateChart(slotParams);
      const moonLong = chart.planets['Moon']?.longitude || 0;
      const sunLong = chart.planets['Sun']?.longitude || 0;
      const nakshatraIndex = computeNakshatra(moonLong);
      const tithi = computeTithi(moonLong, sunLong);
      const moonSign = chart.planets['Moon']?.sign || 1;

      let score = 0;
      const reasons: string[] = [];

      if (favorableNakshatras.includes(nakshatraIndex + 1)) {
        score += 4;
        reasons.push(`शुभ नक्षत्र: ${NAKSHATRA_NAMES[nakshatraIndex]}`);
      } else {
        score += 2;
      }

      if (avoidTithis.includes(tithi)) {
        score -= 6;
        reasons.push(`बचने योग्य तिथि: ${tithi}`);
      } else if (tithi === 15) {
        score += 1;
        reasons.push('पूर्णिमा');
      }

      if ([1, 4, 7, 10].includes(moonSign)) {
        score += 1;
        reasons.push('चंद्रमा केंद्र राशि में');
      }
      if ([5, 9].includes(moonSign)) {
        score += 1;
        reasons.push('चंद्रमा त्रिकोण राशि में');
      }

      const transitSaturn = chart.transits ? chart.transits['Saturn'] : null;
      if (transitSaturn && transitSaturn.sign === moonSign) {
        score -= 2;
        reasons.push('शनि चंद्रमा की राशि पर');
      }

      const slotHours = slotDate.getHours();
      if (slotHours >= 6 && slotHours <= 18) {
        score += 1;
        reasons.push('दिन का समय');
      }

      const normalizedScore = Math.max(0, Math.min(100, 50 + score * 5));

      results.push({
        startISO: slotDate.toISOString(),
        score: normalizedScore,
        tithi,
        nakshatra: nakshatraIndex + 1,
        nakshatraName: NAKSHATRA_NAMES[nakshatraIndex],
        reasons
      });
    } catch {
      continue;
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}
