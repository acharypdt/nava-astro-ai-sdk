import { calculateChart, calculateSadeSati, calculateExtraDivisionalCharts, calculateVarshaphal } from './astro-core';
import { evaluateRule } from './evaluator';
import { findMuhurtas } from './muhurat';
import {
  AnalysisResult, AstroChartData, RuleAST, SDKConfig,
  MuhurtaRequest, MuhurtaResult, CalculationParams,
  SadeSatiResult, VarshaphalResult, YogaResult
} from './types';

export class NavaAstroSDK {
  private config: SDKConfig;

  constructor(config: SDKConfig = {}) {
    this.config = config;
  }

  async analyze(params: CalculationParams & { report_type?: string }): Promise<AnalysisResult> {
    const mathData = await calculateChart(params);
    const activeRules = this.getStaticRules(mathData);
    const aiReport = this.generateHeuristicReport(params, activeRules, mathData);

    return {
      math: mathData,
      activeRules,
      aiReport
    };
  }

  resolveQuestionHeuristically(question: string, data: AstroChartData): string {
    const q = question.toLowerCase();
    const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

    let answer = `आपके प्रश्न: "${question}" का विश्लेषण (Heuristic Analytics):\n\n`;
    let remedy = "\n\n💡 **ज्योतिषीय परामर्श (Remedy):** ";

    const getLordInfo = (h: number) => {
      const lord = data.houseLords?.[h];
      if (!lord) return null;
      const planetDetails = data.planets[lord.planet];
      return { lord, planetDetails };
    };

    const dashaLord = data.dasha?.currentLord || "";

    if (q.includes("शादी") || q.includes("विवाह") || q.includes("marriage")) {
      const info7 = getLordInfo(7);
      if (info7) {
        answer += `आपके 7वें भाव (विवाह) के स्वामी **${info7.lord.planet}** हैं, जो कुण्डली में **${info7.planetDetails.house}वें भाव** में **${hindiSigns[info7.planetDetails.sign]} राशि** में स्थित हैं। `;
        if ([6, 8, 12].includes(info7.planetDetails.house)) {
          answer += `विवाह स्थान के स्वामी का त्रिक भाव में होना वैवाहिक सुख में कुछ बाधा या देरी का संकेत देता है। `;
        } else if ([1, 4, 7, 10, 5, 9].includes(info7.planetDetails.house)) {
          answer += `यह विवाह के लिए एक अत्यंत शुभ स्थिति है। `;
        }
      }
      remedy += "वैवाहिक सुख के लिए 'शुक्र' के बीज मंत्र का जाप करें और माँ दुर्गा की उपासना करें।";
    } else if (q.includes("करियर") || q.includes("नौकरी") || q.includes("career") || q.includes("job") || q.includes("business")) {
      const info10 = getLordInfo(10);
      if (info10) {
        answer += `दशम भाव (करियर) के अधिपति **${info10.lord.planet}** आपके **${info10.planetDetails.house}वें भाव** में विराजमान हैं। `;
      }
      remedy += "कार्यक्षेत्र में सफलता के लिए प्रत्येक शनिवार को शनि देव को सरसों के तेल का दीप अर्पित करें।";
    } else if (q.includes("पैसा") || q.includes("धन") || q.includes("money") || q.includes("finance") || q.includes("debt")) {
      const info2 = getLordInfo(2);
      const info11 = getLordInfo(11);
      answer += `आर्थिक समृद्धि के लिए 2वें (बचत) और 11वें (आमदनी) भाव का विश्लेषण किया गया है। `;
      if (info2 && info11) {
        answer += `आपके धन भाव के स्वामी **${info2.lord.planet}** और लाभ भाव के स्वामी **${info11.lord.planet}** हैं। `;
      }
      remedy += "आर्थिक उन्नति के लिए श्री सूक्त का पाठ करें।";
    } else if (q.includes("स्वास्थ्य") || q.includes("health") || q.includes("तबीयत")) {
      const info1 = getLordInfo(1);
      if (info1) {
        answer += `लग्न के स्वामी **${info1.lord.planet}** कुण्डली के **${info1.planetDetails.house}वें भाव** में स्थित हैं। `;
      }
      remedy += "अच्छे स्वास्थ्य के लिए आदित्य हृदय स्तोत्र का पाठ करें।";
    } else if (q.includes("शिक्षा") || q.includes("पढ़ाई") || q.includes("education")) {
      const info5 = getLordInfo(5);
      if (info5) {
        answer += `विद्या भाव के स्वामी **${info5.lord.planet}** आपके **${info5.planetDetails.house}वें भाव** में हैं। `;
      }
      remedy += "एकाग्रता के लिए माँ सरस्वती की आराधना करें।";
    } else if (q.includes("विदेश") || q.includes("foreign") || q.includes("abroad")) {
      const info12 = getLordInfo(12);
      const info9 = getLordInfo(9);
      answer += `विदेश गमन के लिए 12वें और 9वें भाव का अध्ययन किया जाता है। `;
      remedy += "विदेश संबंधी बाधाओं को दूर करने के लिए भगवान गणेश की उपासना करें।";
    } else {
      answer += `आपके प्रश्न का उत्तर देने के लिए कुण्डली का गहन अध्ययन किया गया है। वर्तमान समय आपकी कुण्डली की ऊर्जा को "${dashaLord}" के प्रभाव में सक्रिय कर रहा है।`;
      remedy = "";
    }

    return answer + remedy;
  }

  async findMuhurtas(baseParams: CalculationParams & { report_type?: string }, opts: MuhurtaRequest = {}): Promise<MuhurtaResult[]> {
    return await findMuhurtas(baseParams, opts);
  }

  validateRule(rule: RuleAST, data: AstroChartData): boolean {
    return evaluateRule(rule, data);
  }

  async analyzeSadeSati(params: CalculationParams): Promise<SadeSatiResult> {
    const chart = await calculateChart(params);
    const moonSign = chart.planets['Moon']?.sign || 1;
    return calculateSadeSati(moonSign);
  }

  async analyzeDivisionalCharts(params: CalculationParams): Promise<Record<string, any>> {
    const chart = await calculateChart(params);
    const planets = chart.planets;
    const lagnaLong = planets['Ascendant']?.longitude || 0;
    return calculateExtraDivisionalCharts(
      Object.fromEntries(Object.entries(planets).map(([k, v]) => [k, { longitude: v.longitude }])),
      lagnaLong
    );
  }

  async analyzeVarshaphal(params: CalculationParams, targetYear?: number): Promise<VarshaphalResult> {
    const chart = await calculateChart(params);
    const birthDate = new Date(params.year, params.month - 1, params.day);
    const sunLong = chart.planets['Sun']?.longitude || 0;
    const lagnaSign = chart.planets['Ascendant']?.sign || 1;
    const year = targetYear || new Date().getFullYear();
    return calculateVarshaphal(birthDate, sunLong, lagnaSign, year, params.lat, params.lng);
  }

  getStaticRules(data: AstroChartData): YogaResult[] {
    const staticRules: Array<{ name: string; operator: string; params?: any; operands?: any[]; category: string }> = [
      { name: "सूर्य दिग्बली (Sun in Digbala)", operator: 'IN_HOUSE', params: { planet: 'Sun', house: 10 }, category: "सफलता" },
      { name: "बृहस्पति चौथे भाव में (Jupiter in 4th)", operator: 'IN_HOUSE', params: { planet: 'Jupiter', house: 4 }, category: "सुख" },
      { name: "उच्च का सूर्य (Exalted Sun)", operator: 'IS_EXALTED', params: { planet: 'Sun' }, category: "नेतृत्व" },
      { name: "उच्च का चंद्रमा (Exalted Moon)", operator: 'IS_EXALTED', params: { planet: 'Moon' }, category: "धन" },
      { name: "उच्च का गुरु (Exalted Jupiter)", operator: 'IS_EXALTED', params: { planet: 'Jupiter' }, category: "ज्ञान" },
      { name: "स्वग्रही मंगल (Own Sign Mars)", operator: 'OWN_SIGN', params: { planet: 'Mars' }, category: "बल" },
      { name: "गुरु मंगल योग", operator: 'OR', operands: [
        { operator: 'CONJUNCT', params: { planets: ['Mars', 'Jupiter'] } },
        { operator: 'VEDIC_ASPECT', params: { aspector: 'Mars', aspectee: 'Jupiter' } }
      ], category: "धन और कर्म" },
      { name: "बुधादित्य योग", operator: 'CONJUNCT', params: { planets: ['Sun', 'Mercury'] }, category: "बुद्धि" },
      { name: "राहु-केतु अक्ष (Rahu-Ketu Axis)", operator: 'OR', operands: [
        { operator: 'CONJUNCT', params: { planets: ['Rahu', 'Ketu'] } },
        { operator: 'OPPOSITION', params: { planets: ['Rahu', 'Ketu'] } }
      ], category: "कर्म और मोक्ष" },
      { name: "गजकेसरी योग (Gajakesari Yoga)", operator: 'OR', operands: [
        { operator: 'CONJUNCT', params: { planets: ['Jupiter', 'Moon'] } },
        { operator: 'VEDIC_ASPECT', params: { aspector: 'Jupiter', aspectee: 'Moon' } }
      ], category: "ज्ञान और प्रतिष्ठा" },
      { name: "शश योग (Shasha Yoga)", operator: 'AND', operands: [
        { operator: 'OWN_SIGN', params: { planet: 'Saturn' } },
        { operator: 'IN_KENDRA', params: { planet: 'Saturn' } }
      ], category: "प्रतिष्ठा" },
      { name: "वेसी योग (Vesi Yoga)", operator: 'IN_HOUSE', params: { planet: 'Sun', house: [1, 2] }, category: "धन" },
      { name: "अनफा योग (Anapha Yoga)", operator: 'IN_HOUSE', params: { planet: 'Moon', house: [1, 12] }, category: "धन और यश" },
      { name: "दुरुधरा योग (Durudhara Yoga)", operator: 'AND', operands: [
        { operator: 'IN_HOUSE', params: { planet: 'Moon', house: [2] } },
        { operator: 'IN_HOUSE', params: { planet: 'Sun', house: [12] } }
      ], category: "धन" },
      { name: "नीच भंग राज योग", operator: 'OR', operands: [
        { operator: 'IS_DEBILITATED', params: { planet: 'Sun' } },
        { operator: 'IS_DEBILITATED', params: { planet: 'Moon' } },
        { operator: 'IS_DEBILITATED', params: { planet: 'Mars' } },
        { operator: 'IS_DEBILITATED', params: { planet: 'Mercury' } },
        { operator: 'IS_DEBILITATED', params: { planet: 'Jupiter' } },
        { operator: 'IS_DEBILITATED', params: { planet: 'Venus' } },
        { operator: 'IS_DEBILITATED', params: { planet: 'Saturn' } }
      ], category: "राजयोग" },
    ];

    return staticRules
      .filter(rule => evaluateRule(rule as any, data))
      .map(r => ({ name: r.name, category: r.category }));
  }

  generateHeuristicReport(params: CalculationParams & { report_type?: string }, activeRules: YogaResult[], data: AstroChartData): string {
    const category = params.report_type || 'General';
    const gender = params.gender || 'Unknown';
    const location = params.birthLocation || 'Not Specified';
    const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
    const hindiPlanetNames: Record<string, string> = {
      'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
      'Jupiter': 'बृहस्पति (गुरु)', 'Venus': 'शुक्र', 'Saturn': 'शनि',
      'Rahu': 'राहु', 'Ketu': 'केतु'
    };
    const houseMeanings: Record<number, string> = {
      1: "व्यक्तित्व", 2: "धन", 3: "साहस", 4: "सुख", 5: "शिक्षा",
      6: "संघर्ष", 7: "विवाह", 8: "आयु", 9: "भाग्य", 10: "करियर", 11: "लाभ", 12: "व्यय"
    };
    const planetMeanings: Record<string, string> = {
      'Sun': 'आत्मा, नेतृत्व', 'Moon': 'मन, भावनाएं', 'Mars': 'ऊर्जा, साहस',
      'Mercury': 'बुद्धि, संचार', 'Jupiter': 'ज्ञान, भाग्य', 'Venus': 'प्रेम, सौंदर्य',
      'Saturn': 'कर्म, अनुशासन', 'Rahu': 'माया, इच्छाएं', 'Ketu': 'मोक्ष, वैराग्य'
    };
    const signNatures: Record<number, string> = {
      1: 'अग्नि (Fire)', 2: 'पृथ्वी (Earth)', 3: 'वायु (Air)', 4: 'जल (Water)',
      5: 'अग्नि (Fire)', 6: 'पृथ्वी (Earth)', 7: 'वायु (Air)', 8: 'जल (Water)',
      9: 'अग्नि (Fire)', 10: 'पृथ्वी (Earth)', 11: 'वायु (Air)', 12: 'जल (Water)'
    };

    const dignityMap: Record<string, { exalt: number; own: number[] }> = {
      'Sun': { exalt: 1, own: [5] }, 'Moon': { exalt: 2, own: [4] },
      'Mars': { exalt: 10, own: [1, 8] }, 'Mercury': { exalt: 6, own: [3, 6] },
      'Jupiter': { exalt: 4, own: [9, 12] }, 'Venus': { exalt: 12, own: [2, 7] },
      'Saturn': { exalt: 7, own: [10, 11] }
    };

    function getDignity(planet: string, sign: number): string {
      const d = dignityMap[planet];
      if (!d) return 'सामान्य';
      if (sign === d.exalt) return 'उच्च का (Exalted)';
      if (d.own.includes(sign)) return 'स्वग्रही (Own Sign)';
      const debSign = ((d.exalt + 6 - 1) % 12) + 1;
      if (sign === debSign) return 'नीच का (Debilitated)';
      return 'सामान्य (Normal)';
    }

    let report = `## कुण्डली धारक का विवरण\n\n`;
    report += `- **लिंग:** ${gender === 'Male' ? 'पुरुष' : gender === 'Female' ? 'स्त्री' : 'अन्य'}\n`;
    report += `- **जन्म स्थान:** ${location}\n`;
    report += `- **विश्लेषण का विषय:** ${category}\n\n`;

    report += `## राशि स्वभाव (Sign Natures)\n\n`;
    Object.keys(data.planets).forEach(pName => {
      if (pName === 'Ascendant') return;
      const p = data.planets[pName];
      const nature = signNatures[p.sign] || 'अज्ञात';
      report += `- **${hindiPlanetNames[pName] || pName}:** ${hindiSigns[p.sign]} राशि — ${nature}\n`;
    });

    report += `\n## ग्रहीय विश्लेषण (D1)\n\n`;
    Object.keys(data.planets).forEach(pName => {
      if (pName === 'Ascendant') return;
      const p = data.planets[pName];
      const dignity = getDignity(pName, p.sign);
      const meaning = planetMeanings[pName] || '';
      report += `- **${hindiPlanetNames[pName] || pName} (${meaning})**\n`;
      report += `  - भाव: ${p.house}वाँ (${houseMeanings[p.house] || ''})\n`;
      report += `  - राशि: ${hindiSigns[p.sign]} (${p.sign})\n`;
      report += `  - दिग्बल: ${dignity}\n`;
      report += `  - वक्री: ${p.is_retrograde ? 'हाँ' : 'नहीं'}\n`;
    });

    report += `\n## D9 नवमांश विश्लेषण\n\n`;
    if (data.d9Planets) {
      Object.keys(data.d9Planets).forEach(pName => {
        const d9 = data.d9Planets![pName];
        const d1 = data.planets[pName];
        const isVargottama = d1 && d1.sign === d9.sign;
        report += `- **${hindiPlanetNames[pName] || pName}:** D9 में ${hindiSigns[d9.sign]} राशि, ${d9.house}वाँ भाव`;
        if (isVargottama) report += ` — **वर्गोत्तम (Vargottama)** ✦`;
        report += `\n`;
      });
    }

    report += `\n## भाव स्वामी विश्लेषण\n\n`;
    if (data.houseLords) {
      Object.entries(data.houseLords).forEach(([h, lord]) => {
        const planetData = data.planets[lord.planet];
        if (planetData) {
          report += `- **${h}वाँ भाव (${houseMeanings[parseInt(h)] || ''}):** स्वामी ${lord.planet}\n`;
          report += `  - स्थित: ${planetData.house}वें भाव में ${hindiSigns[planetData.sign]} राशि में\n`;
        }
      });
    }

    report += `\n## सक्रिय योग\n\n`;
    if (activeRules.length > 0) {
      activeRules.forEach((rule: YogaResult) => {
        report += `- **${rule.name}** [${rule.category}]\n`;
      });
    } else {
      report += "कोई विशेष योग सक्रिय नहीं है।\n";
    }

    report += `\n## वर्तमान दशा\n\n`;
    if (data.dasha) {
      report += `- **महादशा स्वामी:** ${data.dasha.currentLord}\n`;
      report += `- **प्रगति:** ${(data.dasha.balanceFraction * 100).toFixed(1)}%\n`;

      const dashaDescriptions: Record<string, string> = {
        'Sun': 'सूर्य दशा में नेतृत्व, प्रतिष्ठा और आत्मविश्वास बढ़ता है।',
        'Moon': 'चंद्र दशा में मानसिक स्थिति, भावनाएं और पारिवारिक जीवन प्रभावित होता है।',
        'Mars': 'मंगल दशा में ऊर्जा, साहस और नए कार्यों की शुरुआत होती है।',
        'Mercury': 'बुध दशा में शिक्षा, व्यापार और संचार में वृद्धि होती है।',
        'Jupiter': 'गुरु दशा में ज्ञान, धन और आध्यात्मिकता में वृद्धि होती है।',
        'Venus': 'शुक्र दशा में प्रेम, विलासिता और कलात्मक अभिव्यक्ति बढ़ती है।',
        'Saturn': 'शनि दशा में कर्म, अनुशासन और धैर्य की परीक्षा होती है।',
        'Rahu': 'राहु दशा में भौतिक इच्छाएं, अचानक परिवर्तन और नए अनुभव आते हैं।',
        'Ketu': 'केतु दशा में वैराग्य, आध्यात्मिकता और पुराने कर्मों का फल मिलता है।'
      };
      if (dashaDescriptions[data.dasha.currentLord]) {
        report += `- **प्रभाव:** ${dashaDescriptions[data.dasha.currentLord]}\n`;
      }
    }

    report += `\n## गोचर (Transit) विश्लेषण\n\n`;
    if (data.transits) {
      Object.keys(data.transits).forEach(tName => {
        const t = data.transits![tName];
        if (t) {
          const moonSign = data.planets['Moon']?.sign || 0;
          const isSadeSati = tName === 'Saturn' && Math.abs(t.sign - moonSign) <= 1;
          report += `- **${hindiPlanetNames[tName] || tName}:** ${hindiSigns[t.sign]} राशि में`;
          if (isSadeSati) report += ` ⚠️ **साढ़ेसाती प्रभाव**`;
          report += `\n`;
        }
      });
    }

    return report;
  }
}
