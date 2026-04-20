/**
 * @file lib/astro-core.ts
 * @description Astronomical engine powered by astronomy-engine library.
 * Provides high-precision planetary positions for astrology.
 */

import { AstroChartData } from './evaluator';
import { 
  Body, 
  GeoVector,
  Ecliptic,
  Observer, 
  SiderealTime 
} from 'astronomy-engine';

export interface CalculationParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat: number;
  lng: number;
  ayanamsa: string;
}

/**
 * Calculates Ayanamsa offset (Lahiri approximation)
 */
function getAyanamsaOffset(year: number): number {
  // Lahiri Ayanamsa is ~23.85 degrees in 1950, increases ~50.3" arc per year.
  const referenceYear = 1950;
  const referenceValue = 23.85;
  const annualPrecession = 50.3 / 3600; // Degrees per year
  return referenceValue + (year - referenceYear) * annualPrecession;
}

/**
 * Calculate chart using high-precision astronomy-engine
 */

function calculatePlanetaryPositions(date: Date, ayanamsa: number, lat: number, lng: number) {
  const bodies = [
    { name: 'Sun', key: Body.Sun },
    { name: 'Moon', key: Body.Moon },
    { name: 'Mars', key: Body.Mars },
    { name: 'Mercury', key: Body.Mercury },
    { name: 'Jupiter', key: Body.Jupiter },
    { name: 'Venus', key: Body.Venus },
    { name: 'Saturn', key: Body.Saturn }
  ];

  const planets: any = {};

  bodies.forEach(b => {
    // Get geocentric equatorial coordinates
    const geoVector = GeoVector(b.key, date, true);
    // Convert to ecliptic coordinates
    const ecliptic = Ecliptic(geoVector);
    
    let tropicalLong = ecliptic.elon;

    // Convert to Sidereal (Ayanamsa adjustment)
    let siderealLong = (tropicalLong - ayanamsa) % 360;
    if (siderealLong < 0) siderealLong += 360;

    const sign = Math.floor(siderealLong / 30) + 1;
    planets[b.name] = {
      name: b.name,
      longitude: siderealLong,
      sign,
      house: sign, // Will be overridden if Lagna is passed
      is_retrograde: false 
    };
  });

  // Calculate Mean Rahu and Ketu
  const epoch = new Date("2000-01-01T12:00:00Z").getTime();
  const daysSinceEpoch = (date.getTime() - epoch) / 86400000.0;
  let meanRahu = (125.044522 - 0.0529539 * daysSinceEpoch) % 360.0;
  if (meanRahu < 0) meanRahu += 360.0;
  
  let meanKetu = (meanRahu + 180.0) % 360.0;

  // Convert to Sidereal
  let siderealRahu = (meanRahu - ayanamsa) % 360;
  if (siderealRahu < 0) siderealRahu += 360;
  
  let siderealKetu = (meanKetu - ayanamsa) % 360;
  if (siderealKetu < 0) siderealKetu += 360;

  planets['Rahu'] = {
    name: 'Rahu',
    longitude: siderealRahu,
    sign: Math.floor(siderealRahu / 30) + 1,
    house: Math.floor(siderealRahu / 30) + 1,
    is_retrograde: true
  };

  planets['Ketu'] = {
    name: 'Ketu',
    longitude: siderealKetu,
    sign: Math.floor(siderealKetu / 30) + 1,
    house: Math.floor(siderealKetu / 30) + 1,
    is_retrograde: true
  };

  // Calculate Ascendant (Lagna) - Using Local Sidereal Time
  const gst = SiderealTime(date); // Greenwish Sidereal Time
  const lst = (gst + lng / 15) % 24; 
  const ramc = lst * 15; 

  const ecl = 23.439; 
  const sinL = Math.sin(ramc * Math.PI / 180) * Math.cos(ecl * Math.PI / 180);
  const cosL = Math.cos(ramc * Math.PI / 180);
  let lagnaTropical = Math.atan2(sinL, cosL) * 180 / Math.PI;
  if (lagnaTropical < 0) lagnaTropical += 360;

  let lagnaSidereal = (lagnaTropical - ayanamsa) % 360;
  if (lagnaSidereal < 0) lagnaSidereal += 360;

  const finalLagnaSign = Math.floor(lagnaSidereal / 30) + 1;

  // Correct houses based on Lagna (Whole Sign System)
  Object.keys(planets).forEach(pName => {
    let house = planets[pName].sign - finalLagnaSign + 1;
    if (house < 1) house += 12;
    planets[pName].house = house;
  });

  return { planets, finalLagnaSign, lagnaSidereal };
}

function calculateCurrentDasha(moonLongitude: number, birthDateObj: Date): { currentLord: string, balanceFraction: number } {
  const dashaPeriods = [
    { lord: 'Ketu', years: 7 }, { lord: 'Venus', years: 20 }, { lord: 'Sun', years: 6 },
    { lord: 'Moon', years: 10 }, { lord: 'Mars', years: 7 }, { lord: 'Rahu', years: 18 },
    { lord: 'Jupiter', years: 16 }, { lord: 'Saturn', years: 19 }, { lord: 'Mercury', years: 17 }
  ];
  
  const nakshatraExact = moonLongitude / (360 / 27);
  const nakshatraIndex = Math.floor(nakshatraExact);
  const fractionLeft = 1 - (nakshatraExact - nakshatraIndex);

  let dashaIndex = nakshatraIndex % 9;
  const startingLord = dashaPeriods[dashaIndex];
  const balanceYears = fractionLeft * startingLord.years;

  const ageInYears = (Date.now() - birthDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  let accumulatedYears = balanceYears;
  if (ageInYears < accumulatedYears) {
    return { currentLord: startingLord.lord, balanceFraction: 1 - (ageInYears / balanceYears) };
  }

  let currentIndex = (dashaIndex + 1) % 9;
  while (true) {
    if (ageInYears < accumulatedYears + dashaPeriods[currentIndex].years) {
      const yearsIntoDasha = ageInYears - accumulatedYears;
      return { 
        currentLord: dashaPeriods[currentIndex].lord, 
        balanceFraction: 1 - (yearsIntoDasha / dashaPeriods[currentIndex].years) 
      };
    }
    accumulatedYears += dashaPeriods[currentIndex].years;
    currentIndex = (currentIndex + 1) % 9;
  }
}

export async function calculateChart(params: CalculationParams): Promise<AstroChartData> {
  const birthDate = new Date(Date.UTC(params.year, params.month - 1, params.day, params.hour, params.minute));
  const ayanamsa = getAyanamsaOffset(params.year);

  // 1. D1 Chart (Natal)
  const { planets, finalLagnaSign, lagnaSidereal } = calculatePlanetaryPositions(birthDate, ayanamsa, params.lat, params.lng);

  // 2. D9 Chart (Navamsha)
  const d9Planets: any = {};
  
  Object.keys(planets).forEach(k => {
    const p = planets[k];
    // In D9, 1 Navamsha = 3 degrees 20 minutes (10/3 degrees).
    // The exact continuous mapping is (Longitude * 9) % 360 mapped to the 12 signs.
    const navamshaAbsoluteLongitude = (p.longitude * 9) % 360;
    const d9Sign = Math.floor(navamshaAbsoluteLongitude / 30) + 1;
    d9Planets[k] = { name: p.name, sign: d9Sign, house: d9Sign, longitude: navamshaAbsoluteLongitude, is_retrograde: p.is_retrograde }; 
  });

  // Calculate D9 Lagna precisely using real sidereal degree of Lagna
  const navamshaLagnaLongitude = (lagnaSidereal * 9) % 360;
  const d9LagnaSign = Math.floor(navamshaLagnaLongitude / 30) + 1;
  d9Planets['Ascendant'] = { name: 'Ascendant', sign: d9LagnaSign, house: 1, longitude: navamshaLagnaLongitude, is_retrograde: false };

  Object.keys(d9Planets).forEach(k => {
    let house = d9Planets[k].sign - d9LagnaSign + 1;
    if (house < 1) house += 12;
    d9Planets[k].house = house;
  });

  // 3. Current Transit (Gochar)
  const nowDate = new Date();
  const nowAyanamsa = getAyanamsaOffset(nowDate.getUTCFullYear());
  const { planets: transits } = calculatePlanetaryPositions(nowDate, nowAyanamsa, params.lat, params.lng);

  const simplifiedTransits: any = {};
  Object.keys(transits).forEach(k => {
    simplifiedTransits[k] = { name: transits[k].name, sign: transits[k].sign };
  });

  // 4. Current Vimshottari Dasha
  const dasha = calculateCurrentDasha(planets['Moon'].longitude, birthDate);

  // 5. House Lords Calculation (Vedic Whole Sign)
  const signRulers: Record<number, string> = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
    7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
  };

  const houseLords: any = {};
  const houseData: any = {};
  for (let h = 1; h <= 12; h++) {
    const sign = (finalLagnaSign - 1 + h - 1) % 12 + 1;
    houseLords[h] = { planet: signRulers[sign], sign };
    houseData[h] = { cusp: (sign - 1) * 30, sign };
  }

  const d9HouseLords: any = {};
  for (let h = 1; h <= 12; h++) {
    const sign = (d9LagnaSign - 1 + h - 1) % 12 + 1;
    d9HouseLords[h] = { planet: signRulers[sign], sign };
  }

  return {
    planets,
    d9Planets,
    transits: simplifiedTransits,
    dasha,
    houses: houseData,
    houseLords,
    d9HouseLords
  };
}

/**
 * Auth and Hashing (Production Ready)
 */
import { SignJWT, jwtVerify } from 'jose';

export async function createToken(payload: any, secret: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret));
}

export async function verifyToken(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

