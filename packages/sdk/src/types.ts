export interface CalculationParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat: number;
  lng: number;
  timezone?: number;
  ayanamsa?: 'LAHIRI' | 'RAMAN' | 'KP';
  gender?: string;
  birthLocation?: string;
  report_type?: string;
}

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
    };
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
    [key: number]: {
      planet: string;
      sign: number;
    };
  };
  d9HouseLords?: {
    [key: number]: {
      planet: string;
      sign: number;
    };
  };
}

export interface RuleAST {
  operator: string;
  params?: any;
  operands?: RuleAST[];
}

export interface AnalysisResult {
  math: AstroChartData;
  activeRules: any[];
  aiReport?: string;
  heuristicAnswer?: string;
}

export interface SDKConfig {
  apiKey?: string;
  endpoint?: string;
}

export interface MuhurtaRequest {
  rangeHours?: number;
  stepMinutes?: number;
  top?: number;
  preferNakshatras?: number[];
  avoidTithis?: number[];
}

export interface MuhurtaResult {
  startISO: string;
  score: number;
  tithi: number;
  nakshatra: number;
  nakshatraName: string;
  reasons: string[];
}
