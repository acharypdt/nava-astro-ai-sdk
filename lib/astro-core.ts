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
  timezone?: number;
  ayanamsa: string;
  gender?: string;
  birthLocation?: string;
}

/**
 * Calculates Ayanamsa offset (Lahiri approximation)
 */
function getAyanamsaOffset(year: number): number {
  // Balanced Lahiri Ayanamsa (Chitra Paksha)
  // Epoch 2000.0: 23.853056 degrees
  // Rate: ~50.2908 seconds per year
  const referenceYear = 2000;
  const referenceValue = 23.853056;
  const annualPrecession = 50.2908 / 3600; 
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

  // Calculate Ascendant (Lagna) - Using Local Sidereal Time and Latitude
const gst = SiderealTime(date); // Greenwich Sidereal Time
  const lst = (gst + lng / 15) % 24; 
  const ramc = lst * 15; 

  const eps = 23.43929 * Math.PI / 180; // Obliquity of the ecliptic
  const phi = lat * Math.PI / 180;     // Geographic Latitude
  const ra = ramc * Math.PI / 180;     // Right Ascension of the Meridian

  // Correct Ascendant formula: atan2(cos(ra), -(sin(ra)*cos(eps) + tan(phi)*sin(eps)))
  let lagnaTropical = Math.atan2(Math.cos(ra), -(Math.sin(ra) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * 180 / Math.PI;
  
  // Normalized to 0-360
  lagnaTropical = (lagnaTropical + 360) % 360;

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
  // Convert local birth time to UTC for calculation
  const timezoneOffset = params.timezone !== undefined ? params.timezone : 5.5;
  const localTimeMs = Date.UTC(params.year, params.month - 1, params.day, params.hour, params.minute);
  const birthDate = new Date(localTimeMs - timezoneOffset * 3600000);
  
  const ayanamsa = getAyanamsaOffset(params.year);

  // 1. D1 Chart (Natal)
  const { planets, finalLagnaSign, lagnaSidereal } = calculatePlanetaryPositions(birthDate, ayanamsa, params.lat, params.lng);

  // Add Ascendant to planets object for UI display
  planets['Ascendant'] = {
    name: 'Ascendant',
    longitude: lagnaSidereal,
    sign: finalLagnaSign,
    house: 1,
    is_retrograde: false
  };

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

function posMod(n: number, m: number = 12): number {
  return ((n % m) + m) % m;
}

function getSaturnSignAtDate(date: Date): number {
  const ayanamsa = getAyanamsaOffset(date.getUTCFullYear());
  const geoVector = GeoVector(Body.Saturn, date, true);
  const ecliptic = Ecliptic(geoVector);
  let siderealLong = (ecliptic.elon - ayanamsa) % 360;
  if (siderealLong < 0) siderealLong += 360;
  return Math.floor(siderealLong / 30) + 1;
}

export function calculateSadeSati(moonSign: number): {
  isActive: boolean;
  moonSign: number;
  moonSignName: string;
  saturnSign: number;
  saturnSignName: string;
  phases: { phase: string; name: string; startDate: string; endDate: string; houseFromMoon: number; intensity: number; description: string }[];
  currentPhase: { phase: string; name: string; startDate: string; endDate: string; houseFromMoon: number; intensity: number; description: string } | null;
  predictions: string[];
} {
  const now = new Date();
  const currentSaturnSign = getSaturnSignAtDate(now);
  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

  // Saturn takes ~2.5 years per sign, ~30 years to complete one round
  const daysPerSign = 2.5 * 365.25;
  const totalCycleDays = 30 * 365.25;

  // Search backward/forward from current Saturn position to find entry dates
  function findSaturnEntryDate(sign: number, startDate: Date, searchForward: boolean): Date {
    const maxDays = totalCycleDays;
    const step = searchForward ? 1 : -1;
    let date = new Date(startDate);
    for (let i = 0; i < maxDays; i++) {
      const s = getSaturnSignAtDate(date);
      if (s === sign) {
        // Find precise entry: walk back to find the boundary
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

  // Calculate all three phases
  const firstSign = posMod(moonSign + 12 - 1, 12) || 12; // 12th from Moon
  const middleSign = moonSign; // 1st from Moon
  const lastSign = posMod(moonSign + 1, 12) || 12; // 2nd from Moon

  // Find when Saturn was/is/will be in each sign
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
      description: 'शनि चंद्रमा से 12वें भाव में — व्यय, अलगाव और आध्यात्मिकता का समय। पुराने कर्मों का लेखा-जोखा समाप्त होता है।'
    },
    {
      phase: 'middle_dhaiya',
      name: 'बीच का ढैय्या (चंद्रमा पर शनि)',
      startDate: middleEntry.toISOString().split('T')[0],
      endDate: middleExit.toISOString().split('T')[0],
      houseFromMoon: 1,
      intensity: 9,
      description: 'शनि चंद्रमा की राशि में — सबसे कठिन चरण। मानसिक दबाव, स्वास्थ्य चुनौतियाँ, लेकिन गहन आत्म-परिवर्तन का समय।'
    },
    {
      phase: 'last_dhaiya',
      name: 'अंतिम ढैय्या (2रे भाव में शनि)',
      startDate: lastEntry.toISOString().split('T')[0],
      endDate: lastExit.toISOString().split('T')[0],
      houseFromMoon: 2,
      intensity: 5,
      description: 'शनि चंद्रमा से 2रे भाव में — धन और परिवार में स्थिरता आती है। कठिनाइयों के बाद फल मिलना शुरू होता है।'
    }
  ];

  // Find current phase
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

  const isActive = currentPhase !== null;

  const predictions = [];
  if (isActive && currentPhase) {
    if (currentPhase.houseFromMoon === 12) {
      predictions.push('इस समय व्यय बढ़ सकता है, अनावश्यक खर्चों से बचें।');
      predictions.push('अलगाव या एकांत की भावना आ सकती है, ध्यान और आध्यात्मिकता का सहारा लें।');
      predictions.push('पुरानी आदतों और संबंधों का अंत हो सकता है, नई शुरुआत की तैयारी करें।');
      predictions.push('नींद में कमी या बेचैनी हो सकती है, नियमित दिनचर्या बनाए रखें।');
    } else if (currentPhase.houseFromMoon === 1) {
      predictions.push('यह साढ़ेसाती का सबसे तीव्र चरण है। मानसिक शांति के लिए ध्यान और योग अपनाएँ।');
      predictions.push('स्वास्थ्य पर विशेष ध्यान दें, नियमित जांच कराएँ।');
      predictions.push('करियर में ठहराव या बाधा आ सकती है, धैर्य रखें।');
      predictions.push('पारिवारिक जीवन में तनाव हो सकता है, संयम और समझदारी से काम लें।');
      predictions.push('यह समय आपको आंतरिक रूप से मजबूत बनाने के लिए है, हार न मानें।');
    } else if (currentPhase.houseFromMoon === 2) {
      predictions.push('आर्थिक स्थिति में सुधार के संकेत हैं, बचत पर ध्यान दें।');
      predictions.push('परिवार में शांति और स्थिरता लौटने लगेगी।');
      predictions.push('पुराने विवाद समाप्त हो सकते हैं, संबंधों में मधुरता आएगी।');
      predictions.push('नए अवसर आने शुरू होंगे, तैयार रहें।');
    }
  } else {
    // Check if Sade Sati is approaching or recently ended
    const upcomingPhase = phases.find(p => new Date(p.startDate).getTime() > nowMs);
    const pastPhase = phases.filter(p => new Date(p.endDate).getTime() < nowMs);
    if (upcomingPhase) {
      predictions.push(`साढ़ेसाती आने वाली है — ${upcomingPhase.name} ${upcomingPhase.startDate} से शुरू होगा।`);
      predictions.push('आने वाले समय में आत्म-अनुशासन और धैर्य अपनाने की तैयारी करें।');
    } else if (pastPhase.length === 3) {
      predictions.push('साढ़ेसाती समाप्त हो चुकी है। आप मजबूत और अधिक परिपक्व होकर निकले हैं।');
      predictions.push('अब नई शुरुआत और उन्नति का समय है।');
    } else {
      predictions.push('फिलहाल साढ़ेसाती सक्रिय नहीं है।');
    }
  }

  return {
    isActive,
    moonSign,
    moonSignName: hindiSigns[moonSign],
    saturnSign: currentSaturnSign,
    saturnSignName: hindiSigns[currentSaturnSign],
    phases: phases as any,
    currentPhase: currentPhase as any,
    predictions
  };
}

export function calculateVarshaphal(birthDate: Date, birthSunLongitude: number, birthLagnaSign: number, targetYear: number, lat: number, lng: number): {
  year: number; age: number; solarReturnDate: string; muntha: number; munthaSign: number;
  predictions: string[]; monthlyPredictions: { month: number; prediction: string }[];
} {
  const ayanamsa = getAyanamsaOffset(targetYear);
  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

  // Find the solar return moment by binary search
  function findSolarReturn(birthLong: number, year: number): Date {
    // Start from 45 days before birthday to 45 days after
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    const targetBirthday = new Date(year, birthMonth, birthDay);
    let start = new Date(targetBirthday);
    start.setDate(start.getDate() - 60);
    let end = new Date(targetBirthday);
    end.setDate(end.getDate() + 60);

    for (let iter = 0; iter < 50; iter++) {
      const mid = new Date((start.getTime() + end.getTime()) / 2);
      const midSun = getSunSiderealPosition(mid);
      const diff = midSun - birthLong;
      if (Math.abs(diff) < 0.01) return mid;
      if (diff > 0) end = mid;
      else start = mid;
    }
    return targetBirthday;
  }

  function getSunSiderealPosition(date: Date): number {
    const ay = getAyanamsaOffset(date.getUTCFullYear());
    const vector = GeoVector(Body.Sun, date, true);
    const ecliptic = Ecliptic(vector);
    return ((ecliptic.elon - ay) % 360 + 360) % 360;
  }

  const solarReturnDate = findSolarReturn(birthSunLongitude, targetYear);
  const age = targetYear - birthDate.getFullYear();

  // Muntha (Annual Ascendant) = (Lagna Sign + Age - 1) % 12
  const muntha = ((birthLagnaSign + age - 1) % 12) + 1;

  // Generate predictions based on Muntha position
  const munthaPredictions: Record<number, string> = {
    1: 'इस वर्ष नई शुरुआत और व्यक्तित्व विकास का समय है। आत्मविश्वास बढ़ेगा और नए अवसर मिलेंगे।',
    2: 'आर्थिक स्थिति मजबूत होगी। परिवार में सुख-शांति रहेगी। धन संचय का वर्ष है।',
    3: 'साहस और पराक्रम में वृद्धि होगी। छोटी यात्राएँ लाभदायक रहेंगी। संचार कौशल बढ़ेगा।',
    4: 'घर और संपत्ति में वृद्धि के योग हैं। माता का स्वास्थ्य अच्छा रहेगा। मानसिक शांति मिलेगी।',
    5: 'शिक्षा और ज्ञान में वृद्धि होगी। संतान सुख के योग हैं। रचनात्मकता चरम पर रहेगी।',
    6: 'स्वास्थ्य का ध्यान रखें। ऋण से मुक्ति मिलेगी। नौकरी में सफलता मिलेगी।',
    7: 'विवाह और साझेदारी के लिए शुभ वर्ष। व्यापार में साझेदारी लाभदायक रहेगी।',
    8: 'परिवर्तन और आध्यात्मिकता का वर्ष। अचानक घटनाक्रम हो सकते हैं। स्वास्थ्य का ध्यान रखें।',
    9: 'भाग्य प्रबल रहेगा। धार्मिक यात्राएँ होंगी। गुरु का आशीर्वाद मिलेगा।',
    10: 'करियर में उन्नति के शानदार योग। सामाजिक प्रतिष्ठा बढ़ेगी। पिता का सहयोग मिलेगा।',
    11: 'लाभ और इच्छापूर्ति का वर्ष। आर्थिक उन्नति होगी। बड़े भाई-बहन से सहायता मिलेगी।',
    12: 'व्यय बढ़ सकता है, ध्यान रखें। विदेश यात्रा के योग हैं। आध्यात्मिकता में रुचि बढ़ेगी।'
  };

  const mainPrediction = munthaPredictions[muntha] || 'यह वर्ष मिश्रित फल देने वाला है।';

  // Monthly predictions based on Muntha transit through signs
  const monthlyPredictions: { month: number; prediction: string }[] = [];
  const monthPreds: Record<number, string> = {
    1: 'ऊर्जा और आत्मविश्वास बढ़ा हुआ है। नई योजनाएँ शुरू करने का अच्छा समय।',
    2: 'धन लाभ के योग हैं। पुराने निवेश से रिटर्न मिल सकता है।',
    3: 'संचार में सावधानी बरतें। यात्रा में लाभ होगा।',
    4: 'पारिवारिक जीवन सुखद रहेगा। घर से संबंधित मामलों में सफलता।',
    5: 'बच्चों और शिक्षा से संबंधित शुभ समाचार। रचनात्मकता बढ़ेगी।',
    6: 'स्वास्थ्य और कर्ज पर ध्यान दें। नियमित दिनचर्या अपनाएँ।',
    7: 'विवाह और व्यापार में सफलता। साझेदारी लाभदायक।',
    8: 'अचानक बदलाव संभव। स्वास्थ्य का विशेष ध्यान रखें।',
    9: 'भाग्य का साथ मिलेगा। धार्मिक कार्यों में मन लगेगा।',
    10: 'करियर में बड़ी सफलता। प्रतिष्ठा में वृद्धि।',
    11: 'इच्छाएँ पूरी होंगी। धन लाभ के अवसर।',
    12: 'व्यय नियंत्रित रखें। आध्यात्मिक गतिविधियाँ लाभदायक।'
  };

  for (let m = 1; m <= 12; m++) {
    monthlyPredictions.push({
      month: m,
      prediction: monthPreds[m] || `${m}वाँ महीना सामान्य रहेगा।`
    });
  }

  return {
    year: targetYear,
    age,
    solarReturnDate: solarReturnDate.toISOString().split('T')[0],
    muntha,
    munthaSign: muntha,
    predictions: [mainPrediction, `मुंथा (वार्षिक लग्न) ${hindiSigns[muntha]} राशि में है।`, `वर्ष की आयु: ${age} वर्ष`],
    monthlyPredictions
  };
}

export function calculateShadbala(planets: Record<string, { sign: number; house: number; longitude: number; is_retrograde: boolean }>, lagnaSign: number, isDayBirth: boolean): {
  planetary: Record<string, { sthanaBala: number; digBala: number; kalaBala: number; chestaBala: number; naisargikaBala: number; ayanaBala: number; totalBala: number; isStrong: boolean }>;
  strengths: { planet: string; total: number; rank: number }[];
} {
  // Simplified but astrologically accurate Shadbala calculation
  const allPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  // 1. Sthana Bala (Positional Strength) - based on dignity
  const dignityScores: Record<string, { exalt: number; own: number[] }> = {
    'Sun': { exalt: 1, own: [5] },
    'Moon': { exalt: 2, own: [4] },
    'Mars': { exalt: 10, own: [1, 8] },
    'Mercury': { exalt: 6, own: [3, 6] },
    'Jupiter': { exalt: 4, own: [9, 12] },
    'Venus': { exalt: 12, own: [2, 7] },
    'Saturn': { exalt: 7, own: [10, 11] },
  };

  // 2. Dig Bala (Directional Strength) - planets get strength in specific houses
  const digBalaHouses: Record<string, number> = {
    'Jupiter': 1, 'Mercury': 1,
    'Sun': 10, 'Mars': 10,
    'Moon': 4, 'Venus': 4,
    'Saturn': 7,
  };

  // 3. Naisargika Bala (Natural Strength) - fixed hierarchy
  const naisargikaOrder = ['Sun', 'Moon', 'Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'];
  const nBalaMax = 60;

  // 4. Ayana Bala - based on northern/southern declination
  // Simplified: based on sign (6 signs north, 6 signs south)

  const result: Record<string, any> = {};

  for (const planet of allPlanets) {
    const p = planets[planet];
    if (!p) continue;

    // Sthana Bala (0-60)
    const dign = dignityScores[planet];
    let sthanaBala = 30; // base
    if (dign) {
      if (p.sign === dign.exalt) sthanaBala = 60;
      else if (dign.own.includes(p.sign)) sthanaBala = 45;
      // Debilitation check (opposite of exaltation)
      const debSign = ((dign.exalt + 6 - 1) % 12) + 1;
      if (p.sign === debSign) sthanaBala = 10;
    }

    // Dig Bala (0-60)
    const digHouse = digBalaHouses[planet];
    let digBala = 30;
    if (digHouse) {
      // Max strength when planet is in its directional house, min when opposite
      const distance = Math.min(Math.abs(p.house - digHouse), 12 - Math.abs(p.house - digHouse));
      digBala = Math.round(60 * (1 - distance / 6));
    }

    // Kala Bala (0-60)
    // Simplified: based on day/night and lunar phase
    const isNightPlanet = ['Moon', 'Venus', 'Saturn'].includes(planet);
    let kalaBala = 30;
    if (isNightPlanet && !isDayBirth) kalaBala = 50;
    else if (!isNightPlanet && isDayBirth) kalaBala = 50;
    else if (isNightPlanet && isDayBirth) kalaBala = 20;
    else kalaBala = 20;

    // Chesta Bala (0-60) - based on speed and retrograde
    const chestaBala = p.is_retrograde ? 50 : 35;

    // Naisargika Bala (0-60) - fixed hierarchy
    const nIndex = naisargikaOrder.indexOf(planet);
    const naisargikaBala = Math.round(nBalaMax * (1 - nIndex / (naisargikaOrder.length - 1)));

    // Ayana Bala (0-60)
    // Northern signs (1-6) give strength to planets, Southern (7-12) reduce
    const ayanaBala = p.sign <= 6 ? 45 : 20;

    const totalBala = sthanaBala + digBala + kalaBala + chestaBala + naisargikaBala + ayanaBala;
    const isStrong = totalBala > 180; // Minimum threshold for strength

    result[planet] = {
      sthanaBala, digBala, kalaBala, chestaBala, naisargikaBala, ayanaBala,
      totalBala, isStrong
    };
  }

  const strengths = Object.entries(result)
    .map(([planet, data]) => ({ planet, total: data.totalBala, rank: 0 }))
    .sort((a, b) => b.total - a.total)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  return { planetary: result, strengths };
}

export function calculateAshtakavarga(planets: Record<string, { sign: number; longitude: number }>, lagnaSign: number): {
  binnashtakavarga: Record<string, number[]>;
  sarvashtakavarga: number[];
  signStrengths: { sign: number; name: string; bindus: number; interpretation: string }[];
} {
  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

  function posMod(n: number, m: number = 12): number {
    return ((n % m) + m) % m;
  }

  // Benefic house positions for each planet (1-indexed from planet's own sign)
  const beneficHouses: Record<string, number[]> = {
    'Sun': [1, 2, 4, 5, 7, 8, 9, 10, 11],
    'Moon': [1, 3, 5, 6, 7, 8, 10, 11, 12],
    'Mars': [1, 3, 4, 5, 7, 8, 9, 10, 12],
    'Mercury': [1, 3, 5, 6, 7, 8, 9, 10, 11],
    'Jupiter': [1, 2, 3, 4, 5, 7, 8, 9, 10],
    'Venus': [1, 2, 3, 5, 6, 7, 8, 9, 10],
    'Saturn': [1, 2, 3, 4, 5, 8, 9, 10, 11],
  };

  // Lagna Ashtakavarga: all houses except 12th from Lagna
  const lagnaBeneficHouses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const allPlanets = [...Object.keys(beneficHouses), 'Lagna'];
  const binnashtakavarga: Record<string, number[]> = {};

  for (const planetName of allPlanets) {
    const bindus = new Array(12).fill(0);
    const planetSign = planetName === 'Lagna' ? lagnaSign : (planets[planetName]?.sign || 1);
    const houses = planetName === 'Lagna' ? lagnaBeneficHouses : beneficHouses[planetName];

    if (!houses) continue;

    for (let sign = 1; sign <= 12; sign++) {
      const relativeHouse = posMod(sign - planetSign + 1, 12);
      if (houses.includes(relativeHouse === 0 ? 12 : relativeHouse)) {
        bindus[sign - 1] = 1;
      }
    }

    binnashtakavarga[planetName] = bindus;
  }

  // Sarva Ashtakavarga (total of all individual bindus)
  const sarvashtakavarga = new Array(12).fill(0);
  for (const planetName of allPlanets) {
    const bindus = binnashtakavarga[planetName];
    if (bindus) {
      for (let i = 0; i < 12; i++) {
        sarvashtakavarga[i] += bindus[i];
      }
    }
  }

  const totalBindu = sarvashtakavarga.reduce((a, b) => a + b, 0);

  const signStrengths = sarvashtakavarga.map((bindus, i) => {
    const sign = i + 1;
    let interpretation: string;
    if (bindus >= 35) interpretation = 'अत्यंत बलवान (Very Strong) - शुभ फल';
    else if (bindus >= 28) interpretation = 'बलवान (Strong) - लाभकारी';
    else if (bindus >= 22) interpretation = 'मध्यम (Average) - सामान्य फल';
    else if (bindus >= 16) interpretation = 'कमजोर (Weak) - संघर्षपूर्ण';
    else interpretation = 'अत्यंत कमजोर (Very Weak) - बाधाएँ';
    return { sign, name: hindiSigns[sign], bindus, interpretation };
  });

  return { binnashtakavarga, sarvashtakavarga, totalBindu, signStrengths };
}

export function calculateExtraDivisionalCharts(planets: Record<string, { longitude: number }>, lagnaSidereal: number): Record<string, { chart: string; planets: Record<string, { name: string; sign: number; house: number; longitude: number }>; lagnaSign: number }> {
  const charts: Record<string, any> = {};
  const divisions: { name: string; divisor: number }[] = [
    { name: 'D3', divisor: 3 },
    { name: 'D7', divisor: 7 },
    { name: 'D10', divisor: 10 }
  ];

  for (const div of divisions) {
    const chartPlanets: Record<string, any> = {};
    let totalLong = 0;
    for (const [name, p] of Object.entries(planets)) {
      if (name === 'Ascendant') continue;
      const divisionalLong = (p.longitude * div.divisor) % 360;
      const sign = Math.floor(divisionalLong / 30) + 1;
      chartPlanets[name] = { name, sign, house: sign, longitude: divisionalLong };
      totalLong += divisionalLong;
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

