import { AstroChartData, RuleAST } from './types';

function posMod(n: number, m: number = 12): number {
  return ((n % m) + m) % m;
}

export function evaluateRule(ast: RuleAST, data: AstroChartData): boolean {
  if (!ast || !ast.operator) return false;

  switch (ast.operator) {
    case 'AND':
      return ast.operands ? ast.operands.every((op: RuleAST) => evaluateRule(op, data)) : true;
    case 'OR':
      return ast.operands ? ast.operands.some((op: RuleAST) => evaluateRule(op, data)) : false;
    case 'NOT':
      return ast.operands ? !evaluateRule(ast.operands[0], data) : true;
    case 'IN_HOUSE': {
      const { planet, house } = ast.params;
      const houseArr = Array.isArray(house) ? house : [house];
      const p = data.planets[planet];
      return p ? houseArr.includes(p.house) : false;
    }
    case 'IN_SIGN': {
      const { planet, sign } = ast.params;
      const signArr = Array.isArray(sign) ? sign : [sign];
      const p = data.planets[planet];
      return p ? signArr.includes(p.sign) : false;
    }
    case 'ASPECT': {
      const { planets: [p1, p2] } = ast.params;
      const a = data.planets[p1];
      const b = data.planets[p2];
      if (!a || !b) return false;
      const diff = Math.abs(a.longitude - b.longitude);
      return diff < 10 || Math.abs(diff - 180) < 10 || Math.abs(diff - 120) < 10 || Math.abs(diff - 90) < 10;
    }
    case 'CONJUNCT': {
      const { planets } = ast.params;
      if (planets.length < 2) return false;
      const ref = data.planets[planets[0]];
      if (!ref) return false;
      return planets.slice(1).every((name: string) => {
        const p = data.planets[name];
        if (!p) return false;
        return Math.abs(ref.longitude - p.longitude) < 10;
      });
    }
    case 'OPPOSITION': {
      const { planets: [p1, p2] } = ast.params;
      const a = data.planets[p1];
      const b = data.planets[p2];
      if (!a || !b) return false;
      return Math.abs(Math.abs(a.longitude - b.longitude) - 180) < 10;
    }
    case 'TRINE': {
      const { planets: [p1, p2] } = ast.params;
      const a = data.planets[p1];
      const b = data.planets[p2];
      if (!a || !b) return false;
      const diff = Math.abs(a.longitude - b.longitude);
      return Math.abs(diff - 120) < 10 || Math.abs(diff - 240) < 10;
    }
    case 'SQUARE': {
      const { planets: [p1, p2] } = ast.params;
      const a = data.planets[p1];
      const b = data.planets[p2];
      if (!a || !b) return false;
      return Math.abs(Math.abs(a.longitude - b.longitude) - 90) < 10;
    }
    case 'SEXTILE': {
      const { planets: [p1, p2] } = ast.params;
      const a = data.planets[p1];
      const b = data.planets[p2];
      if (!a || !b) return false;
      return Math.abs(Math.abs(a.longitude - b.longitude) - 60) < 10;
    }
    case 'VEDIC_ASPECT': {
      const { aspector, aspectee } = ast.params;
      const a = data.planets[aspector];
      const b = data.planets[aspectee];
      if (!a || !b) return false;
      const seventhOpp = (a.house + 6) % 12 + 1;
      if (b.house === seventhOpp) return true;
      const specialAspects: Record<string, number[]> = {
        'Jupiter': [5, 7, 9], 'Mars': [4, 7, 8], 'Saturn': [3, 7, 10]
      };
      if (specialAspects[aspector]) {
        return specialAspects[aspector].some(h => {
          const target = (a.house - 1 + h - 1) % 12 + 1;
          return b.house === target;
        });
      }
      return false;
    }
    case 'MUTUAL_ASPECT': {
      const { planets: [p1, p2] } = ast.params;
      const a = data.planets[p1];
      const b = data.planets[p2];
      if (!a || !b) return false;
      const r1 = { operator: 'VEDIC_ASPECT', params: { aspector: p1, aspectee: p2 } };
      const r2 = { operator: 'VEDIC_ASPECT', params: { aspector: p2, aspectee: p1 } };
      return evaluateRule(r1 as RuleAST, data) && evaluateRule(r2 as RuleAST, data);
    }
    case 'OWN_SIGN': {
      const { planet } = ast.params;
      const p = data.planets[planet];
      if (!p) return false;
      const ownSigns: Record<string, number[]> = {
        'Sun': [5], 'Moon': [4], 'Mars': [1, 8], 'Mercury': [3, 6],
        'Jupiter': [9, 12], 'Venus': [2, 7], 'Saturn': [10, 11],
        'Rahu': [], 'Ketu': []
      };
      return (ownSigns[planet] || []).includes(p.sign);
    }
    case 'IS_EXALTED': {
      const { planet } = ast.params;
      const p = data.planets[planet];
      if (!p) return false;
      const exaltSigns: Record<string, number> = {
        'Sun': 1, 'Moon': 2, 'Mars': 10, 'Mercury': 6,
        'Jupiter': 4, 'Venus': 12, 'Saturn': 7
      };
      return exaltSigns[planet] === p.sign;
    }
    case 'IS_DEBILITATED': {
      const { planet } = ast.params;
      const p = data.planets[planet];
      if (!p) return false;
      const debSigns: Record<string, number> = {
        'Sun': 7, 'Moon': 8, 'Mars': 4, 'Mercury': 12,
        'Jupiter': 10, 'Venus': 6, 'Saturn': 1
      };
      return debSigns[planet] === p.sign;
    }
    case 'HOUSE_LORD_IN': {
      const { house, inHouse } = ast.params;
      if (!data.houseLords || !data.houseLords[house]) return false;
      const lord = data.houseLords[house].planet;
      const p = data.planets[lord];
      return p ? p.house === inHouse : false;
    }
    case 'D9_HOUSE_LORD_IN': {
      const { house, inHouse } = ast.params;
      if (!data.d9HouseLords || !data.d9HouseLords[house]) return false;
      const lord = data.d9HouseLords[house].planet;
      const d9P = data.d9Planets ? data.d9Planets[lord] : null;
      return d9P ? d9P.house === inHouse : false;
    }
    case 'IN_KENDRA': {
      const { planet } = ast.params;
      const p = data.planets[planet];
      return p ? [1, 4, 7, 10].includes(p.house) : false;
    }
    case 'IN_TRIKONA': {
      const { planet } = ast.params;
      const p = data.planets[planet];
      return p ? [1, 5, 9].includes(p.house) : false;
    }
    case 'IN_DUSTHANA': {
      const { planet } = ast.params;
      const p = data.planets[planet];
      return p ? [6, 8, 12].includes(p.house) : false;
    }
    case 'DYNAMIC_CONDITION':
      return evaluateDynamicCondition(ast.params, data);
    default:
      return false;
  }
}

function evaluateDynamicCondition(params: any, data: AstroChartData): boolean {
  if (!params) return false;

  if (params.condition === 'D1_D9_SAME_SIGN') {
    const planet = params.planet || 'Sun';
    const d1 = data.planets[planet];
    const d9 = data.d9Planets ? data.d9Planets[planet] : null;
    return d1 && d9 ? d1.sign === d9.sign : false;
  }

  if (params.condition === 'DASHA_ACTIVE') {
    return data.dasha ? data.dasha.currentLord === params.planet : false;
  }

  if (params.condition === 'TRANSIT_ASPECT') {
    const { transitPlanet, targetPlanet, aspectType } = params;
    const transit = data.transits ? data.transits[transitPlanet] : null;
    const target = data.planets[targetPlanet];
    if (!transit || !target) return false;
    const diff = Math.abs(transit.sign - target.sign);
    if (aspectType === 'conjunction') return diff < 2;
    if (aspectType === 'opposition') return Math.abs(diff - 6) < 2;
    if (aspectType === 'trine') return diff === 4 || diff === 8;
    return false;
  }

  if (params.condition === 'CONJUNCT_NATAL') {
    const { transitPlanet, natalPlanet } = params;
    const transit = data.transits ? data.transits[transitPlanet] : null;
    const natal = data.planets[natalPlanet];
    if (!transit || !natal) return false;
    return Math.abs(transit.sign - natal.sign) < 2;
  }

  if (params.condition === 'D1_D9_LORD_RELATION') {
    const { house } = params;
    if (!data.houseLords || !data.houseLords[house]) return false;
    const lord = data.houseLords[house].planet;
    const d1Planet = data.planets[lord];
    const d9Planet = data.d9Planets ? data.d9Planets[lord] : null;
    if (!d1Planet || !d9Planet) return false;
    if (params.relation === 'same_sign') return d1Planet.sign === d9Planet.sign;
    if (params.relation === 'different_sign') return d1Planet.sign !== d9Planet.sign;
    return false;
  }

  return false;
}

export { evaluateRule as default };
