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

export interface PlanetData {
  name: string;
  longitude: number;
  sign: number;
  house: number;
  is_retrograde: boolean;
}

export interface TransitData {
  name: string;
  sign: number;
}

export interface DashaInfo {
  currentLord: string;
  balanceFraction: number;
}

export interface HouseData {
  cusp: number;
  sign: number;
}

export interface LordInfo {
  planet: string;
  sign: number;
}

export interface AstroChartData {
  planets: Record<string, PlanetData>;
  d9Planets?: Record<string, PlanetData>;
  transits?: Record<string, TransitData>;
  dasha?: DashaInfo;
  houses: Record<number, HouseData>;
  houseLords?: Record<number, LordInfo>;
  d9HouseLords?: Record<number, LordInfo>;
}

export interface RuleAST {
  operator: string;
  params?: any;
  operands?: RuleAST[];
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

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

export interface SadeSatiPhase {
  phase: string;
  name: string;
  startDate: string;
  endDate: string;
  houseFromMoon: number;
  intensity: number;
  description: string;
}

export interface SadeSatiResult {
  isActive: boolean;
  moonSign: number;
  moonSignName: string;
  saturnSign: number;
  saturnSignName: string;
  phases: SadeSatiPhase[];
  currentPhase: SadeSatiPhase | null;
  predictions: string[];
}

export interface DivisionalChartPlanet {
  name: string;
  sign: number;
  house: number;
  longitude: number;
}

export interface DivisionalChart {
  chart: string;
  planets: Record<string, DivisionalChartPlanet>;
  lagnaSign: number;
}

export interface MonthlyPrediction {
  month: number;
  prediction: string;
}

export interface VarshaphalResult {
  year: number;
  age: number;
  solarReturnDate: string;
  muntha: number;
  munthaSign: number;
  predictions: string[];
  monthlyPredictions: MonthlyPrediction[];
}

export interface ShadbalaPlanet {
  sthanaBala: number;
  digBala: number;
  kalaBala: number;
  chestaBala: number;
  naisargikaBala: number;
  ayanaBala: number;
  totalBala: number;
  isStrong: boolean;
}

export interface PlanetStrength {
  planet: string;
  total: number;
  rank: number;
}

export interface ShadbalaResult {
  planetary: Record<string, ShadbalaPlanet>;
  strengths: PlanetStrength[];
}

export interface SignStrength {
  sign: number;
  name: string;
  bindus: number;
  interpretation: string;
}

export interface AshtakavargaResult {
  binnashtakavarga: Record<string, number[]>;
  sarvashtakavarga: number[];
  signStrengths: SignStrength[];
}

export interface YogaResult {
  name: string;
  category: string;
}

export interface AnalysisResult {
  math: AstroChartData;
  activeRules: YogaResult[];
  aiReport?: string;
  heuristicAnswer?: string;
}

export interface SDKConfig {
  apiKey?: string;
  endpoint?: string;
}
