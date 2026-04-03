import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { WeatherIconPipe, WeatherDescPipe, WindDirPipe } from '../../pipes/weather.pipes';

@Component({
  selector: 'app-current-weather',
  standalone: true,
  imports: [CommonModule, WeatherIconPipe, WeatherDescPipe, WindDirPipe],
  
  template: `
    @if (state.selectedDay(); as day) {
      <div class="hero-card fade-in">
        <div class="hero-gradient"></div>

        <div class="hero-main">
          <div class="hero-left">
            <div class="hero-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" opacity="0.85"/>
                <circle cx="12" cy="9" r="2.5" fill="rgba(255,255,255,0.3)"/>
              </svg>
              <span class="city">{{ state.selectedMunicipio().name }}</span>
            </div>
            <div class="region">{{ state.selectedCCAA().name }}</div>
            <div class="description">{{ day.icono | weatherDesc }}</div>
          </div>

          <div class="hero-right">
            <div class="hero-icon">{{ day.icono | weatherIcon }}</div>
            <div class="hero-temp">
              {{ day.tempMax }}<sup>°C</sup>
            </div>
          </div>
        </div>

        <div class="hero-stats">
          <div class="stat-chip">
            <span class="stat-icon">💧</span>
            <div>
              <div class="stat-val">{{ day.humidity }}%</div>
              <div class="stat-lbl">Humedad</div>
            </div>
          </div>
          <div class="stat-chip">
            <span class="stat-icon">💨</span>
            <div>
              <div class="stat-val">{{ day.windSpeed }} km/h</div>
              <div class="stat-lbl">Viento {{ day.windDir | windDir }}</div>
            </div>
          </div>
          <div class="stat-chip">
            <span class="stat-icon">🌡️</span>
            <div>
              <div class="stat-val">{{ day.sensTermica }}°</div>
              <div class="stat-lbl">Sensación</div>
            </div>
          </div>
          <div class="stat-chip">
            <span class="stat-icon">☀️</span>
            <div>
              <div class="stat-val">UV {{ day.uvIndex }}</div>
              <div class="stat-lbl">Índice UV</div>
            </div>
          </div>
          <div class="stat-chip">
            <span class="stat-icon">🌧️</span>
            <div>
              <div class="stat-val">{{ day.precipProb }}%</div>
              <div class="stat-lbl">Precip.</div>
            </div>
          </div>
          @if (day.tempMin !== undefined) {
            <div class="stat-chip">
              <span class="stat-icon">↓</span>
              <div>
                <div class="stat-val">{{ day.tempMin }}°</div>
                <div class="stat-lbl">Mínima</div>
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="hero-skeleton"></div>
    }
  `,
  styles: [`
    .hero-card {
      position: relative;
      background: linear-gradient(135deg, var(--sky-700) 0%, var(--sky-500) 55%, #38c8f0 100%);
      border-radius: var(--radius-xl);
      overflow: hidden;
      color: white;
      box-shadow: var(--shadow-float);
    }
    .hero-gradient {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.12) 0%, transparent 60%);
      pointer-events: none;
    }
    .hero-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 1.5rem 1rem;
    }
    .hero-location {
      display: flex; align-items: center; gap: 5px;
      margin-bottom: 4px;
    }
    .city { font-size: 22px; font-weight: 600; letter-spacing: -0.4px; }
    .region { font-size: 12px; opacity: 0.8; margin-bottom: 6px; }
    .description { font-size: 14px; font-weight: 400; opacity: 0.9; }
    .hero-right { display: flex; flex-direction: column; align-items: flex-end; }
    .hero-icon { font-size: 52px; line-height: 1; }
    .hero-temp {
      font-size: 52px;
      font-weight: 300;
      letter-spacing: -2px;
      line-height: 1;
      margin-top: 4px;
    }
    .hero-temp sup {
      font-size: 20px;
      font-weight: 400;
      vertical-align: super;
    }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      border-top: 0.5px solid rgba(255,255,255,0.2);
      padding: 0 0.5rem 0.5rem;
    }
    .stat-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }
    .stat-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
    .stat-val { font-size: 14px; font-weight: 600; }
    .stat-lbl { font-size: 10px; opacity: 0.7; margin-top: 1px; }
    .hero-skeleton {
      height: 200px;
      background: linear-gradient(135deg, var(--sky-300), var(--sky-200));
      border-radius: var(--radius-xl);
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
    }

    @media (max-width: 480px) {
      .hero-stats { grid-template-columns: repeat(2, 1fr); }
      .hero-temp, .hero-icon { font-size: 40px; }
    }
  `]
})
export class CurrentWeatherComponent {
  state = inject(AppStateService);
}
