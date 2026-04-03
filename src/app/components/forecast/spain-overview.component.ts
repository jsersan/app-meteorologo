import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { WeatherIconPipe } from '../../pipes/weather.pipes';
import { SPAIN_DATA } from '../../models/spain-data';

@Component({
  selector: 'app-spain-overview',
  standalone: true,
  imports: [CommonModule, WeatherIconPipe],
  
  template: `
    <div class="overview-wrap">
      <div class="overview-header">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="var(--sky-600)" stroke-width="1.8"/>
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
                stroke="var(--sky-600)" stroke-width="1.8" fill="none"/>
        </svg>
        <span>Resumen meteorológico — España</span>
        <span class="header-date">{{ today | date:'EEEE, d MMMM':'':'es' }}</span>
      </div>

      @if (state.loadingSpain()) {
        <div class="loading-grid">
          @for (n of skeleton; track $index) {
            <div class="card-skeleton"></div>
          }
        </div>
      } @else {
        <div class="cards-grid stagger">
          @for (card of state.spainCards(); track $index) {
            @if (card.pred.days[0]; as day) {
              <button class="city-card" (click)="selectCCAA(card.ccaa)">
                <div class="card-top">
                  <div class="card-city">{{ card.municipio }}</div>
                  <div class="card-icon">{{ day.icono | weatherIcon }}</div>
                </div>
                <div class="card-temp">
                  <span class="t-max">{{ day.tempMax }}°</span>
                  <span class="t-min">{{ day.tempMin }}°</span>
                </div>
                <div class="card-meta">
                  <span class="meta-item">
                    <span class="dot rain"></span>{{ day.precipProb }}%
                  </span>
                  <span class="meta-item">
                    💨 {{ day.windSpeed }} km/h
                  </span>
                </div>
                @if (day.precipProb > 0) {
                  <div class="precip-track">
                    <div class="precip-bar" [style.width.%]="day.precipProb"></div>
                  </div>
                }
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .overview-wrap {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 0.5px solid var(--border-subtle);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .overview-header {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: rgba(14,148,218,0.05);
      border-bottom: 0.5px solid var(--border-subtle);
      font-size: 11px; font-weight: 600;
      letter-spacing: 0.7px; text-transform: uppercase;
      color: var(--sky-700);
    }
    .header-date {
      margin-left: auto; font-size: 11px;
      font-weight: 400; letter-spacing: 0;
      text-transform: none; color: var(--text-muted);
    }

    /* Grid of city cards */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
      gap: 8px;
      padding: 12px;
    }
    .city-card {
      background: linear-gradient(135deg, #f0f8ff 0%, #e4f3fc 100%);
      border: 0.5px solid rgba(14,148,218,0.18);
      border-radius: var(--radius-md);
      padding: 12px 10px 10px;
      cursor: pointer; text-align: left;
      font-family: var(--font-primary);
      transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
    }
    .city-card:hover {
      background: linear-gradient(135deg, #d8eefa 0%, #c5e4f7 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(2,116,184,0.14);
    }
    .city-card:active { transform: scale(0.98); }

    .card-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 4px;
    }
    .card-city {
      font-size: 12px; font-weight: 600; color: var(--text-primary);
      line-height: 1.25;
    }
    .card-icon { font-size: 22px; line-height: 1; }

    .card-temp {
      display: flex; gap: 5px; align-items: baseline;
      margin-bottom: 5px;
    }
    .t-max { font-size: 18px; font-weight: 600; color: var(--text-primary); }
    .t-min { font-size: 12px; color: var(--text-muted); }

    .card-meta {
      display: flex; gap: 8px; font-size: 10px; color: var(--text-muted);
      flex-wrap: wrap;
    }
    .meta-item { display: flex; align-items: center; gap: 3px; }
    .dot { width: 5px; height: 5px; border-radius: 50%; }
    .dot.rain { background: var(--color-rain); }

    .precip-track {
      margin-top: 6px; height: 3px;
      background: rgba(14,148,218,0.1);
      border-radius: 2px; overflow: hidden;
    }
    .precip-bar {
      height: 100%; background: var(--color-rain);
      border-radius: 2px;
    }

    /* Skeleton */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
      gap: 8px; padding: 12px;
    }
    .card-skeleton {
      height: 92px;
      background: linear-gradient(90deg, #e8f4fd 25%, #d0eaf8 50%, #e8f4fd 75%);
      background-size: 200% 100%;
      border-radius: var(--radius-md);
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 600px) {
      .cards-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class SpainOverviewComponent {
  state  = inject(AppStateService);
  today  = new Date();
  skeleton = Array(17).fill(0);

  selectCCAA(ccaaName: string): void {
    const ccaa = this.state.comunidades().find(c => c.name === ccaaName);
    if (ccaa) this.state.selectCCAA(ccaa);
  }
}
