// ============================================
// MeteoEspaña — Models
// ============================================

export interface ComunidadAutonoma {
  id: string;       // INE code (01-19)
  code: string;     // AEMET code
  name: string;
  municipios: Municipio[];
}

export interface Municipio {
  id: string;       // INE code (5-digit)
  name: string;
  lat: number;
  lon: number;
}

export interface WeatherDay {
  fecha: string;         // ISO date
  descripcion: string;
  icono: WeatherIcon;
  tempMax: number;
  tempMin: number;
  precipProb: number;    // 0-100
  precipAcum: number;    // mm
  humidity: number;      // 0-100
  windSpeed: number;     // km/h
  windDir: string;
  uvIndex: number;
  sensTermica: number;
}

export interface WeatherTimeSlot {
  periodo: string;   // '00-06', '06-12', '12-18', '18-24'
  temp: number;
  icono: WeatherIcon;
  precipProb: number;
  viento: number;
}

export interface DayDetail extends WeatherDay {
  slots: WeatherTimeSlot[];
}

export type WeatherIcon =
  | 'sol'
  | 'sol_nubes'
  | 'nubes'
  | 'lluvia'
  | 'lluvia_sol'
  | 'tormenta'
  | 'nieve'
  | 'niebla'
  | 'viento'
  | 'granizo';

export interface AemetPrediction {
  municipio: string;
  provincia: string;
  ccaa: string;
  days: DayDetail[];
}

// AEMET API raw response types
export interface AemetApiResponse {
  descripcion: string;
  estado: number;
  datos: string;
  metadatos: string;
}

export interface AemetPredDia {
  fecha: string;
  estadoCielo: AemetPeriodo[];
  precipitacion: AemetPeriodo[];
  probPrecipitacion: AemetPeriodo[];
  vientoAndRachaMax: AemetViento[];
  temperatura: { maxima: number; minima: number };
  sensTermica: { maxima: number; minima: number };
  humedadRelativa: { maxima: number; minima: number };
  uvMax: number;
}

export interface AemetPeriodo {
  value: string;
  periodo?: string;
  descripcion?: string;
}

export interface AemetViento {
  direccion: string[];
  velocidad: string[];
  periodo?: string;
}
