import { calculateChart } from './astro-core';
import { evaluateRule } from './evaluator';
import { findMuhurtas } from './muhurat';
import { AnalysisResult, AstroChartData, RuleAST, SDKConfig, MuhurtaRequest, MuhurtaResult, CalculationParams } from './types';

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
    const houseMeanings: { [key: number]: string } = {
      1: "व्यक्तित्व", 2: "धन", 3: "साहस", 4: "सुख", 5: "शिक्षा", 
      6: "संघर्ष", 7: "विवाह", 8: "आयु", 9: "भाग्य", 10: "करियर", 11: "लाभ", 12: "व्यय"
    };

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

  private getStaticRules(data: AstroChartData): any[] {
    const staticRules = [
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
    ];

    return staticRules
      .filter(rule => evaluateRule(rule as any, data))
      .map(r => ({ name: r.name, category: r.category }));
  }

  private generateHeuristicReport(params: CalculationParams & { report_type?: string }, activeRules: any[], data: AstroChartData): string {
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

    let report = `### 📜 कुण्डली धारक का विवरण\n`;
    report += `- **लिंग:** ${gender === 'Male' ? 'पुरुष' : gender === 'Female' ? 'स्त्री' : 'अन्य'}\n`;
    report += `- **जन्म स्थान:** ${location}\n`;
    report += `- **विश्लेषण का विषय:** ${category}\n\n`;

    report += `### 🌌 ग्रहीय विश्लेषण\n\n`;
    Object.keys(data.planets).forEach(pName => {
      if (pName === 'Ascendant') return;
      const p = data.planets[pName];
      const signName = hindiSigns[p.sign];
      const meaning = planetMeanings[pName] || '';
      report += `- **${hindiPlanetNames[pName] || pName} (${meaning}):** ${p.house}वें भाव में **${signName}** राशि में\n`;
    });

    report += `\n### 🌟 सक्रिय योग\n\n`;
    if (activeRules.length > 0) {
      activeRules.forEach((rule: any) => {
        report += `- **${rule.name}** [${rule.category}]\n`;
      });
    } else {
      report += "कोई विशेष योग सक्रिय नहीं है।\n";
    }

    report += `\n### ⏳ वर्तमान दशा\n\n`;
    if (data.dasha) {
      report += `महादशा स्वामी: **${data.dasha.currentLord}** (प्रगति: ${(data.dasha.balanceFraction * 100).toFixed(1)}%)\n`;
    }

    return report;
  }
}
