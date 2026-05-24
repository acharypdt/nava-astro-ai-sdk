import { calculateChart, CalculationParams } from './astro-core';
import { AstroChartData } from './evaluator';

export interface MuhurtaRequest {
  rangeHours?: number; // hours to scan starting from the provided time (default 24)
  stepMinutes?: number; // sampling resolution in minutes (default 30)
  top?: number; // return top N results
  preferNakshatras?: number[]; // 1-27 nakshatra indices to prefer
  avoidTithis?: number[]; // tithi numbers (1-30) to avoid
}

export interface MuhurtaResult {
  startISO: string;
  score: number;
  tithi: number;
  nakshatra: number;
  nakshatraName: string;
  reasons: string[];
  chart?: AstroChartData; // optional detailed chart for the slot
}

const DEFAULT_FAVORABLE_NAKSHATRAS = [4, 8, 11, 12, 13, 15, 17]; // Rohini, Pushya, Purva Phalguni, Uttara Phalguni, Hasta, Swati, Anuradha
const DEFAULT_AVOID_TITHIS = [8, 30]; // Ashtami, Amavasya

const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha',
  'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha',
  'Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

function computeTithi(moonLon: number, sunLon: number): number {
  const diff = (moonLon - sunLon + 360) % 360;
  const tithi = Math.floor(diff / 12) + 1; // 1..30
  return tithi;
}

function computeNakshatra(moonLon: number): number {
  const idx = Math.floor(moonLon / (360 / 27));
  return (idx % 27) + 1; // 1..27
}

export async function findMuhurtas(baseParams: CalculationParams, opts: MuhurtaRequest = {}): Promise<MuhurtaResult[]> {
  const rangeHours = opts.rangeHours ?? 24;
  const stepMinutes = opts.stepMinutes ?? 30;
  const top = opts.top ?? 6;
  const preferNak = opts.preferNakshatras ?? DEFAULT_FAVORABLE_NAKSHATRAS;
  const avoidTithis = opts.avoidTithis ?? DEFAULT_AVOID_TITHIS;

  // Build starting Date in local (using provided params and timezone)
  const tz = baseParams.timezone !== undefined ? baseParams.timezone : 5.5;
  const startLocal = new Date(Date.UTC(baseParams.year, baseParams.month - 1, baseParams.day, baseParams.hour || 0, baseParams.minute || 0));
  // adjust for timezone back to local wall-clock
  const startMs = startLocal.getTime() - tz * 3600000;

  const slots: MuhurtaResult[] = [];
  const samples = Math.ceil((rangeHours * 60) / stepMinutes);

  for (let i = 0; i < samples; i++) {
    const slotMs = startMs + i * stepMinutes * 60000;
    const slotDate = new Date(slotMs + tz * 3600000); // convert back to UTC-based params

    const params: CalculationParams = {
      year: slotDate.getUTCFullYear(),
      month: slotDate.getUTCMonth() + 1,
      day: slotDate.getUTCDate(),
      hour: slotDate.getUTCHours(),
      minute: slotDate.getUTCMinutes(),
      lat: baseParams.lat,
      lng: baseParams.lng,
      timezone: tz,
      ayanamsa: baseParams.ayanamsa || 'LAHIRI',
      gender: baseParams.gender,
      birthLocation: baseParams.birthLocation
    };

    try {
      const chart = await calculateChart(params);
      const moon = chart.planets['Moon'];
      const sun = chart.planets['Sun'];
      if (!moon || !sun) continue;

      const tithi = computeTithi(moon.longitude, sun.longitude);
      const nak = computeNakshatra(moon.longitude);
      let score = 0;
      const reasons: string[] = [];

      // Nakshatra preferences
      if (preferNak.includes(nak)) {
        score += 4; reasons.push(`Nakshatra (${NAKSHATRA_NAMES[nak-1]}) is preferred`);
      } else if (DEFAULT_FAVORABLE_NAKSHATRAS.includes(nak)) {
        score += 2; reasons.push(`Nakshatra (${NAKSHATRA_NAMES[nak-1]}) is generally favorable`);
      }

      // Tithi avoidances
      if (avoidTithis.includes(tithi)) {
        score -= 6; reasons.push(`Tithi ${tithi} is avoided`);
      } else if (tithi === 15) {
        score += 1; reasons.push('Purnima (tithi 15) is acceptable');
      }

      // Moon strength heuristic: prefer Moon in Kendra/Trikona houses (1,4,7,10 or 1,5,9)
      const moonHouse = moon.house;
      if ([1,4,7,10].includes(moonHouse)) { score += 1; reasons.push('Moon in Kendra (favorable)'); }
      if ([5,9].includes(moonHouse)) { score += 1; reasons.push('Moon in Trikona (supportive)'); }

      // Transit quick checks: avoid if Saturn transiting over Moon sign (possible delay)
      const transitSaturn = chart.transits?.['Saturn'];
      if (transitSaturn && transitSaturn.sign === moon.sign) { score -= 2; reasons.push('Saturn transit over Moon sign'); }

      // Basic daylight preference: many muhurta prefer daytime; reward if local hour between 6-18
      const localHour = slotDate.getHours();
      if (localHour >= 6 && localHour <= 18) { score += 1; }

      slots.push({
        startISO: slotDate.toISOString(),
        score,
        tithi,
        nakshatra: nak,
        nakshatraName: NAKSHATRA_NAMES[nak-1],
        reasons,
        chart
      });
    } catch (e) {
      // skip slot on errors
      continue;
    }
  }

  // Sort by score (desc) then by earliest time
  slots.sort((a,b) => b.score - a.score || new Date(a.startISO).getTime() - new Date(b.startISO).getTime());

  return slots.slice(0, top);
}
