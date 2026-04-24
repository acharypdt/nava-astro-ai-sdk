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
  heuristicAnswer?: string;
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
    const aiReport = this.generateHeuristicReport(params, activeRules, mathData);

    return {
      math: mathData,
      activeRules,
      aiReport
    };
  }

  /**
   * AI-based Question Resolution using Cloudflare Workers AI + Managed AI Search
   * Updated to leverage the April 16 Cloudflare "AI Search" Managed RAG Service.
   */
  async resolveQuestionWithAI(question: string, data: AstroChartData): Promise<string> {
    
    let searchContext = "";

    try {
       // Step 1: Query the Managed AI Search Service (via REST API to avoid Binding Errors)
       const accountId = this.config.env?.CLOUDFLARE_ACCOUNT_ID;
       const apiToken = this.config.env?.CLOUDFLARE_API_TOKEN;
       
       if (accountId && apiToken) {
           try {
               const indexName = "yagya-ashram";
               const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-search/indexes/${indexName}/query`;
               
               const searchRes = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ text: question })
               });

               if (searchRes.ok) {
                 const searchResults = await searchRes.json() as any;
                 
                 // Format the retrieved documents/snippets as context
                 const docs = searchResults?.result || [];
                 if (docs.length > 0) {
                   searchContext = "\n\n[Cloudflare AI Search: Indexed Knowledge]\n";
                   docs.slice(0, 3).forEach((res: any) => {
                      searchContext += `- ${res.text || res.content || JSON.stringify(res)}\n`;
                   });
                   searchContext += "[/Cloudflare AI Search]\n";
                 }
               } else {
                 console.warn("AI Search REST API Error:", await searchRes.text());
               }
           } catch (idxErr) {
               console.warn("Could not query Cloudflare AI Search via REST:", idxErr);
           }
       } else {
           console.warn("CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN not set for AI Search REST.");
       }
    } catch (e) {
       console.warn("AI Search setup issue:", e);
    }

    const prompt = `तुम एक प्रकांड वैदिक ज्योतिषी हो। नीचे दी गई कुण्डली विश्लेषण रिपोर्ट को ध्यान से पढ़ें:

[कुण्डली डेटा]
${JSON.stringify(data.planets)}
${JSON.stringify(data.houseLords)}
[/कुण्डली डेटा]${searchContext}

उपयोगकर्ता का विशेष प्रश्न है: "${question}"

उपरोक्त डेटा और AI Search ज्ञानकोश के आधार पर, इस प्रश्न का अत्यंत सटीक, प्रामाणिक और ज्योतिषीय उत्तर दें। 
उत्तर को हमेशा हिंदी में, सहायक और सकारात्मक (Empathetic & Positive) रखें।`;

    try {
      if (this.config.env?.AI) {
        try {
          const response = await this.config.env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
              { role: 'system', content: 'You are an expert Vedic Astrologer. You must ALWAYS respond in Hindi (हिंदी). Provide a very detailed, deep and comprehensive astrological analysis.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2048
          });

          if (response && response.response) {
              return response.response;
          }
        } catch (betaError) {
          console.warn("Cloudflare Native AI encountered an error, falling back:", betaError);
          return "क्षमा करें, AI मॉडल से उत्तर उत्पन्न करने में समस्या आई।";
        }
      }

      return "क्षमा करें, Cloudflare AI (Native) उत्तर उत्पन्न नहीं कर सका।";
    } catch (error) {
      console.error("Cloudflare AI Error:", error);
      return "Cloudflare Native AI के कनेक्शन में समस्या आई (Beta)। कृपया बाद में प्रयास करें।";
    }
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
      },
      {
        name: "Mutual Aspect between Venus and Mars",
        operator: 'OR',
        operands: [
          { operator: 'CONJUNCT', params: { planets: ['Venus', 'Mars'] } },
          { operator: 'TRINE', params: { planets: ['Venus', 'Mars'] } },
          { operator: 'SEXTILE', params: { planets: ['Venus', 'Mars'] } },
          { operator: 'OPPOSITION', params: { planets: ['Venus', 'Mars'] } },
          { operator: 'SQUARE', params: { planets: ['Venus', 'Mars'] } }
        ],
        category: "Relationship Harmony"
      }
    ];

    return staticRules
      .filter(rule => evaluateRule(rule as any, data))
      .map(r => ({ name: r.name, category: r.category }));
  }

  /**
   * Resolve a specific question using built-in heuristic logic (No Gemini)
   */
  resolveQuestionHeuristically(question: string, data: AstroChartData): string {
    const q = question.toLowerCase();
    const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
    const houseMeanings: { [key: number]: string } = {
      1: "व्यक्तित्व", 2: "धन", 3: "साहस", 4: "सुख", 5: "शिक्षा", 
      6: "संघर्ष", 7: "विवाह", 8: "आयु", 9: "भाग्य", 10: "करियर", 11: "लाभ", 12: "व्यय"
    };

    let answer = `आपके प्रश्न: "${question}" का विश्लेषण (Heuristic Analytics):\n\n`;

    const getLordInfo = (h: number) => {
      const lord = data.houseLords?.[h];
      if (!lord) return null;
      const planetDetails = data.planets[lord.planet];
      return { lord, planetDetails };
    };

    const dashaLord = data.dasha?.currentLord || "";
    let remedy = "\n\n💡 **ज्योतिषीय परामर्श (Remedy):** ";

    // Keyword Logic
    if (q.includes("शादी") || q.includes("विवाह") || q.includes("marriage")) {
      const info7 = getLordInfo(7);
      if (info7) {
        answer += `आपके 7वें भाव (विवाह) के स्वामी **${info7.lord.planet}** हैं, जो कुण्डली में **${info7.planetDetails.house}वें भाव** में **${hindiSigns[info7.planetDetails.sign]} राशि** में स्थित हैं। `;
        if ([6, 8, 12].includes(info7.planetDetails.house)) {
           answer += `विवाह स्थान के स्वामी का त्रिक भाव (Bad Houses) में होना वैवाहिक सुख में कुछ बाधा या देरी का संकेत देता है। `;
        } else if ([1, 4, 7, 10, 5, 9].includes(info7.planetDetails.house)) {
           answer += `यह विवाह के लिए एक अत्यंत शुभ स्थिति है जो एक सहायक और समृद्ध जीवनसाथी की ओर इशारा करती है। `;
        }

        if (dashaLord === info7.lord.planet || dashaLord === 'Venus') {
            answer += `💥 **महत्वपूर्ण:** अभी आपकी **${dashaLord}** की महादशा भी चल रही है, जो इस समय विवाह के योगों को बहुत अधिक सक्रिय (Activate) कर रही है। `;
        }
      }
      const venus = data.planets['Venus'];
      answer += `शुक्र (विवाह का कारक) **${venus.house}वें भाव** में स्थित होकर आपके संबंधों में आकर्षण और प्रेम को नियंत्रित कर रहा है। `;
      remedy += "वैवाहिक सुख के लिए 'शुक्र' के बीज मंत्र का जाप करें और माँ दुर्गा की उपासना करें। माता-पिता का सम्मान करना विशेष लाभ देगा।";
    } 
    else if (q.includes("करियर") || q.includes("नौकरी") || q.includes("career") || q.includes("job") || q.includes("business")) {
      const info10 = getLordInfo(10);
      if (info10) {
        answer += `दशम भाव (करियर) के अधिपति **${info10.lord.planet}** आपके **${info10.planetDetails.house}वें भाव** में विराजमान हैं। यह स्पष्ट करता है कि आपके करियर की दिशा मुख्य रूप से "${houseMeanings[info10.planetDetails.house]}" से जुड़ी रहेगी। `;
        if (info10.planetDetails.house === 10) answer += `दशमेश का अपने ही भाव (10th) में होना करियर में उच्च पद, सत्ता और जबरदस्त स्थिरता का योग बनाता है। `;
        
        if (dashaLord === info10.lord.planet || dashaLord === 'Saturn' || dashaLord === 'Sun') {
            answer += `💥 **महत्वपूर्ण:** वर्तमान **${dashaLord}** की दशा आपके पेशेवर जीवन (Professional Life) में बड़े बदलाव और प्रगति का संकेत दे रही है। `;
        }
      }
      remedy += "कार्यक्षेत्र में सफलता के लिए प्रत्येक शनिवार को शनि देव को सरसों के तेल का दीप अर्पित करें और 'ॐ नमः शिवाय' का मानसिक जाप करें।";
    }
    else if (q.includes("पैसा") || q.includes("धन") || q.includes("money") || q.includes("finance") || q.includes("debt")) {
      const info2 = getLordInfo(2);
      const info11 = getLordInfo(11);
      answer += `आर्थिक समृद्धि के लिए 2वें (बचत) और 11वें (आमदनी) भाव का विश्लेषण किया गया है। `;
      if (info2 && info11) {
         answer += `आपके धन भाव के स्वामी **${info2.lord.planet}** और लाभ भाव के स्वामी **${info11.lord.planet}** हैं। `;
         if (info11.planetDetails.house === 11 || info11.planetDetails.house === 2 || info11.planetDetails.house === 5 || info11.planetDetails.house === 9) {
             answer += `धन और लाभ भाव के स्वामियों का केंद्र या त्रिकोण में होना **'धन योग'** का निर्माण करता है, जो दीर्घकालिक समृद्धि सुनिश्चित करता है। `;
         }
         if (q.includes("ऋण") || q.includes("कर्ज") || q.includes("debt")) {
            const info6 = getLordInfo(6);
            answer += `छठे भाव (ऋण) के स्वामी **${info6?.lord.planet}** की स्थिति यह तय करेगी कि आप कर्ज से कितनी जल्दी मुक्त होंगे। `;
         }
      }
      remedy += "आर्थिक उन्नति के लिए श्री सूक्त का पाठ करें और शुक्रवार को सफेद वस्तुओं (जैसे चावल या दूध) का दान करें। कनकधारा स्त्रोत का पाठ अत्यंत प्रभावशाली रहेगा।";
    }
    else if (q.includes("स्वास्थ्य") || q.includes("health") || q.includes("तबीयत") || q.includes("disease")) {
      const info1 = getLordInfo(1);
      if (info1) {
        answer += `लग्न (शरीर और आत्म-शक्ति) के स्वामी **${info1.lord.planet}** कुण्डली के **${info1.planetDetails.house}वें भाव** में स्थित हैं। `;
        if ([6, 8, 12].includes(info1.planetDetails.house)) answer += `स्वास्थ्य के प्रति सावधानी बरतें, विशेष रूप से ऊर्जा के संरक्षण की आवश्यकता है। `;
        else answer += `यह स्थिति दर्शाती है कि आपकी रोग-प्रतिरोधक क्षमता और जीवनी शक्ति बेहतरीन है। `;
      }
      remedy += "अच्छे स्वास्थ्य के लिए आदित्य हृदय स्तोत्र का पाठ करें और प्रत्येक रविवार को सूर्य को जल अर्पित करें। योग और आयुर्वेद को जीवन का हिस्सा बनाएं।";
    }
    else if (q.includes("शिक्षा") || q.includes("पढ़ाई") || q.includes("education") || q.includes("study") || q.includes("exam")) {
      const info5 = getLordInfo(5);
      if (info5) {
        answer += `विद्या भाव (5th) के स्वामी **${info5.lord.planet}** आपके **${info5.planetDetails.house}वें भाव** में हैं। `;
        if (info5.planetDetails.house === 5 || info5.planetDetails.house === 9 || info5.planetDetails.house === 1) {
            answer += `यह उच्च बौद्धिक क्षमता और परीक्षाओं में सफलता के लिए एक श्रेष्ठ राजयोग के समान है। `;
        }
      }
      remedy += "एकाग्रता और विद्या के लिए माँ सरस्वती की आराधना करें और 'ॐ ऐं ह्रीं क्लीं महासरस्वत्यै नमः' मंत्र का जाप करें। उत्तर-पूर्व दिशा में मुख करके पढ़ाई करें।";
    }
    else if (q.includes("भाग्य") || q.includes("luck") || q.includes("fortune")) {
      const info9 = getLordInfo(9);
      if (info9) {
        answer += `भाग्य भाव (9th) के अधिपति **${info9.lord.planet}** की स्थिति कुण्डली के **${info9.planetDetails.house}वें भाव** में है। `;
        if ([9, 10, 11, 1, 4, 7, 5].includes(info9.planetDetails.house)) answer += `आपका भाग्य प्रबल है और ईश्वरीय कृपा आपके कार्यों को सिद्ध करने में सदैव आपके साथ रहेगी। `;
        else answer += `भाग्य का साथ पाने के लिए आपको कड़ी मेहनत और संकल्प की अधिक आवश्यकता होगी। `;
      }
      remedy += "भाग्य को प्रबल करने के लिए गुरुजनों और बड़ों का आशीर्वाद लें। विष्णु सहस्रनाम का पाठ करना आपके लिए अत्यंत कल्याणकारी होगा।";
    }
    else if (q.includes("विदेश") || q.includes("foreign") || q.includes("abroad") || q.includes("visa")) {
      const info12 = getLordInfo(12);
      const info9 = getLordInfo(9);
      answer += `विदेश गमन के लिए 12वें (व्यय/विदेश) और 9वें (लंबी यात्रा) भाव का अध्ययन किया जाता है। `;
      if (info12 && info9) {
        if ([12, 9, 7, 8].includes(info12.planetDetails.house)) answer += `आपकी कुण्डली में सुदूर यात्रा, विदेश में शिक्षा या निवास के अत्यंत प्रबल और स्पष्ट संकेत मिल रहे हैं। `;
        else answer += `फिलहाल विदेश जाने के योग थोड़े कमजोर हैं, लेकिन वर्तमान दशा के अनुकूल होने पर प्रयास सफल हो सकते हैं। `;
      }
      remedy += "विदेश संबंधी बाधाओं को दूर करने के लिए भगवान गणेश की उपासना करें और बुधवार को मूंग की दाल का दान करें। राहु के मंत्रों का जाप भी सहायक हो सकता है।";
    }
    else {
      answer += `आपके प्रश्न का सटीक उत्तर देने के लिए कुण्डली के प्रमुख योगों, भाव स्वामियों और वर्तमान दशा का गहन अध्ययन किया गया है। वर्तमान समय आपकी कुण्डली की ऊर्जा को "${dashaLord}" के प्रभाव में सक्रिय कर रहा है। सकारात्मक रहें और कर्म पर विश्वास रखें। विस्तृत जानकारी के लिए मुख्य रिपोर्ट के विशिष्ट अनुभागों का संदर्भ लें।`;
      remedy = ""; // No specific remedy for general query
    }

    return answer + remedy;
  }

  /**
   * Internal Heuristic Interpretation Engine
   */
  private generateHeuristicReport(params: CalculationParams & { report_type?: string }, activeRules: any[], data: AstroChartData): string {
    const category = params.report_type || 'General';
    const gender = params.gender || 'Unknown';
    const location = params.birthLocation || 'Not Specified';

    const yogaCount = activeRules.length;
    const hindiSigns = ["", "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
    
    let report = `### 📜 कुण्डली धारक का विवरण\n`;
    report += `- **लिंग:** ${gender === 'Male' ? 'पुरुष' : gender === 'Female' ? 'स्त्री' : 'अन्य'}\n`;
    report += `- **जन्म स्थान:** ${location}\n`;
    const tz = params.timezone !== undefined ? params.timezone : 5.5;
    report += `- **टाइमज़ोन (Offset):** ${tz >= 0 ? '+' : ''}${tz}\n`;
    report += `- **विश्लेषण का विषय:** ${category}\n`;
    
    const lagna = data.planets['Ascendant'];
    if (lagna) {
      report += `- **लग्न (Ascendant):** ${hindiSigns[lagna.sign]} (${lagna.longitude.toFixed(2)}°)\n`;
    }
    report += `\n`;

    report += `आपकी ${category} कुण्डली (D1), नवमांश (D9), वर्तमान महादशा और गोचर के पूर्ण ज्योतिषीय विश्लेषण के आधार पर विस्तृत रिपोर्ट: \n\n`;

    const houseMeanings: { [key: number]: string } = {
      1: "व्यक्तित्व, स्वास्थ्य और आत्म-पहचान",
      2: "संचित धन, परिवार और वाणी",
      3: "पराक्रम, संचार और छोटे भाई-बहन",
      4: "सुख, माता, घर और संपत्ति",
      5: "बुद्धि, रचनात्मकता, संतान और विद्या",
      6: "संघर्ष, रोग, ऋण और नौकरी",
      7: "विवाह, साझेदारी और जनसंपर्क",
      8: "रहस्य, परिवर्तन, आयु और अचानक घटनाक्रम",
      9: "धर्म, भाग्य, उच्च शिक्षा और गुरु",
      10: "कर्म, करियर, पिता और सामाजिक स्थिति",
      11: "लाभ, बड़े भाई-बहन और इच्छापूर्ति",
      12: "व्यय, एकांत, मोक्ष और विदेश यात्रा"
    };

    // Comprehensive Planet Analysis
    report += `### 🌌 जन्म कुण्डली (D1) ग्रहीय विश्लेषण\n\n`;
    
    const planetMeanings: { [key: string]: string } = {
      'Sun': 'आत्मा, आत्मविश्वास, पिता और नेतृत्व',
      'Moon': 'मन, भावनाएं, माता और आंतरिक शांति',
      'Mars': 'ऊर्जा, साहस, भाई और महत्वाकांक्षा',
      'Mercury': 'बुद्धि, संचार, व्यापार और तर्कशक्ति',
      'Jupiter': 'ज्ञान, भाग्य, गुरु, धर्म और विस्तार',
      'Venus': 'प्रेम, सौंदर्य, विवाह, कला और भौतिक सुख',
      'Saturn': 'कर्म, अनुशासन, आयु, धैर्य और संरचना',
      'Rahu': 'माया, विस्तार, भौतिक इच्छाएं और अप्रत्याशित घटनाएं',
      'Ketu': 'मोक्ष, वैराग्य, अंतर्ज्ञान और पूर्व जन्म के संस्कार',
    };

    const hindiPlanetNames: { [key: string]: string } = {
      'Sun': 'सूर्य', 'Moon': 'चंद्रमा', 'Mars': 'मंगल', 'Mercury': 'बुध',
      'Jupiter': 'बृहस्पति (गुरु)', 'Venus': 'शुक्र', 'Saturn': 'शनि',
      'Rahu': 'राहु', 'Ketu': 'केतु'
    };

    const signNatures: { [key: number]: string } = {
      1: "अत्यंत ऊर्जावान, आक्रामक और त्वरित (Fire)",
      2: "स्थिर, व्यावहारिक और भौतिक सुकून चाहने वाले (Earth)",
      3: "बौद्धिक, चंचल और संवाद-प्रधान (Air)",
      4: "बेहद संवेदनशील, भावुक और सुरक्षात्मक (Water)",
      5: "राजसी, आत्मविश्वासी और नेतृत्व करने वाले (Fire)",
      6: "विश्लेषणात्मक, तार्किक और परफेक्शनिस्ट (Earth)",
      7: "कलावादी, संतुलित और सामंजस्य (Harmony) चाहने वाले (Air)",
      8: "रहस्यमयी, तीव्र (Intense) और परिवर्तनकारी (Water)",
      9: "दार्शनिक, स्वतंत्र और आदर्शवादी (Fire)",
      10: "अत्यंत कर्मठ, अनुशासित और लक्ष्य-केंद्रित (Earth)",
      11: "प्रगतिशील, विद्रोही और बौद्धिक (Air)",
      12: "आध्यात्मिक, स्वप्निल और गहरी करुणा से भरे (Water)"
    };

    const getDignity = (planet: string, sign: number): { state: string, strength: number } => {
      const dignities: any = {
        'Sun': { exalt: 1, deb: 7, own: [5] },
        'Moon': { exalt: 2, deb: 8, own: [4] },
        'Mars': { exalt: 10, deb: 4, own: [1, 8] },
        'Mercury': { exalt: 6, deb: 12, own: [3, 6] },
        'Jupiter': { exalt: 4, deb: 10, own: [9, 12] },
        'Venus': { exalt: 12, deb: 6, own: [2, 7] },
        'Saturn': { exalt: 7, deb: 1, own: [10, 11] },
        'Rahu': { exalt: 3, deb: 9, own: [] },
        'Ketu': { exalt: 9, deb: 3, own: [] },
      };
      const d = dignities[planet];
      if (!d) return { state: "सामान्य", strength: 1 };
      
      if (sign === d.exalt) return { state: "उच्च (Exalted)", strength: 3 };
      if (sign === d.deb) return { state: "नीच (Debilitated)", strength: -1 };
      if (d.own.includes(sign)) return { state: "स्वराशि (Own Sign)", strength: 2 };
      return { state: "सामान्य", strength: 1 };
    };

    Object.keys(data.planets).forEach(pName => {
      if (pName === 'Ascendant' || !planetMeanings[pName]) return;
      
      const p = data.planets[pName];
      const signName = hindiSigns[p.sign];
      const houseMeaning = houseMeanings[p.house];
      const signNature = signNatures[p.sign];
      const primaryKaraka = planetMeanings[pName].split(',')[0];
      const d1Dig = getDignity(pName, p.sign);
      
      report += `- **${hindiPlanetNames[pName]} (${planetMeanings[pName]}):** यह आपकी D1 कुण्डली के ${p.house}वें भाव ("${houseMeaning.split(' और ')[0]}") में **${signName} राशि (${d1Dig.state})** में स्थित है। चूँकि ${signName} का स्वभाव ${signNature} है, आपके "${houseMeaning.split(',')[0]}" के मामलों में आपकी ${primaryKaraka} बिल्कुल **${signNature}** तरीके से अभिव्यक्त होगी।\n`;

      const d9P = data.d9Planets ? data.d9Planets[pName] : null;
      if (d9P) {
        const d9Dig = getDignity(pName, d9P.sign);
        const d9SignName = hindiSigns[d9P.sign];

        let d9Result = "";
        if (p.sign === d9P.sign) {
           d9Result = `✨ **वर्गोत्तम (Vargottama):** यह ग्रह जन्म कुण्डली (D1) और नवमांश (D9) दोनों में **${signName} राशि** में ही है! यह 'वर्गोत्तम' स्थिति ग्रह को 100% परिणाम देने में सक्षम बनाती है, यह एक असाधारण आशीर्वाद है।`;
        } else if (d1Dig.strength >= 2 && d9Dig.strength === -1) {
           d9Result = `⚠️ **नवमांश पतन (D9 Downfall):** जन्म कुण्डली में यह **${d1Dig.state}** है, लेकिन नवमांश (D9) में यह **${d9P.house}वें भाव** में **${d9SignName} राशि** में जाकर **${d9Dig.state}** का हो गया है। बाहरी तौर पर स्थितियाँ मजबूत दिखेंगी, लेकिन भीतर से (या विवाह/उम्र बढ़ने के बाद) इसका परिणाम नकारात्मक या संघर्षपूर्ण हो सकता है।`;
        } else if (d1Dig.strength <= 1 && d9Dig.strength >= 2) {
           d9Result = `🌱 **नवमांश उत्थान (D9 Uplift):** जन्म कुण्डली में यह सामान्य या संघर्षरत है, लेकिन नवमांश (D9) के **${d9P.house}वें भाव** में **${d9SignName} राशि** में जाकर यह **${d9Dig.state}** का बन गया है! इसका अर्थ है कि शुरुआत में संघर्ष के बावजूद (विशेषकर 30 वर्ष की आयु या विवाह के बाद), यह ग्रह आपको अप्रत्याशित और जबरदस्त सफलता देगा।`;
        } else if (d1Dig.strength === -1 && d9Dig.strength === -1) {
           d9Result = `⚠️ **अत्यधिक कमज़ोर:** यह ग्रह दोनों कुण्डलियों में **${d1Dig.state}** है। इस क्षेत्र में जीवनभर विशेष सावधानी की आवश्यकता है।`;
        } else if (d1Dig.strength >= 2 && d9Dig.strength >= 2) {
           d9Result = `🌟 **अत्यधिक बलवान:** जन्म और नवमांश दोनों में यह अपनी उत्तम स्थिति (${d1Dig.state}/${d9Dig.state}) में है। यह ग्रह आपके जीवन का एक बहुत बड़ा मजबूत स्तंभ है!`;
        } else {
           d9Result = `*नवमांश बल:* D9 कुण्डली में यह **${d9P.house}वें भाव** में **${d9SignName} राशि (${d9Dig.state})** में जाकर इसके फलों को सूक्ष्मता से सहारा दे रहा है।`;
        }
        report += `  > ${d9Result}\n\n`;
      } else {
        report += `\n`;
      }
    });
    
    report += `\n`;

    // House Lords Analysis
    if (data.houseLords) {
      report += `### 🏛️ भाव स्वामी (House Lords) एवं युति विश्लेषण\n`;
      
      const naturalFriends: Record<string, { friends: string[], enemies: string[] }> = {
        'Sun': { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
        'Moon': { friends: ['Sun', 'Mercury'], enemies: [] },
        'Mars': { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
        'Mercury': { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
        'Jupiter': { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
        'Venus': { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
        'Saturn': { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
        'Rahu': { friends: ['Mercury', 'Venus', 'Saturn'], enemies: ['Sun', 'Moon', 'Mars'] },
        'Ketu': { friends: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] }
      };

      const signRulers: Record<number, string> = {
        1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
        7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
      };

      const importantHouses = [1, 2, 4, 5, 7, 9, 10, 11];
      importantHouses.forEach(h => {
        const lordInfo = data.houseLords![h];
        const planet = lordInfo.planet;
        const planetData = data.planets[planet];
        if (planetData) {
          const houseMeaning = houseMeanings[h].split(',')[0];
          const sittingHouse = planetData.house;
          const sittingHouseMeaning = houseMeanings[sittingHouse].split(',')[0];
          const signLord = signRulers[planetData.sign];
          
          let relation = "तटस्थ (Neutral)";
          if (planet === signLord) relation = "स्वराशि (Self)";
          else if (naturalFriends[planet]?.friends.includes(signLord)) relation = "मित्र राशि (Friend)";
          else if (naturalFriends[planet]?.enemies.includes(signLord)) relation = "शत्रु राशि (Enemy)";

          report += `- **${h}वें भाव (${houseMeaning}) का अधिपति (${hindiPlanetNames[planet]}):** यह आपके **${sittingHouse}वें भाव** (${sittingHouseMeaning}) में **${relation}** में बैठा है। `;
          
          // Dynamical result interpretation
          if (h === sittingHouse) {
            report += `चूँकि यह अपने ही घर में है, यह आपको उस भाव से संबंधित क्षेत्रों में **असाधारण स्थिरता और सफलता** प्रदान करेगा। यह एक अत्यंत शुभ स्थिति है। `;
          } else if ([6, 8, 12].includes(sittingHouse)) {
            report += `यह त्रिक भाव में स्थित होने के कारण, **'${houseMeaning}'** के क्षेत्रों में कुछ संघर्ष या व्यय (Losses) दे सकता है, लेकिन यह आपको आध्यात्मिक रूप से मज़बूत बनाएगा। `;
          } else if ([1, 4, 7, 10].includes(sittingHouse)) {
            report += `केंद्र भाव में बैठने के कारण यह आपको **शक्तिशाली कर्म और समाजिक प्रतिष्ठा** दिलाने में सहायक होगा। `;
          } else if ([5, 9].includes(sittingHouse)) {
            report += `त्रिकोण भाव (लक्ष्मी स्थान) में बैठने के कारण यह **विशाल भाग्य और धन लाभ** का योग बना रहा है। यह आपके जीवन का सबसे सकारात्मक बिंदु हो सकता है। `;
          }

          if (relation === "शत्रु राशि (Enemy)") {
            report += `हालांकि, शत्रु राशि में होने के कारण ये परिणाम थोड़े विलंब (Delay) से या कड़ी मेहनत के बाद प्राप्त होंगे। निराश न हों, आपका संघर्ष ही आपकी जीत का आधार बनेगा। `;
          } else if (relation === "मित्र राशि (Friend)") {
            report += `मित्र राशि में होने के कारण, स्थितियाँ आपके अनुकूल रहेंगी और आपको कम मेहनत में बेहतर परिणाम मिलेंगे। `;
          }
          report += `\n`;
        }
      });
      report += `\n`;
    }

    // Dasha Analysis
    if (data.dasha) {
      report += `### ⏳ वर्तमान विंशोत्तरी महादशा प्रभाव\n`;
      const dashaLord = data.dasha.currentLord;
      const dashaPlanet = data.planets[dashaLord];
      report += `वर्तमान में आप **${dashaLord}** ग्रह की महादशा से गुजर रहे हैं। `;
      
      if (dashaPlanet) {
          report += `जन्म कुण्डली में ${dashaLord} ${dashaPlanet.house}वें भाव (${houseMeanings[dashaPlanet.house]}) में स्थित है। `;
          report += `इसका स्पष्ट अर्थ है कि यह पूरी दशा अवधि मुख्य रूप से आपके "${houseMeanings[dashaPlanet.house]}" से जुड़े परिणामों को सक्रिय करेगी। `;
      }

      if (['Saturn', 'Rahu', 'Ketu'].includes(dashaLord)) {
        report += `प्राकृतिक रूप से, यह समय गहरा आत्म-मंथन और बड़े परिवर्तन (Transformation) लाने वाला है। यह अवधि आपको भीतर से मजबूत बनाने के लिए आई है। हालांकि कुछ चुनौतियाँ आ सकती हैं, लेकिन यही वह समय है जब आपकी असली अद्भुत क्षमता उभर कर सामने आएगी। अपना धैर्य और निरंतरता बनाए रखें, ब्रह्मांड आपको एक बहुत बड़े और बेहतर भविष्य के लिए तैयार कर रहा है।\n\n`;
      } else if (['Jupiter', 'Venus'].includes(dashaLord)) {
        report += `यह समय अत्यंत भाग्यवर्धक, विस्तार और सुख-समृद्धि का है। यह आपके जीवन में नई वृद्धि और शुभ अवसर लेकर आएगा।\n\n`;
      } else {
        report += `यह समय आपके जीवन में ऊर्जा, क्रियान्वयन, अनुशासन और नई स्थिरता के निर्माण का है।\n\n`;
      }
    }

    // Gochar (Transit) Sade Sati check
    const moon = data.planets['Moon'];
    if (data.transits && moon) {
      report += `### 🔄 वर्तमान गोचर (Transits) प्रभाव\n`;
      const transitSaturn = data.transits['Saturn'];
      const moonSign = moon.sign;
      
      const posMod = (n: number, m: number = 12) => ((n % m) + m) % m;
      const dist = posMod(transitSaturn.sign - moonSign);

      report += `इस समय आकाश में शनि **${hindiSigns[transitSaturn.sign]}** राशि में गोचर कर रहा है। `
      if (dist === 11 || dist === 0 || dist === 1) { 
        report += `🌱 **शनि की साढ़ेसाती (परिवर्तन और परिपक्वता का चरण):** गोचर का शनि आपके जन्म के चंद्रमा (राशि: ${hindiSigns[moonSign]}) के अत्यंत निकट है। यह प्रभाव साढ़ेसाती कहलाता है। यह गोचर आपके जीवन में अनुशासन और गहरी मनोवैज्ञानिक परिपक्वता लाने का एक पवित्र अवसर है। यद्यपि यह समय कभी-कभी मानसिक रूप से थका देने वाला लग सकता है, लेकिन याद रखें कि शनि एक न्यायप्रिय शिक्षक हैं जो 'सोने को तपाकर कुंदन बनाते हैं'। स्वयं पर विश्वास रखें, सकारात्मक रहें और आध्यात्मिक शांति के लिए ध्यान का सहारा लें। आप इस दौर से बहुत मजबूत होकर निकलेंगे।\n\n`;
      } else if (dist === 7) {
        report += `🌱 **अष्टम ढैय्या (आंतरिक शक्ति का जागरण):** शनि वर्तमान में आपके जन्म के चंद्रमा से 8वें भाव में गोचर कर रहा है। यह गोचर जीवन में छिपी हुई शक्तियों को जगाने और अप्रत्याशित रास्तों से आपको नई दिशा दिखाने के लिए है। स्वास्थ्य और दैनिक कार्यों में थोड़ा उतार-चढ़ाव आ सकता है, लेकिन घबराएं नहीं—यह समय आपको अंदर से और अधिक लचीला (resilient) बना रहा है। अपना पूरा ख्याल रखें और शांत मन से हर स्थिति का सामना करें, आप ईश्वरीय सुरक्षा में हैं।\n\n`;
      } else if (dist === 3 || dist === 5 || dist === 10) {
        report += `✨ **शुभ शनि गोचर:** शनि का यह गोचर आपके लिए अत्यंत अनुकूल है, जो कार्यक्षेत्र और धन लाभ में शानदार वृद्धि के संकेत दे रहा है।\n\n`;
      } else {
        report += `शनि का गोचर आपके लिए सामान्य अवस्था में है।\n\n`;
      }

      const transitJupiter = data.transits['Jupiter'];
      report += `बृहस्पति (गुरु) इस समय **${hindiSigns[transitJupiter.sign]}** राशि में है। `;
      const jupDist = posMod(transitJupiter.sign - moonSign);
      
      if (transitJupiter.sign === moon.sign) {
        report += `✨ **गुरु का गोचर:** गुरु आपके चंद्रमा के ऊपर से गोचर कर रहा है, जो आंतरिक विकास, नई विचारधारा और ज्ञान के अद्भुत अवसर ला रहा है।\n\n`;
      } else if (jupDist === 4 || jupDist === 6 || jupDist === 8 || jupDist === 10) {
        report += `🌟 **गुरु-गोचर:** यह गोचर आपको बहुत ही शानदार भाग्य, विवाह (यदि लागू हो), संतान सुख और सामाजिक मान-सम्मान का आशीर्वाद दे रहा है।\n\n`;
      } else {
        report += `यह गोचर आपके ज्ञान और विवेक को स्थिर रूप से बढ़ा रहा है।\n\n`;
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
                const rahuSign = hindiSigns[rahu.sign] || "";
                const ketuSign = hindiSigns[ketu.sign] || "";
                report += `🌀 **राहु-केतु कर्म अक्ष (${rahu.house}/${ketu.house} भाव)**: कुण्डली में राहु ${rahu.house}वें भाव (${rahuSign} राशि) में विराजमान है, जो इस क्षेत्र में अत्यंत गहरी महत्वाकांक्षा, भौतिक विस्तार और अप्रत्याशित जुनून पैदा करता है। इसके ठीक 180° विपरीत केतु ${ketu.house}वें भाव (${ketuSign} राशि) में है, जो पूर्व जन्मों की पूर्णता, कर्म त्याग (वैराग्य) और रहस्यमय अंतर्ज्ञान (Mystic intuition) को दर्शाता है। यह "${rahu.house}-${ketu.house}" भावों का ध्रुवीकरण आपके जीवन के एक बेहद खूबसूरत आध्यात्मिक सफर (Spiritual Evolution) को गहराई से परिभाषित करता है। यह एक द्वंद्व से अधिक जीवन को एक व्यापक दृष्टिकोण से अनुभव करने का और खुद को खोजने का महान अवसर है।\n\n`;
            }
            break;
          }
          case 'Mutual Aspect between Venus and Mars': {
            const venus = data.planets['Venus'];
            const mars = data.planets['Mars'];
            if (venus && mars) {
                const venusSign = hindiSigns[venus.sign] || "";
                const marsSign = hindiSigns[mars.sign] || "";
                const dist = (mars.sign - venus.sign + 12) % 12 + 1;
                
                let aspectName = "";
                if (dist === 1) aspectName = "युति (एक साथ)";
                else if (dist === 7) aspectName = "समसप्तक दृष्टि (आमने-सामने)";
                else if (dist === 5 || dist === 9) aspectName = "त्रिकोण दृष्टि (शुभ)";
                else if (dist === 4 || dist === 10) aspectName = "केंद्र दृष्टि (संघर्ष और ऊर्जा)";
                else if (dist === 3 || dist === 11) aspectName = "लाभ/पराक्रम दृष्टि (सहयोगी)";
                else aspectName = "विशेष संबंध";

                report += `❤️ **शुक्र-मंगल ${aspectName}**: आपकी कुण्डली में शुक्र ${venus.house}वें भाव (${venusSign}) में और मंगल ${mars.house}वें भाव (${marsSign}) में विराजमान हैं। इन दोनों के बीच यह शक्तिशाली **${aspectName}** आपके प्रेम, आकर्षण और भौतिक सुखों में असीम ऊर्जा भर देता है। चूँकि शुक्र आपकी कोमल भावनाओं का and मंगल आपके जुनून (passion) का प्रतिनिधित्व करता है, यह विशेष "शुक्र-मंगल संबंध" आपके रोमांटिक और वैवाहिक जीवन में अत्यधिक तीव्रता (intensity) लाता है।\n\n`;
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
