import { AstroChartData, CalculationParams } from './types';
import { 
  Body, GeoVector, Ecliptic, Observer, SiderealTime 
} from 'astronomy-engine';

const PLANET_BODIES: Record<string, Body> = {
  'Sun': Body.Sun, 'Moon': Body.Moon, 'Mars': Body.Mars,
  'Mercury': Body.Mercury, 'Jupiter': Body.Jupiter,
  'Venus': Body.Venus, 'Saturn': Body.Saturn
};

const ZODIAC_SIGNS = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];

const SIGN_RULERS: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
  7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
};

const NAKSHATRA_LORD_CYCLE = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'
];

function calculateAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (22.463 + 0.01023 * (T + 1)) * 3600;
}

function toDMS(deg: number): string {
  const d = Math.floor(Math.abs(deg));
  const m = Math.floor((Math.abs(deg) - d) * 60);
  const s = ((Math.abs(deg) - d - m / 60) * 3600).toFixed(2);
  return `${deg < 0 ? '-' : ''}${d}°${m}'${s}"`;
}

function posMod(n: number, m: number = 12): number {
  return ((n % m) + m) % m;
}

export async function calculateChart(params: CalculationParams): Promise<AstroChartData> {
  const { year, month, day, hour, minute, lat, lng, timezone = 5.5, ayanamsa = 'LAHIRI' } = params;
  const jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) + Math.floor(275 * month / 9) + day + 1721013.5 + ((hour + minute / 60 - timezone) / 24);

  const jdUt = jd;
  const ayanamsaSec = ayanamsa === 'LAHIRI' ? calculateAyanamsa(jdUt) : 0;
  const ayanamsaDeg = ayanamsaSec / 3600;

  const observer = new Observer(lat, lng, 0);
  const lstHours = SiderealTime(jdUt);
  const lstDeg = lstHours * 15;

  const planets: AstroChartData['planets'] = {};
  let ascLongitude = 0;

  for (const [name, body] of Object.entries(PLANET_BODIES)) {
    try {
      const vector = GeoVector(body, jdUt, true);
      const eq = Ecliptic(vector);
      const geoLong = Math.atan2(eq.vec.y, eq.vec.x) * (180 / Math.PI);
      const correctedLong = ((geoLong - ayanamsaDeg) % 360 + 360) % 360;
      const sign = Math.floor(correctedLong / 30) + 1;
      const house = ((Math.floor((correctedLong - ascLongitude) / 30) % 12) + 12) % 12 + 1;

      planets[name] = {
        name, longitude: correctedLong,
        sign, house, is_retrograde: false,
      };
    } catch { continue; }
  }

  const ascGeoLong = lstDeg;
  ascLongitude = ((ascGeoLong - ayanamsaDeg) % 360 + 360) % 360;
  const ascSign = Math.floor(ascLongitude / 30) + 1;
  planets['Ascendant'] = { name: 'Ascendant', longitude: ascLongitude, sign: ascSign, house: 1, is_retrograde: false };

  const rahuLong = ((0 - ayanamsaDeg) % 360 + 360) % 360;
  const rahuSign = Math.floor(rahuLong / 30) + 1;
  const rahuHouse = ((rahuSign - ascSign + 12) % 12) + 1;
  planets['Rahu'] = { name: 'Rahu', longitude: rahuLong, sign: rahuSign, house: rahuHouse, is_retrograde: false };

  const ketuLong = ((180 - ayanamsaDeg) % 360 + 360) % 360;
  const ketuSign = Math.floor(ketuLong / 30) + 1;
  const ketuHouse = ((ketuSign - ascSign + 12) % 12) + 1;
  planets['Ketu'] = { name: 'Ketu', longitude: ketuLong, sign: ketuSign, house: ketuHouse, is_retrograde: false };

  const houseData: AstroChartData['houses'] = {};
  for (let h = 1; h <= 12; h++) {
    const sign = (ascSign - 1 + h - 1) % 12 + 1;
    houseData[h] = { cusp: ((h - 1) * 30 + ascLongitude) % 360, sign };
  }

  const houseLords: Record<number, { planet: string; sign: number }> = {};
  for (let h = 1; h <= 12; h++) {
    const sign = houseData[h].sign;
    houseLords[h] = { planet: SIGN_RULERS[sign], sign };
  }

  const d9Planets: AstroChartData['d9Planets'] = {};
  for (const [name, p] of Object.entries(planets)) {
    if (name === 'Ascendant') continue;
    const d9Long = (p.longitude * 9) % 360;
    const d9Sign = Math.floor(d9Long / 30) + 1;
    const d9House = ((d9Sign - ascSign + 12) % 12) + 1;
    d9Planets[name] = { name, sign: d9Sign, house: d9House, longitude: d9Long };
  }

  const moonLong = planets['Moon']?.longitude || 0;
  const nakshatraIndex = Math.floor(moonLong / (360 / 27));
  const dashaLordIndex = nakshatraIndex % 9;
  const dashaLord = NAKSHATRA_LORD_CYCLE[dashaLordIndex];
  const dasha = {
    currentLord: dashaLord,
    balanceFraction: ((moonLong % (360 / 27)) / (360 / 27))
  };

  const now = new Date();
  const nowJd = 367 * now.getFullYear() - Math.floor(7 * (now.getFullYear() + Math.floor((now.getMonth() + 10) / 12)) / 4) + Math.floor(275 * (now.getMonth() + 1) / 9) + now.getDate() + 1721013.5 + ((now.getHours() + now.getMinutes() / 60) / 24);

  const simplifiedTransits: AstroChartData['transits'] = {};
  for (const [name, body] of Object.entries(PLANET_BODIES)) {
    try {
      const vector = GeoVector(body, nowJd, true);
      const eq = Ecliptic(vector);
      const geoLong = Math.atan2(eq.vec.y, eq.vec.x) * (180 / Math.PI);
      const correctedLong = ((geoLong - ayanamsaDeg) % 360 + 360) % 360;
      const tSign = Math.floor(correctedLong / 30) + 1;
      simplifiedTransits[name] = { name, sign: tSign };
    } catch { continue; }
  }

  // D9 House Lords
  const d9LagnaSign = d9Planets['Ascendant']?.sign || ascSign;
  const d9HouseLords: Record<number, { planet: string; sign: number }> = {};
  for (let h = 1; h <= 12; h++) {
    const sign = (d9LagnaSign - 1 + h - 1) % 12 + 1;
    d9HouseLords[h] = { planet: SIGN_RULERS[sign], sign };
  }

  return {
    planets, d9Planets, transits: simplifiedTransits, dasha,
    houses: houseData, houseLords, d9HouseLords
  };
}

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

export function calculateAyanamsaDeg(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (22.463 + 0.01023 * (T + 1)) * 3600 / 3600;
}

function getSaturnSignAtDate(date: Date): number {
  const jd = 367 * date.getUTCFullYear() - Math.floor(7 * (date.getUTCFullYear() + Math.floor((date.getUTCMonth() + 10) / 12)) / 4) + Math.floor(275 * (date.getUTCMonth() + 1) / 9) + date.getUTCDate() + 1721013.5 + ((date.getUTCHours() + date.getUTCMinutes() / 60) / 24);
  const ayanamsaDeg = calculateAyanamsaDeg(jd);
  const vector = GeoVector(Body.Saturn, jd, true);
  const eq = Ecliptic(vector);
  const geoLong = Math.atan2(eq.vec.y, eq.vec.x) * (180 / Math.PI);
  const correctedLong = ((geoLong - ayanamsaDeg) % 360 + 360) % 360;
  return Math.floor(correctedLong / 30) + 1;
}

export function calculateSadeSati(moonSign: number) {
  const now = new Date();
  const currentSaturnSign = getSaturnSignAtDate(now);
  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
  const daysPerSign = 2.5 * 365.25;
  const totalCycleDays = 30 * 365.25;

  function findSaturnEntryDate(sign: number, startDate: Date, searchForward: boolean): Date {
    const maxDays = totalCycleDays;
    const step = searchForward ? 1 : -1;
    let date = new Date(startDate);
    for (let i = 0; i < maxDays; i++) {
      const s = getSaturnSignAtDate(date);
      if (s === sign) {
        let boundary = new Date(date);
        for (let j = 0; j < 60; j++) {
          boundary.setDate(boundary.getDate() - step);
          if (getSaturnSignAtDate(boundary) !== sign) {
            boundary.setDate(boundary.getDate() + step);
            return boundary;
          }
        }
        return date;
      }
      date.setDate(date.getDate() + step);
    }
    return startDate;
  }

  const firstSign = posMod(moonSign + 12 - 1, 12) || 12;
  const middleSign = moonSign;
  const lastSign = posMod(moonSign + 1, 12) || 12;

  const firstEntry = findSaturnEntryDate(firstSign, new Date(now), false);
  const firstExit = new Date(firstEntry);
  firstExit.setDate(firstExit.getDate() + Math.round(daysPerSign));

  const middleEntry = findSaturnEntryDate(middleSign, new Date(now), currentSaturnSign === middleSign);
  const middleExit = new Date(middleEntry);
  middleExit.setDate(middleExit.getDate() + Math.round(daysPerSign));

  const lastEntry = findSaturnEntryDate(lastSign, new Date(now), currentSaturnSign === lastSign);
  const lastExit = new Date(lastEntry);
  lastExit.setDate(lastExit.getDate() + Math.round(daysPerSign));

  const phases = [
    {
      phase: 'first_dhaiya',
      name: 'पहला ढैय्या (12वें भाव में शनि)',
      startDate: firstEntry.toISOString().split('T')[0],
      endDate: firstExit.toISOString().split('T')[0],
      houseFromMoon: 12,
      intensity: 6,
      description: 'शनि चंद्रमा से 12वें भाव में — व्यय, अलगाव और आध्यात्मिकता का समय।'
    },
    {
      phase: 'middle_dhaiya',
      name: 'बीच का ढैय्या (चंद्रमा पर शनि)',
      startDate: middleEntry.toISOString().split('T')[0],
      endDate: middleExit.toISOString().split('T')[0],
      houseFromMoon: 1,
      intensity: 9,
      description: 'शनि चंद्रमा की राशि में — सबसे कठिन चरण, गहन आत्म-परिवर्तन का समय।'
    },
    {
      phase: 'last_dhaiya',
      name: 'अंतिम ढैय्या (2रे भाव में शनि)',
      startDate: lastEntry.toISOString().split('T')[0],
      endDate: lastExit.toISOString().split('T')[0],
      houseFromMoon: 2,
      intensity: 5,
      description: 'शनि चंद्रमा से 2रे भाव में — धन और परिवार में स्थिरता।'
    }
  ];

  const nowMs = now.getTime();
  let currentPhase = null;
  for (const phase of phases) {
    const startMs = new Date(phase.startDate).getTime();
    const endMs = new Date(phase.endDate).getTime();
    if (nowMs >= startMs && nowMs <= endMs) {
      currentPhase = phase;
      break;
    }
  }

  const predictions: string[] = [];
  if (currentPhase) {
    if (currentPhase.houseFromMoon === 12) {
      predictions.push('व्यय बढ़ सकता है, अनावश्यक खर्चों से बचें।');
      predictions.push('एकांत की भावना आ सकती है, ध्यान का सहारा लें।');
    } else if (currentPhase.houseFromMoon === 1) {
      predictions.push('यह सबसे तीव्र चरण है। मानसिक शांति के लिए ध्यान अपनाएँ।');
      predictions.push('स्वास्थ्य पर विशेष ध्यान दें। करियर में धैर्य रखें।');
    } else {
      predictions.push('आर्थिक स्थिति में सुधार के संकेत हैं।');
      predictions.push('परिवार में शांति और स्थिरता लौटने लगेगी।');
    }
  } else {
    const upcomingPhase = phases.find(p => new Date(p.startDate).getTime() > nowMs);
    if (upcomingPhase) {
      predictions.push(`साढ़ेसाती ${upcomingPhase.startDate} से शुरू होगी। तैयारी करें।`);
    } else {
      predictions.push('फिलहाल साढ़ेसाती सक्रिय नहीं है।');
    }
  }

  return {
    isActive: currentPhase !== null,
    moonSign,
    moonSignName: hindiSigns[moonSign],
    saturnSign: currentSaturnSign,
    saturnSignName: hindiSigns[currentSaturnSign],
    phases,
    currentPhase,
    predictions
  };
}

function getSunSiderealPosition(date: Date, calcAyanamsa: Function): number {
  const jd = 367 * date.getUTCFullYear() - Math.floor(7 * (date.getUTCFullYear() + Math.floor((date.getUTCMonth() + 10) / 12)) / 4) + Math.floor(275 * (date.getUTCMonth() + 1) / 9) + date.getUTCDate() + 1721013.5 + ((date.getUTCHours() + date.getUTCMinutes() / 60) / 24);
  const ayanamsaDeg = calcAyanamsa(jd);
  const vector = GeoVector(Body.Sun, jd, true);
  const eq = Ecliptic(vector);
  const geoLong = Math.atan2(eq.vec.y, eq.vec.x) * (180 / Math.PI);
  return ((geoLong - ayanamsaDeg) % 360 + 360) % 360;
}

export function calculateVarshaphal(birthDate: Date, birthSunLongitude: number, birthLagnaSign: number, targetYear: number) {
  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

  function findSolarReturn(birthLong: number, year: number): Date {
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    const targetBirthday = new Date(year, birthMonth, birthDay);
    let start = new Date(targetBirthday);
    start.setDate(start.getDate() - 60);
    let end = new Date(targetBirthday);
    end.setDate(end.getDate() + 60);

    for (let iter = 0; iter < 50; iter++) {
      const mid = new Date((start.getTime() + end.getTime()) / 2);
      const midSun = getSunSiderealPosition(mid, calculateAyanamsaDeg);
      const diff = midSun - birthLong;
      if (Math.abs(diff) < 0.01) return mid;
      if (diff > 0) end = mid;
      else start = mid;
    }
    return targetBirthday;
  }

  const solarReturnDate = findSolarReturn(birthSunLongitude, targetYear);
  const age = targetYear - birthDate.getFullYear();
  const muntha = ((birthLagnaSign + age - 1) % 12) + 1;

  const munthaPredictions: Record<number, string> = {
    1: 'इस वर्ष नई शुरुआत का समय है। आत्मविश्वास बढ़ेगा।',
    2: 'आर्थिक स्थिति मजबूत होगी। धन संचय का वर्ष है।',
    3: 'साहस में वृद्धि होगी। यात्राएँ लाभदायक रहेंगी।',
    4: 'पारिवारिक जीवन सुखद रहेगा। मानसिक शांति मिलेगी।',
    5: 'शिक्षा में वृद्धि होगी। संतान सुख के योग।',
    6: 'स्वास्थ्य का ध्यान रखें। ऋण से मुक्ति मिलेगी।',
    7: 'विवाह और साझेदारी के लिए शुभ वर्ष।',
    8: 'परिवर्तन का वर्ष। स्वास्थ्य का ध्यान रखें।',
    9: 'भाग्य प्रबल रहेगा। धार्मिक यात्राएँ होंगी।',
    10: 'करियर में उन्नति के योग। प्रतिष्ठा बढ़ेगी।',
    11: 'लाभ और इच्छापूर्ति का वर्ष। आर्थिक उन्नति।',
    12: 'व्यय बढ़ सकता है। आध्यात्मिकता में रुचि।'
  };

  const mainPrediction = munthaPredictions[muntha] || 'यह वर्ष मिश्रित फल देने वाला है।';
  const monthlyPredictions = Array.from({length: 12}, (_, i) => ({
    month: i + 1,
    prediction: `${munthaPredictions[((muntha + i - 1) % 12) + 1] || 'सामान्य महीना'}`
  }));

  return {
    year: targetYear, age,
    solarReturnDate: solarReturnDate.toISOString().split('T')[0],
    muntha, munthaSign: muntha,
    predictions: [mainPrediction, `मुंथा ${hindiSigns[muntha]} राशि में`],
    monthlyPredictions
  };
}

export function calculateShadbala(planets: Record<string, { sign: number; house: number; longitude: number; is_retrograde: boolean }>, lagnaSign: number, isDayBirth: boolean) {
  const allPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  const dignityScores: Record<string, { exalt: number; own: number[] }> = {
    'Sun': { exalt: 1, own: [5] },
    'Moon': { exalt: 2, own: [4] },
    'Mars': { exalt: 10, own: [1, 8] },
    'Mercury': { exalt: 6, own: [3, 6] },
    'Jupiter': { exalt: 4, own: [9, 12] },
    'Venus': { exalt: 12, own: [2, 7] },
    'Saturn': { exalt: 7, own: [10, 11] },
  };

  const digBalaHouses: Record<string, number> = {
    'Jupiter': 1, 'Mercury': 1,
    'Sun': 10, 'Mars': 10,
    'Moon': 4, 'Venus': 4,
    'Saturn': 7,
  };

  const naisargikaOrder = ['Sun', 'Moon', 'Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'];
  const nightPlanets = ['Moon', 'Venus', 'Saturn'];

  const result: Record<string, any> = {};

  for (const planet of allPlanets) {
    const p = planets[planet];
    if (!p) continue;

    let sthanaBala = 30;
    const dign = dignityScores[planet];
    if (dign) {
      if (p.sign === dign.exalt) sthanaBala = 60;
      else if (dign.own.includes(p.sign)) sthanaBala = 45;
      const debSign = ((dign.exalt + 6 - 1) % 12) + 1;
      if (p.sign === debSign) sthanaBala = 10;
    }

    const digHouse = digBalaHouses[planet];
    let digBala = 30;
    if (digHouse) {
      const distance = Math.min(Math.abs(p.house - digHouse), 12 - Math.abs(p.house - digHouse));
      digBala = Math.round(60 * (1 - distance / 6));
    }

    const isNightPlanet = nightPlanets.includes(planet);
    let kalaBala = isNightPlanet !== isDayBirth ? 50 : 20;

    const chestaBala = p.is_retrograde ? 50 : 35;

    const nIndex = naisargikaOrder.indexOf(planet);
    const naisargikaBala = Math.round(60 * (1 - nIndex / (naisargikaOrder.length - 1)));

    const ayanaBala = p.sign <= 6 ? 45 : 20;

    const totalBala = sthanaBala + digBala + kalaBala + chestaBala + naisargikaBala + ayanaBala;
    result[planet] = { sthanaBala, digBala, kalaBala, chestaBala, naisargikaBala, ayanaBala, totalBala, isStrong: totalBala > 180 };
  }

  const strengths = Object.entries(result)
    .map(([planet, data]: [string, any]) => ({ planet, total: data.totalBala, rank: 0 }))
    .sort((a: any, b: any) => b.total - a.total)
    .map((item: any, i: number) => ({ ...item, rank: i + 1 }));

  return { planetary: result, strengths };
}

export function calculateAshtakavarga(planets: Record<string, { sign: number; longitude: number }>, lagnaSign: number) {
  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

  const beneficHouses: Record<string, number[]> = {
    'Sun': [1, 2, 4, 5, 7, 8, 9, 10, 11],
    'Moon': [1, 3, 5, 6, 7, 8, 10, 11, 12],
    'Mars': [1, 3, 4, 5, 7, 8, 9, 10, 12],
    'Mercury': [1, 3, 5, 6, 7, 8, 9, 10, 11],
    'Jupiter': [1, 2, 3, 4, 5, 7, 8, 9, 10],
    'Venus': [1, 2, 3, 5, 6, 7, 8, 9, 10],
    'Saturn': [1, 2, 3, 4, 5, 8, 9, 10, 11],
  };

  const lagnaBeneficHouses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const allPlanets = [...Object.keys(beneficHouses), 'Lagna'];
  const binnashtakavarga: Record<string, number[]> = {};

  for (const planetName of allPlanets) {
    const bindus = new Array(12).fill(0);
    const planetSign = planetName === 'Lagna' ? lagnaSign : (planets[planetName]?.sign || 1);
    const houses = planetName === 'Lagna' ? lagnaBeneficHouses : beneficHouses[planetName];
    if (!houses) continue;

    for (let sign = 1; sign <= 12; sign++) {
      const relativeHouse = ((sign - planetSign + 12) % 12) + 1;
      if (houses.includes(relativeHouse)) {
        bindus[sign - 1] = 1;
      }
    }
    binnashtakavarga[planetName] = bindus;
  }

  const sarvashtakavarga = new Array(12).fill(0);
  for (const planetName of allPlanets) {
    const bindus = binnashtakavarga[planetName];
    if (bindus) {
      for (let i = 0; i < 12; i++) {
        sarvashtakavarga[i] += bindus[i];
      }
    }
  }

  const signStrengths = sarvashtakavarga.map((bindus: number, i: number) => {
    const sign = i + 1;
    let interpretation: string;
    if (bindus >= 35) interpretation = 'अत्यंत बलवान';
    else if (bindus >= 28) interpretation = 'बलवान';
    else if (bindus >= 22) interpretation = 'मध्यम';
    else if (bindus >= 16) interpretation = 'कमजोर';
    else interpretation = 'अत्यंत कमजोर';
    return { sign, name: hindiSigns[sign], bindus, interpretation };
  });

  return { binnashtakavarga, sarvashtakavarga, signStrengths };
}

export function calculateExtraDivisionalCharts(planets: Record<string, { longitude: number }>, lagnaSidereal: number): Record<string, any> {
  const charts: Record<string, any> = {};
  const divisions = [
    { name: 'D3', divisor: 3 },
    { name: 'D7', divisor: 7 },
    { name: 'D10', divisor: 10 }
  ];

  for (const div of divisions) {
    const chartPlanets: Record<string, any> = {};
    for (const [name, p] of Object.entries(planets)) {
      if (name === 'Ascendant') continue;
      const divisionalLong = (p.longitude * div.divisor) % 360;
      const sign = Math.floor(divisionalLong / 30) + 1;
      chartPlanets[name] = { name, sign, house: sign, longitude: divisionalLong };
    }

    const lngLong = (lagnaSidereal * div.divisor) % 360;
    const lagnaSign = Math.floor(lngLong / 30) + 1;
    chartPlanets['Ascendant'] = { name: 'Ascendant', sign: lagnaSign, house: 1, longitude: lngLong };

    for (const [name, p] of Object.entries(chartPlanets)) {
      let house = p.sign - lagnaSign + 1;
      if (house < 1) house += 12;
      p.house = house;
    }

    charts[div.name] = { chart: div.name, planets: chartPlanets, lagnaSign };
  }

  return charts;
}
