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
