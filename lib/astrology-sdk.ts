/**
 * @file lib/astrology-sdk.ts
 * @description The NavaAstro AI SDK Core.
 * This class encapsulates the math, rule evaluation, and AI orchestration logic.
 * It can be used both within the worker and exported for other environments.
 */

import { calculateChart, CalculationParams } from './astro-core';
import { evaluateRule, AstroChartData, RuleAST } from './evaluator';

export interface SDKConfig {
  apiKey?: string;
  endpoint?: string;
  env?: any; // Cloudflare Env bindings
}

export interface AnalysisResult {
  math: AstroChartData;
  activeRules: any[];
  aiReport?: string;
}

export class NavaAstroSDK {
  private config: SDKConfig;

  constructor(config: SDKConfig = {}) {
    this.config = config;
  }

  /**
   * Core Method: Calculate and Analyze
   * Takes birth data and returns headless JSON analysis.
   */
  async analyze(params: CalculationParams & { report_type?: string }): Promise<AnalysisResult> {
    // 1. Math Calculation (Local via astronomy-engine)
    const mathData = await calculateChart(params);

    // 2. Rule Evaluation (D1 + Static Fallback)
    let activeRules: any[] = [];
    
    // Cloudflare D1 Integration (If available)
    if (this.config.env?.DB) {
      try {
        const { results } = await this.config.env.DB.prepare('SELECT * FROM astrology_rules WHERE is_active = 1').all();
        activeRules = results.filter((rule: any) => {
          try {
            const ast = JSON.parse(rule.condition_ast || rule.ast_json);
            return evaluateRule(ast, mathData);
          } catch (e) {
            return false;
          }
        }).map((r: any) => ({ name: r.name, category: r.category }));
      } catch (e) {
        console.warn("D1 Rule fetching failed, using static fallback.");
      }
    }

    // Comprehensive Static Rule Set for Client-side / "Build-in" Standalone use
    if (activeRules.length === 0) {
      activeRules = this.getStaticRules(mathData);
    }

    // 3. Heuristic Interpretation Engine (Purely Local)
    const aiReport = this.generateHeuristicReport(params.report_type || 'General', activeRules, mathData);

    return {
      math: mathData,
      activeRules,
      aiReport
    };
  }

  /**
   * Comprehensive Static Rule Set for "Actual" results without DB
   */
  private getStaticRules(data: AstroChartData): any[] {
    const staticRules = [
      // Basic Placements
      { name: "सूर्य दिग्बली (Sun in Digbala)", operator: 'IN_HOUSE', params: { planet: 'Sun', house: 10 }, category: "सफलता" },
      { name: "बृहस्पति चौथे भाव में (Jupiter in 4th)", operator: 'IN_HOUSE', params: { planet: 'Jupiter', house: 4 }, category: "सुख" },
      { name: "उच्च का सूर्य (Exalted Sun)", operator: 'IS_EXALTED', params: { planet: 'Sun' }, category: "नेतृत्व" },
      { name: "उच्च का चंद्रमा (Exalted Moon)", operator: 'IS_EXALTED', params: { planet: 'Moon' }, category: "धन" },
      { name: "उच्च का गुरु (Exalted Jupiter)", operator: 'IS_EXALTED', params: { planet: 'Jupiter' }, category: "ज्ञान" },
      { name: "स्वग्रही मंगल (Own Sign Mars)", operator: 'OWN_SIGN', params: { planet: 'Mars' }, category: "बल" },
      
      // Specifically requested Sambandhas (Relationships)
      { 
        name: "गुरु मंगल योग", 
        operator: 'OR', 
        operands: [
          { operator: 'CONJUNCT', params: { planets: ['Mars', 'Jupiter'] } },
          { operator: 'VEDIC_ASPECT', params: { aspector: 'Mars', aspectee: 'Jupiter' } },
          { operator: 'VEDIC_ASPECT', params: { aspector: 'Jupiter', aspectee: 'Mars' } }
        ],
        category: "धन और कर्म" 
      },
      { 
        name: "विष / पुनर्भू योग", 
        operator: 'OR', 
        operands: [
          { operator: 'CONJUNCT', params: { planets: ['Moon', 'Saturn'] } },
          { operator: 'VEDIC_ASPECT', params: { aspector: 'Saturn', aspectee: 'Moon' } }
        ],
        category: "मन और अनुशासन" 
      },
      { 
        name: "शनि शुक्र संबंध", 
        operator: 'OR', 
        operands: [
          { operator: 'CONJUNCT', params: { planets: ['Saturn', 'Venus'] } },
          { operator: 'VEDIC_ASPECT', params: { aspector: 'Saturn', aspectee: 'Venus' } }
        ],
        category: "व्यावहारिक संपत्ति" 
      },
      { 
        name: "चंद्र मंगल योग", 
        operator: 'OR', 
        operands: [
          { operator: 'CONJUNCT', params: { planets: ['Moon', 'Mars'] } },
          { operator: 'VEDIC_ASPECT', params: { aspector: 'Mars', aspectee: 'Moon' } }
        ],
        category: "आर्थिक प्रेरणा" 
      },
      { 
        name: "बुधादित्य योग", 
        operator: 'CONJUNCT', 
        params: { planets: ['Sun', 'Mercury'] }, 
        category: "बुद्धि" 
      },
      {
        name: "राहु-केतु अक्ष (Rahu-Ketu Axis)",
        operator: 'OR',
        operands: [
          { operator: 'CONJUNCT', params: { planets: ['Rahu', 'Ketu'] } },
          { operator: 'OPPOSITION', params: { planets: ['Rahu', 'Ketu'] } }
        ],
        category: "कर्म और मोक्ष"
      }
    ];

    return staticRules
      .filter(rule => evaluateRule(rule as any, data))
      .map(r => ({ name: r.name, category: r.category }));
  }

  /**
   * Internal Heuristic Interpretation Engine
   */
  private generateHeuristicReport(category: string, activeRules: any[], data: AstroChartData): string {
    const yogaCount = activeRules.length;
    let report = `आपकी ${category} कुण्डली (D1), नवमांश (D9), वर्तमान महादशा और गोचर के विश्लेषण के आधार पर रिपोर्ट: \n\n`;

    // Base planets
    const sun = data.planets['Sun'];
    const moon = data.planets['Moon'];
    
    if (sun) report += `**मूल स्वभाव:** सूर्य ${sun.house}वें भाव में होने से, आपके जीवन का मूल स्वभाव और आत्मा इसी क्षेत्र से प्रेरित होती है। `;
    if (moon) report += `चंद्रमा ${moon.house}वें भाव में है, जो यह दर्शाता है कि आपका मन और भावनाएं किस दिशा में सर्वाधिक सक्रिय हैं।\n\n`;

    // Dasha Analysis
    if (data.dasha) {
      report += `### ⏳ वर्तमान विंशोत्तरी महादशा\n`;
      report += `वर्तमान में आप **${data.dasha.currentLord}** ग्रह की महादशा से गुजर रहे हैं। `;
      if (['Saturn', 'Rahu', 'Ketu'].includes(data.dasha.currentLord)) {
        report += `यह समय अत्यंत कर्म-प्रधान और जीवन में बड़े परिवर्तन लाने वाला है। आपको धैर्य और कड़ी मेहनत की आवश्यकता है।\n\n`;
      } else if (['Jupiter', 'Venus'].includes(data.dasha.currentLord)) {
        report += `यह समय भाग्य, विस्तार, और सुख-समृद्धि का है। यह आपके जीवन में वृद्धि और नए अवसर लेकर आएगा।\n\n`;
      } else {
        report += `यह समय आपके जीवन में ऊर्जा, क्रियान्वयन और स्थिरता के निर्माण का है।\n\n`;
      }
    }

    // Navamsha (D9) Analysis
    if (data.d9Planets) {
      report += `### 🧬 नवमांश (D9) आंतरिक बल\n`;
      const d9Jupiter = data.d9Planets['Jupiter'];
      if (d9Jupiter && [4, 9, 12].includes(d9Jupiter.sign)) {
         report += `नवमांश कुण्डली में बृहस्पति अत्यंत मजबूत स्थिति में है जो आपके भाग्य और वैवाहिक जीवन की आंतरिक शक्ति को मजबूत करता है। `;
      }
      const d9Sun = data.d9Planets['Sun'];
      if (d9Sun && d9Sun.sign === 1) { // Exalted in D9 (Vargottama if D1 is also Aries, but strictly exalted here)
         report += `नवमांश कुण्डली में आपका सूर्य उच्च का है, जो यह सुनिश्चित करता है कि जीवन के उत्तरार्ध में आपको अपार सम्मान मिलेगा। `;
      }
      report += `नवमांश कुण्डली आपको अपनी क्षमताओं की गहराई का एहसास कराती है।\n\n`;
    }

    // Gochar (Transit) Sade Sati check
    if (data.transits && moon) {
      report += `### 🔄 वर्तमान गोचर (Transits) प्रभाव\n`;
      const transitSaturn = data.transits['Saturn'];
      const moonSign = moon.sign;
      
      const dist = (transitSaturn.sign - moonSign + 12) % 12;
      if (dist === 11 || dist === 0 || posMod(transitSaturn.sign - moonSign) === 1) { 
        // 12th from moon = 11 array diff, 1st from moon = 0, 2nd from moon = 1.
        report += `⚠️ **शनि की साढ़ेसाती:** वर्तमान में गोचर का शनि आपके जन्म के चंद्रमा से प्रभावित क्षेत्र में है। यह साढ़ेसाती का प्रभाव है। यह आपके कर्मों की शुद्धि का समय है; मानसिक तनाव बढ़ सकता है, इसलिए ध्यान और धार्मिक कार्यों पर ध्यान केंद्रित करें।\n\n`;
      } else if (dist === 7) {
        report += `⚠️ **अष्टम ढैय्या:** शनि आपके चंद्रमा से अष्टम भाव में गोचर कर रहा है। स्वास्थ्य और अचानक आने वाली बाधाओं के प्रति सावधान रहें।\n\n`;
      } else {
        const transitJupiter = data.transits['Jupiter'];
        if (transitJupiter.sign === moon.sign) {
          report += `✨ **गुरु का गोचर:** गुरु आपके चंद्रमा के ऊपर से गोचर कर रहा है, जो आंतरिक विकास और नए ज्ञान के अवसर ला रहा है।\n\n`;
        } else {
          report += `वर्तमान ग्रहों का गोचर आपके जन्म के ग्रहों के साथ एक सामान्य सामंजस्य बनाकर चल रहा है।\n\n`;
        }
      }
    }

    report += "### 🌟 जन्म कुण्डली (D1) के प्रमुख योग (Yogas)\n\n";

    if (yogaCount > 0) {
      activeRules.forEach(rule => {
        switch (rule.name) {
          case 'गुरु मंगल योग':
            report += "✨ **गुरु मंगल योग**: मंगल और गुरु का यह संबंध आपको धर्म, महत्वाकांक्षा और धन का एक अद्भुत संतुलन देता है।\n\n";
            break;
          case 'विष / पुनर्भू योग':
            report += "🌙 **विष / पुनर्भू योग**: चंद्रमा पर शनि का प्रभाव एक बहुत ही गंभीर, अनुशासित मानसिकता देता है।\n\n";
            break;
          case 'शनि शुक्र संबंध':
            report += "⚖️ **शनि-शुक्र संबंध**: शनि और शुक्र का संबंध धन के मामलों में बहुत अनुशासित दृष्टिकोण देता है।\n\n";
            break;
          case 'चंद्र मंगल योग':
            report += "💰 **चंद्र मंगल योग**: आपको एक अत्यंत तेज दिमाग देता है जो आर्थिक सफलता प्राप्त करने पर बहुत केंद्रित है।\n\n";
            break;
          case 'बुधादित्य योग':
            report += "🧠 **बुधादित्य योग**: सूर्य और बुध की युति आपको एक तेज बुद्धि और शानदार संवाद कौशल देती है।\n\n";
            break;
          case 'सूर्य दिग्बली (Sun in Digbala)':
            report += "☀️ **सूर्य दिग्बली (10वें भाव में)**: सूर्य दसवें भाव में नेतृत्व क्षमता प्रदान करता है।\n\n";
            break;
          case 'बृहस्पति चौथे भाव में (Jupiter in 4th)':
            report += "🌟 **बृहस्पति चौथे भाव में**: यह आपके जीवन में ढेर सारा सुख और संपत्ति सुख लेकर आता है।\n\n";
            break;
          case 'राहु-केतु अक्ष (Rahu-Ketu Axis)': {
            const rahu = data.planets['Rahu'];
            const ketu = data.planets['Ketu'];
            if (rahu && ketu) {
                const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
                const rahuSign = hindiSigns[rahu.sign] || "";
                const ketuSign = hindiSigns[ketu.sign] || "";
                report += `🌀 **राहु-केतु कर्म अक्ष (${rahu.house}/${ketu.house} भाव)**: कुण्डली में राहु ${rahu.house}वें भाव (${rahuSign} राशि) में विराजमान है, जो इस क्षेत्र में अत्यंत गहरी महत्वाकांक्षा, भौतिक विस्तार और अप्रत्याशित जुनून पैदा करता है। इसके ठीक 180° विपरीत केतु ${ketu.house}वें भाव (${ketuSign} राशि) में है, जो पूर्व जन्मों की पूर्णता, कर्म त्याग (वैराग्य) और रहस्यमय अंतर्ज्ञान (Mystic intuition) को दर्शाता है। यह "${rahu.house}-${ketu.house}" भावों का ध्रुवीकरण आपके जीवन के सबसे बड़े मानसिक द्वंद्व और आध्यात्मिक उन्नति (Spiritual Evolution) के मार्ग को गहराई से परिभाषित करता है।\n\n`;
            }
            break;
          }
          default:
            report += `🔹 **${rule.name}** [${rule.category}]: यह कुण्डली का एक महत्वपूर्ण योग है जो विशिष्ट प्रभाव डालता है।\n\n`;
        }
      });
    } else {
      report += "जन्म कुण्डली में ग्रहों की ऊर्जा का बहुत ही संतुलित वितरण है। सफलता निरंतर और सामान्य प्रयासों से आएगी।\n\n";
    }

    report += "*(यह विवरण NavaAstro के ऑटोनॉमस गणितीय इंजन द्वारा D1, D9, गोचर और महादशा के आधार पर स्वचालित रूप से तैयार किया गया है।)*";
    
    return report;
  }

  /**
   * Utility: Validate an AST rule locally
   */
  validateRule(rule: RuleAST, data: AstroChartData): boolean {
    return evaluateRule(rule, data);
  }
}

function posMod(n: number, m: number = 12): number {
  return ((n % m) + m) % m;
}
