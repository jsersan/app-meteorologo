import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from './services/app-state.service';
import { SpainMapComponent } from './components/map/spain-map.component';
import { CurrentWeatherComponent } from './components/current-weather/current-weather.component';
import { ForecastComponent } from './components/forecast/forecast.component';
import { DayDetailComponent } from './components/forecast/day-detail.component';
import { SpainOverviewComponent } from './components/forecast/spain-overview.component';

// NOTE: Default change detection (not OnPush) so signals propagate immediately
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SpainMapComponent,
    CurrentWeatherComponent,
    ForecastComponent,
    DayDetailComponent,
    SpainOverviewComponent,
  ],
  template: `
    <div class="app-shell">

      <!-- ── Header ──────────────────────────────────────── -->
      <header class="app-header">
        <div class="header-brand">
          <div class="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4.5" fill="white" opacity="0.95"/>
              <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"
                    stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
              <circle cx="12" cy="8" r="2" fill="#0274b8"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">MeteoEspaña</div>
            <div class="brand-sub">Datos: AEMET Open Data</div>
          </div>
        </div>

        <div class="header-center">
          <span class="copyright">© Txema Serrano</span>
          <span class="sep">·</span>
          <span class="header-date">{{ today | date:'EEEE, d MMMM yyyy':'':'es' }}</span>
          @if (state.loading()) {
            <div class="loading-badge">
              <span class="pulse-dot"></span> Actualizando
            </div>
          }
        </div>

        <div class="header-right">
          <a href="https://opendata.aemet.es" target="_blank" rel="noopener" class="aemet-link">
            AEMET Open Data
          </a>
        </div>
      </header>

      <!-- ── Full-width map ──────────────────────────────── -->
      <section class="map-section">
        <div class="map-hint">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M3 7l6-4 6 4 6-4v14l-6 4-6-4-6 4V7z"
                  stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
          </svg>
          @if (state.selectedCCAA().id === '00') {
            Haz clic en una comunidad autónoma para ver su pronóstico
          } @else {
            <span class="hint-selected">{{ state.selectedCCAA().name }}</span>
          }
        </div>
        <app-spain-map />
      </section>

      <!-- ── Content below map ──────────────────────────── -->
      <main class="app-main">

        @if (state.selectedCCAA().id === '00') {
          <app-spain-overview />

        } @else {
          <!-- CCAA header + municipio tabs -->
          <div class="ccaa-header">
            <div class="ccaa-title">
              <span class="ccaa-icon">📍</span>
              {{ state.selectedCCAA().name }}
            </div>
            <div class="muni-tabs">
              @for (muni of state.municipios(); track muni.id) {
                <button
                  class="muni-tab"
                  [class.active]="state.selectedMunicipio().id === muni.id"
                  (click)="state.selectMunicipio(muni)">
                  {{ muni.name }}
                </button>
              }
            </div>
          </div>

          <div class="weather-col">
            <app-current-weather />
            <app-forecast />
            <app-day-detail />
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 10% 0%,  rgba(56,174,240,0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 90% 100%, rgba(14,148,218,0.10) 0%, transparent 50%),
        linear-gradient(160deg, #ddeeff 0%, #cce8fb 50%, #d5ecff 100%);
      display: flex; flex-direction: column;
    }

    /* ── Header ──────────────────────────────────────── */
    .app-header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center; gap: 12px;
      padding: 11px 20px;
      background: rgba(2,116,184,0.92);
      backdrop-filter: blur(12px);
      border-bottom: 0.5px solid rgba(255,255,255,0.15);
      position: sticky; top: 0; z-index: 100;
    }
    .header-brand { display: flex; align-items: center; gap: 10px; }
    .brand-logo {
      width: 34px; height: 34px;
      background: rgba(255,255,255,0.15); border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name { font-size: 16px; font-weight: 600; color: white; letter-spacing: -0.3px; font-family: var(--font-display); }
    .brand-sub  { font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 1px; }
    .header-center { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .copyright  { font-size: 12px; color: rgba(255,255,255,0.9); font-style: italic; }
    .sep        { color: rgba(255,255,255,0.4); font-size: 12px; }
    .header-date { font-size: 12px; color: rgba(255,255,255,0.75); }
    .loading-badge {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; color: rgba(255,255,255,0.9);
      background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px;
    }
    .pulse-dot {
      width: 6px; height: 6px; background: #7df5a0; border-radius: 50%;
      animation: pulse-anim 1.2s ease-in-out infinite;
    }
    @keyframes pulse-anim { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
    .header-right { display: flex; justify-content: flex-end; }
    .aemet-link { font-size: 10px; color: rgba(255,255,255,0.55); text-decoration: none; }
    .aemet-link:hover { color: rgba(255,255,255,0.85); text-decoration: underline; }

    /* ── Map section ──────────────────────────────────── */
    .map-section {
      width: 100%;
      background: linear-gradient(180deg, rgba(2,116,184,0.05) 0%, rgba(200,230,247,0.30) 100%);
      border-bottom: 0.5px solid var(--border-subtle);
    }
    .map-section app-spain-map {
      display: block; width: 100%;
    }
    .map-hint {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 16px 0;
      font-size: 10px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;
      color: var(--sky-700); opacity: 0.72;
    }
    .hint-selected { color: var(--sky-800); opacity: 1; font-size: 11px; }

    /* ── Main content ─────────────────────────────────── */
    .app-main {
      padding: 1.25rem;
      max-width: 1200px; margin: 0 auto; width: 100%; flex: 1;
    }

    .ccaa-header { margin-bottom: 1rem; }
    .ccaa-title  {
      display: flex; align-items: center; gap: 8px;
      font-size: 20px; font-weight: 600; color: var(--text-primary);
      margin-bottom: 10px; letter-spacing: -0.3px;
    }
    .ccaa-icon { font-size: 16px; }
    .muni-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .muni-tab {
      padding: 5px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 500; font-family: var(--font-primary);
      border: 0.5px solid var(--border-mid);
      background: rgba(255,255,255,0.7); color: var(--text-secondary);
      cursor: pointer;
      transition: background 0.14s, color 0.14s, transform 0.1s;
    }
    .muni-tab:hover  { background: rgba(14,148,218,0.12); color: var(--sky-700); }
    .muni-tab.active { background: var(--sky-600); color: white; border-color: var(--sky-600); box-shadow: 0 2px 8px rgba(2,116,184,0.3); }
    .muni-tab:active { transform: scale(0.96); }
    .weather-col { display: flex; flex-direction: column; gap: 1rem; }

    @media (max-width: 700px) {
      .app-header { grid-template-columns: auto 1fr; padding: 10px 12px; }
      .header-right { display: none; }
      .app-main { padding: 0.75rem; }
    }
  `]
})
export class AppComponent {
  state = inject(AppStateService);
  today = new Date();
}
