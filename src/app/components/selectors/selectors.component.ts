import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../services/app-state.service';
import { ComunidadAutonoma, Municipio } from '../../models/weather.models';

@Component({
  selector: 'app-selectors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selectors-card">
      <div class="selectors-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="var(--sky-600)"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
        <span>Localización</span>
      </div>

      <div class="selectors-body">
        <div class="select-group">
          <label class="select-label" for="ccaa-select">
            Comunidad Autónoma
          </label>
          <div class="select-wrapper">
            <select
              id="ccaa-select"
              class="sel"
              [ngModel]="state.selectedCCAA()"
              (ngModelChange)="onCCAA($event)"
              [compareWith]="compareById">
              @for (ccaa of state.comunidades(); track ccaa.id) {
                <option [ngValue]="ccaa">{{ ccaa.name }}</option>
              }
            </select>
            <span class="select-arrow">
              <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="var(--sky-600)" stroke-width="1.5" fill="none"/></svg>
            </span>
          </div>
        </div>

        @if (state.selectedCCAA().id !== '00') {
          <div class="select-group">
            <label class="select-label" for="muni-select">
              Municipio
            </label>
            <div class="select-wrapper">
              <select
                id="muni-select"
                class="sel"
                [ngModel]="state.selectedMunicipio()"
                (ngModelChange)="onMunicipio($event)"
                [compareWith]="compareById">
                @for (muni of state.municipios(); track muni.id) {
                  <option [ngValue]="muni">{{ muni.name }}</option>
                }
              </select>
              <span class="select-arrow">
                <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="var(--sky-600)" stroke-width="1.5" fill="none"/></svg>
              </span>
            </div>
          </div>
        } @else {
          <div class="espana-hint">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--sky-500)" stroke-width="1.5"/>
              <path d="M12 8v4m0 4h.01" stroke="var(--sky-500)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Haz clic en el mapa o selecciona una comunidad para ver el pronóstico detallado
          </div>
        }

        @if (state.loading()) {
          <div class="loading-row">
            <div class="dot-loader">
              <span></span><span></span><span></span>
            </div>
            <span class="loading-text">Consultando AEMET…</span>
          </div>
        }

        @if (state.selectedMunicipio(); as muni) {
          @if (state.selectedCCAA().id !== '00') {
            <div class="coords-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--text-muted)" stroke-width="1.5"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="var(--text-muted)" stroke-width="1.5"/>
              </svg>
              <span>{{ muni.lat | number:'1.2-3' }}° N, {{ muni.lon | number:'1.2-3' }}° E</span>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .selectors-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 0.5px solid var(--border-subtle);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .selectors-header {
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
    .selectors-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .select-group { display: flex; flex-direction: column; gap: 4px; }
    .select-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      padding-left: 2px;
    }
    .select-wrapper {
      position: relative;
    }
    .sel {
      width: 100%;
      padding: 9px 32px 9px 11px;
      border: 0.5px solid var(--border-mid);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-family: var(--font-primary);
      background: white;
      color: var(--text-primary);
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .sel:focus {
      outline: none;
      border-color: var(--sky-500);
      box-shadow: 0 0 0 3px rgba(14, 148, 218, 0.12);
    }
    .select-arrow {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }
    .loading-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .loading-text { font-size: 11px; color: var(--text-muted); }
    .dot-loader {
      display: flex; gap: 3px; align-items: center;
    }
    .dot-loader span {
      width: 5px; height: 5px;
      background: var(--sky-500);
      border-radius: 50%;
      animation: dotBounce 1.2s ease-in-out infinite;
    }
    .dot-loader span:nth-child(2) { animation-delay: 0.15s; }
    .dot-loader span:nth-child(3) { animation-delay: 0.30s; }
    @keyframes dotBounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    .espana-hint {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      font-size: 11px;
      color: var(--text-muted);
      background: rgba(14, 148, 218, 0.06);
      border: 0.5px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      line-height: 1.5;
    }
    .espana-hint svg { flex-shrink: 0; margin-top: 1px; }
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-muted);
      padding-top: 2px;
    }
  `]
})
export class SelectorsComponent {
  state = inject(AppStateService);

  onCCAA(ccaa: ComunidadAutonoma): void {
    this.state.selectCCAA(ccaa);
  }

  onMunicipio(muni: Municipio): void {
    this.state.selectMunicipio(muni);
  }

  compareById(a: any, b: any): boolean {
    return a?.id === b?.id;
  }
}
