import { calculateShadbala } from '../../lib/astro-core';
import { success, error } from '../lib/response';
import { NavaAstroSDK } from '../../lib/astrology-sdk';

export async function handleShadbala(request: Request, env: any, userId: string): Promise<Response> {
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
  const isDayBirth = birthData.hour >= 6 && birthData.hour < 18;
  const result = calculateShadbala(planets as any, lagnaSign, isDayBirth);

  const hindiPlanets: Record<string, string> = {
    'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
    'Jupiter': 'गुरु', 'Venus': 'शुक्र', 'Saturn': 'शनि'
  };

  let report = `## ⚡ षड्बल विश्लेषण (Shadbala Analysis)\n\n`;
  report += `षड्बल ग्रहों की छह प्रकार की शक्तियों का मापन है। कुल बल 360 विरूप होता है, 180+ बलवान माना जाता है।\n\n`;

  for (const [planet, data] of Object.entries(result.planetary)) {
    const hName = hindiPlanets[planet] || planet;
    const barLen = Math.floor(data.totalBala / 10);
    const bar = '█'.repeat(Math.min(barLen, 36)) + '░'.repeat(Math.max(0, 36 - barLen));
    report += `**${hName} (${planet}):** कुल ${data.totalBala}/360 विरूप ${data.isStrong ? '✅ बलवान' : '⚠️ कमजोर'}\n`;
    report += `  ${bar}\n`;
    report += `  स्थान बल: ${data.sthanaBala} | दिग बल: ${data.digBala} | काल बल: ${data.kalaBala}\n`;
    report += `  चेष्टा बल: ${data.chestaBala} | नैसर्गिक बल: ${data.naisargikaBala} | अयन बल: ${data.ayanaBala}\n\n`;
  }

  report += `### शक्ति क्रम (Strength Ranking)\n\n`;
  result.strengths.forEach((s, i) => {
    report += `${i + 1}. **${hindiPlanets[s.planet] || s.planet}:** ${s.total} विरूप\n`;
  });

  return success({ ...result, report });
}
