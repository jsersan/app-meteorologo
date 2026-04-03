import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { WeatherService } from './weather.service';
import { ComunidadAutonoma, Municipio, AemetPrediction, DayDetail } from '../models/weather.models';
import { SPAIN_DATA, TODA_ESPANA } from '../models/spain-data';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private weatherService = inject(WeatherService);

  // ─── Core state ──────────────────────────────────────────────────────────
  readonly comunidades    = signal<ComunidadAutonoma[]>([TODA_ESPANA, ...SPAIN_DATA]);
  readonly selectedCCAA   = signal<ComunidadAutonoma>(TODA_ESPANA);
  readonly selectedMunicipio = signal<Municipio>(TODA_ESPANA.municipios[0]);
  readonly selectedDayIndex  = signal<number>(0);
  readonly loading        = signal<boolean>(false);
  readonly loadingSpain   = signal<boolean>(false);
  readonly error          = signal<string | null>(null);
  readonly prediction     = signal<AemetPrediction | null>(null);

  // ─── Spain-wide cards (one per capital) ─────────────────────────────────
  readonly spainCards = signal<{ municipio: string; ccaa: string; pred: AemetPrediction }[]>([]);

  // ─── Derived ─────────────────────────────────────────────────────────────
  readonly municipios  = computed(() => this.selectedCCAA().municipios);
  readonly days        = computed(() => this.prediction()?.days ?? []);
  readonly selectedDay = computed<DayDetail | null>(
    () => this.days()[this.selectedDayIndex()] ?? null
  );

  constructor() {
    // Fetch CCAA weather when municipio changes (skip Toda España)
    effect(() => {
      const muni = this.selectedMunicipio();
      const ccaa = this.selectedCCAA();
      if (muni && ccaa.id !== '00') {
        this.fetchWeather(muni.id);
      }
    });

    // Fetch Spain-wide overview on startup
    this.fetchSpainOverview();
  }

  selectCCAA(ccaa: ComunidadAutonoma): void {
    this.selectedCCAA.set(ccaa);
    this.selectedMunicipio.set(ccaa.municipios[0]);
    this.selectedDayIndex.set(0);
    if (ccaa.id === '00') {
      this.prediction.set(null);
      this.loading.set(false);
    }
  }

  selectMunicipio(muni: Municipio): void {
    this.selectedMunicipio.set(muni);
    this.selectedDayIndex.set(0);
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
  }

  // ─── Fetch one CCAA ──────────────────────────────────────────────────────
  private fetchWeather(municipioId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.weatherService.getPrediction(municipioId).subscribe({
      next:  (pred) => { this.prediction.set(pred); this.loading.set(false); },
      error: (err)  => { this.error.set(err.message); this.loading.set(false); },
    });
  }

  // ─── Fetch Spain overview: one capital per CCAA ──────────────────────────
  private fetchSpainOverview(): void {
    this.loadingSpain.set(true);

    // Pick the first municipio (capital) of each real CCAA
    const targets = SPAIN_DATA.map(ccaa => ({
      ccaaName: ccaa.name,
      muni: ccaa.municipios[0],
    }));

    const requests = targets.map(t =>
      this.weatherService.getPrediction(t.muni.id).pipe(
        catchError(() => of(this.weatherService.getMockPrediction(t.muni.id)))
      )
    );

    forkJoin(requests).subscribe({
      next: (preds) => {
        const cards = preds.map((pred, i) => ({
          municipio: targets[i].muni.name,
          ccaa:      targets[i].ccaaName,
          pred,
        }));
        this.spainCards.set(cards);
        this.loadingSpain.set(false);
      },
      error: () => this.loadingSpain.set(false),
    });
  }
}
