import { calculateAshtakavarga } from '../../lib/astro-core';
import { success, error } from '../lib/response';
import { NavaAstroSDK } from '../../lib/astrology-sdk';

export async function handleAshtakavarga(request: Request, env: any, userId: string): Promise<Response> {
  const body = await request.json() as any;
  const birthData = body.birth_data;
  if (!birthData) return error('birth_data is required');

  const sdk = new NavaAstroSDK({ env });
  const chartData = await sdk.analyze({
    ...birthData,
    ayanamsa: body.config?.ayanamsa || 'LAHIRI'
  });

  const planets = chartData.math.planets;
  const lagnaSign = planets['Ascendant']?.sign || 1;
  const result = calculateAshtakavarga(planets, lagnaSign);

  const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
  const hindiPlanets: Record<string, string> = {
    'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
    'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि', 'Lagna': 'लग्न'
  };

  let report = `## 🔢 अष्टकवर्ग विश्लेषण (Ashtakavarga Analysis)\n\n`;
  report += `**कुल बिंदु:** ${result.sarvashtakavarga.reduce((a: number, b: number) => a + b, 0)} / 96\n\n`;

  report += `### भिन्नाष्टकवर्ग (Individual Planet Contributions)\n\n`;
  for (const [planet, bindus] of Object.entries(result.binnashtakavarga)) {
    const total = (bindus as number[]).reduce((a: number, b: number) => a + b, 0);
    report += `**${hindiPlanets[planet] || planet}:** ${total} बिंदु | `;
    report += (bindus as number[]).map((b, i) => `${hindiSigns[i + 1]}: ${b}`).join(', ');
    report += `\n\n`;
  }

  report += `### सर्वाष्टकवर्ग (Total Strength Per Sign)\n\n`;
  for (const s of result.signStrengths) {
    const bar = '█'.repeat(Math.floor(s.bindus / 2)) + '░'.repeat(Math.max(0, 24 - Math.floor(s.bindus / 2)));
    report += `**${s.name}:** ${s.bindus} बिंदु — ${s.interpretation}\n`;
    report += `  ${bar}\n\n`;
  }

  return success({ ...result, report });
}
