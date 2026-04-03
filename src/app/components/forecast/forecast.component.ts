import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { WeatherIconPipe, WeatherDescPipe } from '../../pipes/weather.pipes';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, WeatherIconPipe],
  
  template: `
    <div class="forecast-card">
      <div class="forecast-header">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="var(--sky-600)" stroke-width="1.8"/>
          <path d="M16 2v4M8 2v4M3 9h18" stroke="var(--sky-600)" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <span>Pronóstico 7 días</span>
      </div>

      <div class="forecast-grid stagger">
        @for (day of state.days(); track day.fecha; let i = $index) {
          <button
            class="day-card"
            [class.active]="state.selectedDayIndex() === i"
            [class.today]="i === 0"
            (click)="state.selectDay(i)"
            [attr.aria-label]="'Ver detalle del ' + getLabel(day.fecha, i)">

            <div class="day-label">{{ i === 0 ? 'Hoy' : getDayName(day.fecha) }}</div>
            <div class="day-date">{{ getDayDate(day.fecha) }}</div>

            <div class="day-icon">{{ day.icono | weatherIcon }}</div>

            <div class="temps">
              <span class="temp-max">{{ day.tempMax }}°</span>
              <span class="temp-min">{{ day.tempMin }}°</span>
            </div>

            @if (day.precipProb > 0) {
              <div class="precip-row">
                <span class="precip-dot"></span>
                <span class="precip-pct">{{ day.precipProb }}%</span>
              </div>
            } @else {
              <div class="precip-row empty">—</div>
            }

          </button>
        }
      </div>

      <!-- Mini precipitation bar chart -->
      <div class="precip-chart">
        <div class="precip-chart-label">Prob. precipitación</div>
        <div class="bars">
          @for (day of state.days(); track day.fecha; let i = $index) {
            <div class="bar-col" (click)="state.selectDay(i)">
              <div class="bar-track">
                <div
                  class="bar-fill"
                  [class.active]="state.selectedDayIndex() === i"
                  [style.height.%]="day.precipProb">
                </div>
              </div>
              <div class="bar-pct">{{ day.precipProb }}%</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forecast-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 0.5px solid var(--border-subtle);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .forecast-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 14px;
      background: rgba(14, 148, 218, 0.05);
      border-bottom: 0.5px solid var(--border-subtle);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--sky-700);
    }
    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0;
      padding: 10px 8px 0;
    }
    .day-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 6px 8px;
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background 0.18s, transform 0.15s;
      font-family: var(--font-primary);
      gap: 3px;
    }
    .day-card:hover {
      background: rgba(14, 148, 218, 0.07);
    }
    .day-card.today {
      background: rgba(14, 148, 218, 0.08);
    }
    .day-card.active {
      background: var(--sky-600);
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(2, 116, 184, 0.3);
    }
    .day-card.active .day-label,
    .day-card.active .day-date,
    .day-card.active .temp-min,
    .day-card.active .precip-row { color: rgba(255,255,255,0.75); }
    .day-card.active .temp-max,
    .day-card.active .day-icon { color: white; }

    .day-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .day-date {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .day-icon { font-size: 22px; line-height: 1; margin-bottom: 2px; }
    .temps {
      display: flex;
      gap: 4px;
      align-items: baseline;
    }
    .temp-max {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .temp-min {
      font-size: 11px;
      color: var(--text-muted);
    }
    .precip-row {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      color: var(--color-rain);
      font-weight: 500;
      min-height: 14px;
    }
    .precip-row.empty { color: var(--text-muted); opacity: 0.4; }
    .precip-dot {
      width: 5px; height: 5px;
      background: var(--color-rain);
      border-radius: 50%;
    }

    /* Precipitation bar chart */
    .precip-chart {
      padding: 10px 14px 12px;
      border-top: 0.5px solid var(--border-subtle);
      margin-top: 8px;
    }
    .precip-chart-label {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 500;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }
    .bars {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      height: 40px;
      align-items: flex-end;
    }
    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      height: 100%;
      justify-content: flex-end;
    }
    .bar-track {
      width: 100%;
      flex: 1;
      background: rgba(14, 148, 218, 0.08);
      border-radius: 3px 3px 2px 2px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }
    .bar-fill {
      width: 100%;
      background: var(--sky-300);
      border-radius: 3px 3px 0 0;
      transition: height 0.4s ease, background 0.2s;
      min-height: 1px;
    }
    .bar-fill.active { background: var(--sky-600); }
    .bar-pct {
      font-size: 9px;
      color: var(--text-muted);
      line-height: 1;
    }

    @media (max-width: 560px) {
      .forecast-grid { grid-template-columns: repeat(4, 1fr); }
      .bars { grid-template-columns: repeat(4, 1fr); }
    }
  `]
})
export class ForecastComponent {
  state = inject(AppStateService);

  getDayName(fecha: string): string {
    if (!fecha || fecha.length < 10) return '---';
    const d = new Date(fecha + 'T12:00:00');
    if (isNaN(d.getTime())) return '---';
    return DAYS_ES[d.getDay()];
  }

  getDayDate(fecha: string): string {
    if (!fecha || fecha.length < 10) return '';
    const d = new Date(fecha + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
  }

  getLabel(fecha: string, i: number): string {
    return i === 0 ? 'hoy' : `${this.getDayName(fecha)} ${this.getDayDate(fecha)}`;
  }
}
