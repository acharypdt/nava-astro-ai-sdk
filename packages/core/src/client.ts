import {
  AnalysisResult, CalculationParams, MuhurtaRequest, MuhurtaResult,
  AstroChartData, ApiResponse
} from './types';
import { AuthenticationError, ApiError } from './errors';

export class NavaAstroClient {
  private apiKey: string;
  private endpoint: string;

  constructor(config: { apiKey: string; endpoint?: string }) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.nava-astro.com/api/v1';
  }

  private async request<T>(path: string, body?: any, method: string = 'POST'): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const res = await fetch(`${this.endpoint}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      const errBody: any = await res.json().catch(() => ({ error: res.statusText }));
      if (res.status === 401) throw new AuthenticationError(errBody.error || 'Invalid API key');
      throw new ApiError(errBody.error || `API request failed: ${res.status}`, res.status);
    }

    const json: ApiResponse<T> = await res.json() as ApiResponse<T>;
    if (!json.success) throw new ApiError(json.error || 'API request failed', 500);
    return json.data as T;
  }

  async analyze(params: CalculationParams & { report_type?: string }): Promise<AnalysisResult> {
    return this.request<AnalysisResult>('/kundali/calculate', { birth_data: params });
  }

  async askAI(question: string, mathData: AstroChartData): Promise<string> {
    const result = await this.request<{ answer: string }>('/ai/ask', { question, math_data: mathData });
    return result.answer;
  }

  async findMuhurtas(params: CalculationParams, options?: MuhurtaRequest): Promise<MuhurtaResult[]> {
    return this.request<MuhurtaResult[]>('/muhurta', { birth_data: params, options });
  }

  async calculateShadbala(params: CalculationParams): Promise<any> {
    return this.request('/shadbala', { birth_data: params });
  }

  async calculateAshtakavarga(params: CalculationParams): Promise<any> {
    return this.request('/ashtakavarga', { birth_data: params });
  }

  async calculateDivisionalCharts(params: CalculationParams): Promise<any> {
    return this.request('/divisional', { birth_data: params });
  }

  async calculateSadeSati(params: CalculationParams): Promise<any> {
    return this.request('/sadesati', { birth_data: params });
  }

  async calculateVarshaphal(params: CalculationParams, targetYear?: number): Promise<any> {
    return this.request('/varshaphal', { birth_data: params, target_year: targetYear });
  }

  async register(email: string, password: string, name?: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${this.endpoint}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const json: any = await res.json();
    if (!res.ok) throw new ApiError(json.error || 'Registration failed', res.status);
    return json.data;
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${this.endpoint}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json: any = await res.json();
    if (!res.ok) throw new ApiError(json.error || 'Login failed', res.status);
    return json.data;
  }

  async createApiKey(name?: string): Promise<{ key: string; id: string }> {
    return this.request<{ key: string; id: string }>('/auth/api-keys', { name });
  }

  async listApiKeys(): Promise<any[]> {
    return this.request<any[]>('/auth/api-keys', undefined, 'GET');
  }

  async getProfile(): Promise<any> {
    return this.request<any>('/user/profile', undefined, 'GET');
  }

  async updateProfile(updates: Record<string, any>): Promise<any> {
    return this.request<any>('/user/profile', updates, 'PATCH');
  }

  async getUsage(): Promise<any> {
    return this.request<any>('/user/usage', undefined, 'GET');
  }

  async getHistory(): Promise<any[]> {
    return this.request<any[]>('/user/history', undefined, 'GET');
  }

  async listKundalis(): Promise<any[]> {
    return this.request<any[]>('/kundali', undefined, 'GET');
  }

  async getKundali(id: string): Promise<any> {
    return this.request<any>(`/kundali/${id}`, undefined, 'GET');
  }

  async createSubscriptionOrder(plan: string): Promise<{ orderId: string; amount: number }> {
    return this.request<{ orderId: string; amount: number }>('/billing/order', { plan });
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string, plan: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/billing/verify', { orderId, paymentId, signature, plan });
  }

  async getSubscription(): Promise<any> {
    return this.request<any>('/billing/subscription', undefined, 'GET');
  }

  async cancelSubscription(): Promise<any> {
    return this.request<any>('/billing/cancel');
  }
}
