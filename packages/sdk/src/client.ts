import { AnalysisResult, CalculationParams, MuhurtaRequest, MuhurtaResult, AstroChartData } from './types';

export class NavaAstroClient {
  private apiKey: string;
  private endpoint: string;

  constructor(config: { apiKey: string; endpoint?: string }) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.nava-astro.com/api/v1';
  }

  private async request(path: string, body: any): Promise<any> {
    const res = await fetch(`${this.endpoint}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errBody: any = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errBody.error || `API request failed: ${res.status}`);
    }

    return res.json();
  }

  async analyze(params: CalculationParams & { report_type?: string }): Promise<AnalysisResult> {
    const result = await this.request('/kundali/calculate', { birth_data: params });
    return result.data;
  }

  async askAI(question: string, mathData: AstroChartData): Promise<string> {
    const result = await this.request('/ai/ask', { question, math_data: mathData });
    return result.data.answer;
  }

  async findMuhurtas(params: CalculationParams, options?: MuhurtaRequest): Promise<MuhurtaResult[]> {
    const result = await this.request('/muhurta', { birth_data: params, options });
    return result.results;
  }

  async getProfile(): Promise<any> {
    const res = await fetch(`${this.endpoint}/user/profile`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return res.json();
  }

  async getUsage(): Promise<any> {
    const res = await fetch(`${this.endpoint}/user/usage`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return res.json();
  }
}
