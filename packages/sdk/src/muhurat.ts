import { calculateChart } from './astro-core';
import { MuhurtaRequest, MuhurtaResult, CalculationParams } from './types';

const DEFAULT_FAVORABLE_NAKSHATRAS = [4, 8, 11, 12, 13, 15, 17];
const DEFAULT_AVOID_TITHIS = [8, 30];
const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha',
  'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha',
  'Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

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
      const moonSign = chart.planets['Moon']?.sign || 1;
      const moonLong = chart.planets['Moon']?.longitude || 0;
      const nakshatraIndex = Math.floor(moonLong / (360 / 27));
      const tithi = (Math.floor(moonLong / 12) % 30) + 1;

      let score = 50;
      const reasons: string[] = [];

      if (favorableNakshatras.includes(nakshatraIndex + 1)) {
        score += 20;
        reasons.push(`शुभ नक्षत्र: ${NAKSHATRA_NAMES[nakshatraIndex]}`);
      }

      if (!avoidTithis.includes(tithi)) {
        score += 10;
      } else {
        score -= 20;
        reasons.push(`बचने योग्य तिथि: ${tithi}`);
      }

      if (moonSign >= 4 && moonSign <= 9) {
        score += 15;
        reasons.push('चंद्रमा मजबूत राशि में');
      }

      const transitSaturn = chart.transits ? chart.transits['Saturn'] : null;
      if (transitSaturn && Math.abs(transitSaturn.sign - moonSign) >= 3) {
        score += 10;
        reasons.push('शनि दृष्टि से मुक्त');
      }

      const slotHours = slotDate.getHours();
      if (slotHours >= 6 && slotHours <= 18) {
        score += 5;
        reasons.push('दिन का समय');
      }

      results.push({
        startISO: slotDate.toISOString(),
        score: Math.min(score, 100),
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
