import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import {
  AemetApiResponse, AemetPredDia, DayDetail,
  WeatherIcon, WeatherTimeSlot, AemetPrediction,
} from '../models/weather.models';

const AEMET_API_KEY =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqc2Vyc2FuQGdtYWlsLmNvbSIsImp0aSI6IjQ2ZWY2MTQxLWU1NzgtNDRlNi04YzA0LTQ2OGYyYWRhZDY3MCIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzc1MTYxNzU5LCJ1c2VySWQiOiI0NmVmNjE0MS1lNTc4LTQ0ZTYtOGMwNC00NjhmMmFkYWQ2NzAiLCJyb2xlIjoiIn0.24IqFvXfvltv67QYSY2NBs2EXUm-ApId7D5HlO_UACw';

/**
 * PROXY SETUP (proxy.conf.json):
 *   /api/aemet  →  https://opendata.aemet.es  (strips /api/aemet prefix)
 *
 * AEMET flow:
 *  Step 1: GET /api/aemet/opendata/api/prediccion/especifica/municipio/diaria/{id}
 *          Returns: { estado:200, datos:"https://opendata.aemet.es/opendata/sh/RANDOM_HASH" }
 *  Step 2: GET /api/aemet/opendata/sh/RANDOM_HASH   (same proxy, different path)
 *          Returns: the actual prediction JSON array
 */
const PROXY = '/api/aemet';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'api_key': AEMET_API_KEY });
  }

  getPrediction(municipioId: string): Observable<AemetPrediction> {
    // Step 1 — get the redirect URL
    const step1 = `${PROXY}/opendata/api/prediccion/especifica/municipio/diaria/${municipioId}`;

    return this.http.get<AemetApiResponse>(step1, { headers: this.headers }).pipe(
      switchMap(res => {
        if (res.estado !== 200) {
          throw new Error(`AEMET estado ${res.estado}: ${res.descripcion}`);
        }
        // res.datos = "https://opendata.aemet.es/opendata/sh/XXXX"
        // Strip the host → "/opendata/sh/XXXX" → prefix with our proxy → "/api/aemet/opendata/sh/XXXX"
        const dataPath = res.datos.replace('https://opendata.aemet.es', '');
        const step2    = `${PROXY}${dataPath}`;
        // Step 2 — fetch actual data (no api_key header needed for the sh/* endpoint)
        return this.http.get<any[]>(step2);
      }),
      map(data => this.parseResponse(data)),
      catchError(err => {
        console.warn(`[AEMET] fallback mock para ${municipioId}:`, err?.message ?? err);
        return of(this.getMockPrediction(municipioId));
      })
    );
  }

  // ── Parse AEMET response ──────────────────────────────────────────────────
  private parseResponse(raw: any[]): AemetPrediction {
    const pred = raw[0];
    return {
      municipio: pred.nombre    ?? '',
      provincia: pred.provincia ?? '',
      ccaa:      pred.origen?.notaLegal ?? '',
      days: (pred.prediccion?.dia ?? []).map((d: AemetPredDia) => this.parseDia(d)),
    };
  }

  private parseDia(dia: AemetPredDia): DayDetail {
    const rawFecha = (dia.fecha as unknown as string) ?? '';
    const fecha    = rawFecha.substring(0, 10);

    const maxPrecipProb = (dia.probPrecipitacion ?? []).reduce(
      (mx, p) => Math.max(mx, parseInt(p.value) || 0), 0
    );

    // Best representative icon: prefer daytime slot 12-24, else last available
    const cielo = dia.estadoCielo?.find(e => e.periodo === '1224')
               ?? dia.estadoCielo?.find(e => e.periodo === '1218')
               ?? dia.estadoCielo?.[dia.estadoCielo.length - 1];
    const icono = this.cieloToIcon(cielo?.value ?? '11');

    // ── 4 time slots ─────────────────────────────────────────────────────
    const slotDefs: [string, string][] = [
      ['0006', '00-06'],
      ['0612', '06-12'],
      ['1218', '12-18'],
      ['1824', '18-24'],
    ];

    const slots: WeatherTimeSlot[] = slotDefs.map(([key, label]) => {
      const cS = dia.estadoCielo?.find(e => e.periodo === key);
      const pS = dia.probPrecipitacion?.find(e => e.periodo === key);
      const vS = (dia.vientoAndRachaMax as any[])?.find((e: any) => e.periodo === key);

      const slotIcon = cS?.value
        ? this.cieloToIcon(cS.value)
        : icono; // fallback to day icon — keeps consistency

      const isDay = key === '0612' || key === '1218' || key === '1824';
      const temp  = isDay
        ? (dia.temperatura?.maxima ?? 18)
        : (dia.temperatura?.minima ?? 8);

      return {
        periodo:    label,
        temp,
        icono:      slotIcon,
        precipProb: parseInt(pS?.value ?? '0') || 0,
        viento:     Math.round((parseInt(vS?.velocidad?.[0] ?? '0') * 3.6) || 0),
      };
    });

    return {
      fecha,
      descripcion: cielo?.descripcion ?? 'Despejado',
      icono,
      tempMax:     dia.temperatura?.maxima  ?? 20,
      tempMin:     dia.temperatura?.minima  ?? 8,
      precipProb:  maxPrecipProb,
      precipAcum:  parseFloat(
        (dia.precipitacion as any)?.find?.((p: any) => p.periodo === '1224')?.value ?? '0'
      ) || 0,
      humidity:    dia.humedadRelativa?.maxima ?? 60,
      windSpeed:   Math.round(
        (parseInt((dia.vientoAndRachaMax as any[])?.[0]?.velocidad?.[0] ?? '0') * 3.6) || 15
      ),
      windDir:     (dia.vientoAndRachaMax as any[])?.[0]?.direccion?.[0] ?? 'SE',
      uvIndex:     dia.uvMax ?? 3,
      sensTermica: dia.sensTermica?.maxima ?? 16,
      slots,
    };
  }

  private cieloToIcon(code: string): WeatherIcon {
    const n = parseInt(code);
    if (n === 11 || n === 12)  return 'sol';
    if (n >= 13 && n <= 15)   return 'sol_nubes';
    if (n === 16 || n === 17) return 'nubes';
    if (n >= 23 && n <= 26)   return 'lluvia_sol';
    if (n >= 33 && n <= 36)   return 'nubes';
    if (n >= 43 && n <= 46)   return 'lluvia';
    if (n >= 51 && n <= 56)   return 'lluvia';
    if (n >= 61 && n <= 64)   return 'nieve';
    if (n >= 71 && n <= 74)   return 'tormenta';
    if (n === 81 || n === 82) return 'tormenta';
    if (n === 83 || n === 84) return 'nieve';
    return 'nubes';
  }

  // ── Mock fallback ─────────────────────────────────────────────────────────
  getMockPrediction(municipioId: string): AemetPrediction {
    const base = new Date();
    const tmpl = MOCK_TEMPLATES[municipioId] ?? MOCK_TEMPLATES['default'];
    return {
      municipio: municipioId,
      provincia: '',
      ccaa: '',
      days: tmpl.map((d, i) => {
        const dt = new Date(base);
        dt.setDate(base.getDate() + i);
        return { ...d, fecha: dt.toISOString().substring(0, 10) };
      }),
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function nightIcon(ic: WeatherIcon): WeatherIcon {
  if (ic === 'sol') return 'nubes';
  if (ic === 'sol_nubes') return 'nubes';
  return ic;
}

function makeSlots(mn: number, mx: number, ic: WeatherIcon, r: number): WeatherTimeSlot[] {
  return [
    { periodo: '00-06', temp: mn,                       icono: nightIcon(ic), precipProb: Math.round(r * 0.7), viento: 10 },
    { periodo: '06-12', temp: Math.round((mn+mx)*0.45), icono: ic,            precipProb: Math.round(r * 0.5), viento: 14 },
    { periodo: '12-18', temp: mx,                       icono: ic,            precipProb: Math.round(r * 0.3), viento: 18 },
    { periodo: '18-24', temp: Math.round((mn+mx)*0.6),  icono: nightIcon(ic), precipProb: Math.round(r * 0.6), viento: 12 },
  ];
}

function d(
  desc: string, ic: WeatherIcon, mx: number, mn: number,
  r: number, hum: number, wind: number, uv: number
): DayDetail {
  return {
    fecha: '', descripcion: desc, icono: ic,
    tempMax: mx, tempMin: mn, precipProb: r,
    precipAcum: r > 50 ? Math.round(r * 0.12) : 0,
    humidity: hum, windSpeed: wind, windDir: 'NE',
    uvIndex: uv, sensTermica: mx - 2,
    slots: makeSlots(mn, mx, ic, r),
  };
}

const MOCK_TEMPLATES: Record<string, DayDetail[]> = {
  '28079': [d('Parcialmente nublado','sol_nubes',14,4,5,52,15,4),d('Soleado','sol',16,5,0,45,13,5),d('Soleado','sol',18,6,0,42,11,6),d('Soleado','sol',20,7,0,40,10,6),d('Parcialmente nublado','sol_nubes',17,5,15,55,16,4),d('Lluvia','lluvia',12,3,80,72,22,1),d('Nublado','nubes',11,2,80,75,20,2)],
  '41091': [d('Soleado','sol',22,10,0,45,12,7),d('Soleado','sol',24,11,0,42,10,8),d('Parcialmente nublado','sol_nubes',20,9,5,50,14,5),d('Nublado','nubes',18,8,20,65,18,3),d('Lluvia','lluvia',16,7,80,80,22,1),d('Llovizna','lluvia_sol',17,8,60,75,20,2),d('Soleado','sol',21,10,0,48,11,7)],
  '33044': [d('Lluvia','lluvia',13,7,90,90,20,1),d('Lluvia','lluvia',12,6,100,92,22,1),d('Llovizna','lluvia_sol',14,8,55,88,16,2),d('Nublado','nubes',14,8,25,80,14,3),d('Parcialmente nublado','sol_nubes',15,9,15,75,12,4),d('Lluvia','lluvia',12,7,80,88,24,1),d('Lluvia','lluvia',11,6,80,90,20,1)],
  '48020': [d('Lluvia','lluvia',11,6,100,92,20,1),d('Llovizna','lluvia_sol',9,5,25,88,16,3),d('Soleado','sol',15,7,0,72,14,5),d('Soleado','sol',16,8,0,70,12,5),d('Parcialmente nublado','sol_nubes',14,7,10,75,16,4),d('Lluvia','lluvia',12,6,80,88,24,1),d('Lluvia','lluvia',11,5,80,90,20,1)],
  '20069': [d('Lluvia','lluvia',11,6,100,92,20,1),d('Lluvia','lluvia',9,5,100,95,22,1),d('Llovizna','lluvia_sol',12,7,25,85,16,3),d('Soleado','sol',15,7,0,72,14,5),d('Soleado','sol',16,8,0,70,12,5),d('Lluvia','lluvia',12,6,80,88,24,1),d('Lluvia','lluvia',11,5,80,90,20,1)],
  '15078': [d('Lluvia','lluvia',14,8,90,90,22,1),d('Lluvia','lluvia',13,7,100,95,24,1),d('Llovizna','lluvia_sol',15,8,60,88,18,2),d('Nublado','nubes',15,9,30,82,15,3),d('Parcialmente nublado','sol_nubes',16,9,20,76,13,4),d('Lluvia','lluvia',13,8,85,90,25,1),d('Lluvia','lluvia',12,7,80,92,22,1)],
  '08019': [d('Parcialmente nublado','sol_nubes',15,8,15,68,18,4),d('Lluvia','lluvia',13,6,65,82,22,2),d('Soleado','sol',17,9,5,60,15,5),d('Soleado','sol',18,10,0,55,12,6),d('Parcialmente nublado','sol_nubes',16,8,20,65,16,4),d('Lluvia','lluvia',14,7,70,80,24,1),d('Nublado','nubes',13,6,80,78,20,2)],
  '46250': [d('Soleado','sol',19,10,0,55,14,6),d('Soleado','sol',20,11,0,52,13,7),d('Parcialmente nublado','sol_nubes',18,9,10,62,16,5),d('Soleado','sol',21,11,0,50,12,7),d('Soleado','sol',22,12,0,48,11,7),d('Lluvia','lluvia',15,8,75,78,22,1),d('Lluvia','lluvia',14,7,80,80,20,1)],
  '35016': [d('Soleado','sol',24,18,0,60,20,8),d('Soleado','sol',25,18,0,58,22,8),d('Parcialmente nublado','sol_nubes',23,17,5,65,25,6),d('Soleado','sol',24,18,0,60,20,8),d('Soleado','sol',25,19,0,58,18,8),d('Nublado','nubes',22,17,20,72,28,4),d('Parcialmente nublado','sol_nubes',23,17,10,65,22,6)],
  '07040': [d('Soleado','sol',18,11,0,55,14,6),d('Soleado','sol',19,12,0,52,12,6),d('Parcialmente nublado','sol_nubes',17,10,10,60,16,4),d('Soleado','sol',20,12,0,50,11,7),d('Nublado','nubes',16,9,25,70,19,3),d('Lluvia','lluvia',15,8,70,80,22,1),d('Parcialmente nublado','sol_nubes',17,10,15,65,17,4)],
  'default': [d('Parcialmente nublado','sol_nubes',15,5,10,55,16,4),d('Soleado','sol',17,6,0,48,14,5),d('Soleado','sol',19,7,0,45,12,6),d('Nublado','nubes',14,4,25,65,18,3),d('Lluvia','lluvia',12,3,75,78,22,1),d('Llovizna','lluvia_sol',13,4,55,72,20,2),d('Soleado','sol',16,5,0,50,15,5)],
};
