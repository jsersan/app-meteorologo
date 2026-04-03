import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { WeatherIconPipe, WeatherDescPipe } from '../../pipes/weather.pipes';

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [CommonModule, WeatherIconPipe],
  
  template: `
    @if (state.selectedDay(); as day) {
      <div class="detail-card fade-in">
        <div class="detail-header">
          <div class="detail-title">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--sky-600)" stroke-width="1.8"/>
              <path d="M12 7v5l3 3" stroke="var(--sky-600)" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <span>Detalle del día</span>
          </div>
          <span class="detail-date">
            {{ getFullDate(day.fecha, state.selectedDayIndex()) }}
          </span>
        </div>

        <!-- Time slots grid (like AEMET: 4 periods) -->
        <div class="slots-grid">
          @for (slot of day.slots; track slot.periodo) {
            <div class="slot-card">
              <div class="slot-period">{{ slot.periodo }}h</div>
              <div class="slot-icon">{{ slot.icono | weatherIcon }}</div>
              <div class="slot-temp">{{ slot.temp }}°</div>
              @if (slot.precipProb > 0) {
                <div class="slot-precip">
                  <span class="drop">💧</span>{{ slot.precipProb | number:'1.0-0' }}%
                </div>
              } @else {
                <div class="slot-precip muted">—</div>
              }
              <div class="slot-wind">
                <span class="wind-icon">💨</span>{{ slot.viento | number:'1.0-0' }} km/h
              </div>
            </div>
          }
        </div>

        <!-- Precipitation probability bar -->
        <div class="precip-section">
          <div class="section-row">
            <span class="section-label">Probabilidad de precipitación</span>
            <span class="section-value rain">{{ day.precipProb }}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill rain" [style.width.%]="day.precipProb"></div>
          </div>
          @if (day.precipAcum > 0) {
            <div class="acum-note">Acumulación estimada: {{ day.precipAcum | number:'1.1-1' }} mm</div>
          }
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-block">
            <div class="stat-icon-wrap rain">💧</div>
            <div>
              <div class="stat-val">{{ day.humidity }}%</div>
              <div class="stat-key">Humedad</div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-icon-wrap wind">💨</div>
            <div>
              <div class="stat-val">{{ day.windSpeed }} km/h</div>
              <div class="stat-key">Viento {{ day.windDir }}</div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-icon-wrap uv">☀️</div>
            <div>
              <div class="stat-val">{{ day.uvIndex }}</div>
              <div class="stat-key">Índice UV</div>
            </div>
          </div>
          <div class="stat-block">
            <div class="stat-icon-wrap temp">🌡️</div>
            <div>
              <div class="stat-val">{{ day.sensTermica }}°C</div>
              <div class="stat-key">Sensación</div>
            </div>
          </div>
        </div>

        <!-- Temperature range bar -->
        <div class="temp-range-section">
          <div class="section-row">
            <span class="section-label">Rango de temperatura</span>
            <span class="section-value">
              <span class="cold">{{ day.tempMin }}°</span>
              &nbsp;/&nbsp;
              <span class="warm">{{ day.tempMax }}°</span>
            </span>
          </div>
          <div class="temp-bar-track">
            <div
              class="temp-bar-fill"
              [style.left.%]="tempOffset(day.tempMin)"
              [style.width.%]="tempWidth(day.tempMin, day.tempMax)">
            </div>
            <div class="temp-min-label" [style.left.%]="tempOffset(day.tempMin)">
              {{ day.tempMin }}°
            </div>
            <div class="temp-max-label" [style.left.%]="tempOffset(day.tempMax)">
              {{ day.tempMax }}°
            </div>
          </div>
          <div class="temp-scale">
            <span>-10°</span><span>0°</span><span>10°</span><span>20°</span><span>30°</span><span>40°</span>
          </div>
        </div>

      </div>
    }
  `,
  styles: [`
    .detail-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 0.5px solid var(--border-subtle);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(14, 148, 218, 0.05);
      border-bottom: 0.5px solid var(--border-subtle);
    }
    .detail-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--sky-700);
    }
    .detail-date {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 400;
    }

    /* Time slots */
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 0.5px solid var(--border-subtle);
    }
    .slot-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 14px 8px 10px;
      border-right: 0.5px solid var(--border-subtle);
      gap: 3px;
    }
    .slot-card:last-child { border-right: none; }
    .slot-period {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.4px;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .slot-icon { font-size: 24px; line-height: 1; margin: 4px 0; }
    .slot-temp { font-size: 18px; font-weight: 600; color: var(--text-primary); }
    .slot-precip {
      font-size: 11px;
      color: var(--color-rain);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .slot-precip.muted { color: var(--text-muted); opacity: 0.5; }
    .slot-wind {
      font-size: 10px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .drop, .wind-icon { font-size: 10px; }

    /* Precip bar */
    .precip-section {
      padding: 12px 14px;
      border-bottom: 0.5px solid var(--border-subtle);
    }
    .section-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .section-label {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .section-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .section-value.rain { color: var(--color-rain); }
    .bar-track {
      height: 6px;
      background: rgba(14, 148, 218, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .bar-fill.rain { background: var(--color-rain); }
    .acum-note {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 5px;
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 0.5px solid var(--border-subtle);
    }
    .stat-block {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 10px;
      border-right: 0.5px solid var(--border-subtle);
    }
    .stat-block:last-child { border-right: none; }
    .stat-icon-wrap { font-size: 18px; line-height: 1; }
    .stat-val { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .stat-key { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

    /* Temperature range */
    .temp-range-section {
      padding: 12px 14px 14px;
    }
    .cold { color: var(--sky-600); }
    .warm { color: #e07b2a; }
    .temp-bar-track {
      position: relative;
      height: 6px;
      background: linear-gradient(to right,
        #91d3f5 0%, #91d3f5 33%,
        #f5e67a 50%,
        #f5a56a 67%,
        #e06030 100%);
      border-radius: 3px;
      margin: 6px 0 4px;
      overflow: visible;
    }
    .temp-bar-fill {
      position: absolute;
      top: -1px;
      height: 8px;
      background: linear-gradient(to right, var(--sky-400), #e07b2a);
      border-radius: 4px;
      opacity: 0.85;
      border: 1.5px solid white;
    }
    .temp-min-label,
    .temp-max-label {
      position: absolute;
      top: -18px;
      font-size: 9px;
      color: var(--text-muted);
      transform: translateX(-50%);
    }
    .temp-scale {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    @media (max-width: 480px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .slots-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DayDetailComponent {
  state = inject(AppStateService);

  getFullDate(fecha: string, index: number): string {
    if (index === 0) return 'Hoy';
    if (!fecha || fecha.length < 10) return '';
    const d = new Date(fecha + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    return `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
  }

  // Map temperature to % position on a -10 to 40 scale
  tempOffset(temp: number): number {
    return Math.max(0, Math.min(100, ((temp + 10) / 50) * 100));
  }

  tempWidth(min: number, max: number): number {
    return Math.max(4, ((max - min) / 50) * 100);
  }
}
