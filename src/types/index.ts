export interface SadeSatiPhase {
  phase: 'first_dhaiya' | 'middle_dhaiya' | 'last_dhaiya';
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  intensity: number;
  houseFromMoon: number;
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

export interface DivisionalChartResult {
  chart: string;
  planets: Record<string, DivisionalChartPlanet>;
  lagnaSign: number;
  lagnaLongitude: number;
}

export interface AshtakavargaResult {
  binnashtakavarga: Record<string, number[]>;
  sarvashtakavarga: number[];
  totalBindu: number;
  signStrengths: { sign: number; bindus: number; interpretation: string }[];
}

export interface ShadbalaResult {
  planetary: Record<string, {
    sthanaBala: number;
    digBala: number;
    kalaBala: number;
    chestaBala: number;
    naisargikaBala: number;
    ayanaBala: number;
    totalBala: number;
    isStrong: boolean;
  }>;
  strengths: { planet: string; total: number; rank: number }[];
}

export interface VarshaphalResult {
  year: number;
  age: number;
  solarReturnDate: string;
  muntha: number;
  munthaSign: number;
  predictions: string[];
  monthlyPredictions: { month: number; prediction: string }[];
}
