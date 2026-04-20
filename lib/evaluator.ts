/**
 * @file lib/evaluator.ts
 * @description Dynamic AST Evaluator for Astrological Rules.
 * Evaluates D1 JSON-logic against the standardized JSON output of the Wasm Math Engine.
 */

export interface AstroChartData {
  planets: {
    [key: string]: {
      name: string;
      longitude: number;
      sign: number;
      house: number;
      is_retrograde: boolean;
    };
  };
  d9Planets?: {
    [key: string]: {
      name: string;
      sign: number;
      house: number;
      longitude?: number;
      is_retrograde?: boolean;
    };
  };
  transits?: {
    [key: string]: {
      name: string;
      sign: number;
    }
  };
  dasha?: {
    currentLord: string;
    balanceFraction: number;
  };
  houses: {
    [key: number]: {
      cusp: number;
      sign: number;
    };
  };
  houseLords?: {
    [house: number]: {
      planet: string;
      sign: number;
    };
  };
  d9HouseLords?: {
    [house: number]: {
      planet: string;
      sign: number;
    };
  };
}

export interface RuleAST {
  operator: string;
  operands?: RuleAST[];
  params?: any;
}

/**
 * Evaluates a rule AST against chart data.
 */
export function evaluateRule(rule: RuleAST, data: AstroChartData): boolean {
  switch (rule.operator) {
    case 'AND':
      return rule.operands?.every((op) => evaluateRule(op, data)) ?? true;
    case 'OR':
      return rule.operands?.some((op) => evaluateRule(op, data)) ?? false;
    case 'NOT':
      return rule.operands ? !evaluateRule(rule.operands[0], data) : false;
    
    case 'IN_HOUSE': {
      const { planet, house } = rule.params;
      const planetData = data.planets[planet];
      if (!planetData) return false;
      
      const targetHouses = Array.isArray(house) ? house : [house];
      return targetHouses.includes(planetData.house);
    }
    
    case 'IN_SIGN': {
      const { planet, sign } = rule.params;
      const planetData = data.planets[planet];
      if (!planetData) return false;
      
      const targetSigns = Array.isArray(sign) ? sign : [sign];
      return targetSigns.includes(planetData.sign);
    }
    
    case 'ASPECT': {
      const { planets } = rule.params;
      if (planets.length < 2) return false;
      const p1 = data.planets[planets[0]];
      const p2 = data.planets[planets[1]];
      if (!p1 || !p2) return false;
      return p1.sign === p2.sign;
    }

    case 'CONJUNCT': {
      const { planets } = rule.params; // e.g. ['Sun', 'Mercury']
      if (planets.length < 2) return false;
      const signs = planets.map((p: string) => data.planets[p]?.sign);
      if (signs.includes(undefined)) return false;
      return signs.every((s: number) => s === signs[0]);
    }

    case 'OPPOSITION': {
      const { planets } = rule.params;
      if (planets.length < 2) return false;
      const p1 = data.planets[planets[0]];
      const p2 = data.planets[planets[1]];
      if (!p1 || !p2) return false;
      const dist = (p2.sign - p1.sign + 12) % 12 + 1;
      return dist === 7;
    }

    case 'TRINE': {
      const { planets } = rule.params;
      if (planets.length < 2) return false;
      const p1 = data.planets[planets[0]];
      const p2 = data.planets[planets[1]];
      if (!p1 || !p2) return false;
      const dist = (p2.sign - p1.sign + 12) % 12 + 1;
      return dist === 5 || dist === 9;
    }

    case 'SQUARE': {
      const { planets } = rule.params;
      if (planets.length < 2) return false;
      const p1 = data.planets[planets[0]];
      const p2 = data.planets[planets[1]];
      if (!p1 || !p2) return false;
      const dist = (p2.sign - p1.sign + 12) % 12 + 1;
      return dist === 4 || dist === 10;
    }

    case 'SEXTILE': {
      const { planets } = rule.params;
      if (planets.length < 2) return false;
      const p1 = data.planets[planets[0]];
      const p2 = data.planets[planets[1]];
      if (!p1 || !p2) return false;
      const dist = (p2.sign - p1.sign + 12) % 12 + 1;
      return dist === 3 || dist === 11;
    }

    case 'VEDIC_ASPECT': {
      const { aspector, aspectee } = rule.params;
      const p1 = data.planets[aspector];
      const p2 = data.planets[aspectee];
      if (!p1 || !p2) return false;

      const dist = (p2.sign - p1.sign + 12) % 12 + 1; // Inclusive sign distance
      
      // All planets aspect the 7th house from themselves
      if (dist === 7) return true;
      
      // Special aspects
      if (aspector === 'Mars' && (dist === 4 || dist === 8)) return true;
      if (aspector === 'Jupiter' && (dist === 5 || dist === 9)) return true;
      if (aspector === 'Saturn' && (dist === 3 || dist === 10)) return true;
      
      return false;
    }
    
    case 'OWN_SIGN': {
      const { planet } = rule.params;
      const pData = data.planets[planet];
      if (!pData) return false;
      
      const ownSigns: Record<string, number[]> = {
        'Sun': [5],
        'Moon': [4],
        'Mars': [1, 8],
        'Mercury': [3, 6],
        'Jupiter': [9, 12],
        'Venus': [2, 7],
        'Saturn': [10, 11]
      };
      
      return ownSigns[planet]?.includes(pData.sign) ?? false;
    }

    case 'IS_EXALTED': {
      const { planet } = rule.params;
      const pData = data.planets[planet];
      if (!pData) return false;
      
      const exaltationSigns: Record<string, number> = {
        'Sun': 1, // Aries
        'Moon': 2, // Taurus
        'Mars': 10, // Capricorn
        'Mercury': 6, // Virgo
        'Jupiter': 4, // Cancer
        'Venus': 12, // Pisces
        'Saturn': 7 // Libra
      };
      
      return pData.sign === exaltationSigns[planet];
    }
    
    case 'IS_DEBILITATED': {
      const { planet } = rule.params;
      const pData = data.planets[planet];
      if (!pData) return false;
      
      const debilitationSigns: Record<string, number> = {
        'Sun': 7, 
        'Moon': 8, 
        'Mars': 4, 
        'Mercury': 12, 
        'Jupiter': 10, 
        'Venus': 6, 
        'Saturn': 1 
      };
      
      return pData.sign === debilitationSigns[planet];
    }

    case 'DYNAMIC_CONDITION': {
      // Allows checking a mix of D1, D9, transit, and Dasha conditions simultaneously
      const { dashaLord, d1, d9, transit } = rule.params;
      
      // Check Dasha if provided
      if (dashaLord) {
        if (!data.dasha || data.dasha.currentLord !== dashaLord) return false;
      }

      // Check D1 override conditions
      if (d1) {
        const pData = data.planets[d1.planet];
        if (!pData) return false;
        if (d1.operator === 'IN_HOUSE' && pData.house !== d1.value) return false;
        if (d1.operator === 'IN_SIGN' && pData.sign !== d1.value) return false;
      }

      // Check D9 override conditions
      if (d9) {
        if (!data.d9Planets) return false;
        const pData = data.d9Planets[d9.planet];
        if (!pData) return false;
        if (d9.operator === 'IN_HOUSE' && pData.house !== d9.value) return false;
        if (d9.operator === 'IN_SIGN' && pData.sign !== d9.value) return false;
      }

      // Check Transit override conditions
      if (transit) {
        if (!data.transits) return false;
        const pData = data.transits[transit.planet];
        if (!pData) return false;
        if (transit.operator === 'IN_SIGN' && pData.sign !== transit.value) return false;
        
        if (transit.operator === 'CONJUNCT_NATAL') {
          const natalTarget = data.planets[transit.natalTarget];
          if (!natalTarget) return false;
          if (pData.sign !== natalTarget.sign) return false;
        }
      }

      return true;
    }

    case 'HOUSE_LORD_IN': {
      const { house, targetHouse } = rule.params;
      const lord = data.houseLords?.[house];
      if (!lord) return false;
      const planetData = data.planets[lord.planet];
      if (!planetData) return false;
      return planetData.house === targetHouse;
    }

    case 'D9_HOUSE_LORD_IN': {
      const { house, targetHouse } = rule.params;
      const lord = data.d9HouseLords?.[house];
      if (!lord) return false;
      const planetData = data.d9Planets?.[lord.planet];
      if (!planetData) return false;
      return planetData.house === targetHouse;
    }

    default:
      console.warn(`Unknown operator: ${rule.operator}`);
      return false;
  }
}
