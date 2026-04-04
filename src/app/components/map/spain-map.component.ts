import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { AppStateService } from '../../services/app-state.service';
import { ComunidadAutonoma } from '../../models/weather.models';

declare const d3CompositeProjections: {
  geoConicConformalSpain?: () => d3.GeoProjection & {
    getCompositionBorders?: () => string;
  };
} | undefined;

type SpainFeature = Feature<Geometry, GeoJsonProperties> & {
  id?: string | number;
};

type SpainFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties> & {
  features: SpainFeature[];
};

type ScreenBounds = [[number, number], [number, number]];

const PROV_TO_CCAA: Record<string, string> = {
  '04': 'Andalucía',
  '11': 'Andalucía',
  '14': 'Andalucía',
  '18': 'Andalucía',
  '21': 'Andalucía',
  '23': 'Andalucía',
  '29': 'Andalucía',
  '41': 'Andalucía',
  '22': 'Aragón',
  '44': 'Aragón',
  '50': 'Aragón',
  '33': 'Principado de Asturias',
  '07': 'Illes Balears',
  '35': 'Canarias',
  '38': 'Canarias',
  '39': 'Cantabria',
  '02': 'Castilla-La Mancha',
  '13': 'Castilla-La Mancha',
  '16': 'Castilla-La Mancha',
  '19': 'Castilla-La Mancha',
  '45': 'Castilla-La Mancha',
  '05': 'Castilla y León',
  '09': 'Castilla y León',
  '24': 'Castilla y León',
  '34': 'Castilla y León',
  '37': 'Castilla y León',
  '40': 'Castilla y León',
  '42': 'Castilla y León',
  '47': 'Castilla y León',
  '49': 'Castilla y León',
  '08': 'Cataluña',
  '17': 'Cataluña',
  '25': 'Cataluña',
  '43': 'Cataluña',
  '06': 'Extremadura',
  '10': 'Extremadura',
  '15': 'Galicia',
  '27': 'Galicia',
  '32': 'Galicia',
  '36': 'Galicia',
  '28': 'Comunidad de Madrid',
  '30': 'Región de Murcia',
  '31': 'Comunidad Foral de Navarra',
  '01': 'País Vasco',
  '20': 'País Vasco',
  '48': 'País Vasco',
  '26': 'La Rioja',
  '03': 'Comunitat Valenciana',
  '12': 'Comunitat Valenciana',
  '46': 'Comunitat Valenciana',
  '51': 'Ceuta',
  '52': 'Melilla',
};

@Component({
  selector: 'app-spain-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper" #wrapperRef>
      @if (isLoading) {
        <div class="map-loading">
          <div class="spinner"></div>
          <span>Cargando mapa…</span>
        </div>
      }

      <svg #svgRef class="map-svg"></svg>

      @if (isZoomed) {
        <button class="back-btn" type="button" (click)="zoomOut()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>Ver toda España</span>
        </button>
      }

      <div
        class="map-tooltip"
        [class.visible]="tooltip.visible"
        [style.left.px]="tooltip.x"
        [style.top.px]="tooltip.y"
      >
        {{ tooltip.name }}
      </div>
    </div>
  `,
  styles: [
    `
      .map-wrapper {
        position: relative;
        width: 100%;
        overflow: hidden;
      }

      .map-svg {
        display: block;
        width: 100%;
        height: auto;
      }

      .map-loading {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--sky-600, #0369a1);
        font-size: 13px;
        background: rgba(200, 230, 247, 0.6);
        z-index: 5;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--sky-200, #bae6fd);
        border-top-color: var(--sky-600, #0284c7);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .back-btn {
        position: absolute;
        top: 12px;
        left: 14px;
        display: flex;
        align-items: center;
        gap: 7px;
        background: rgba(2, 116, 184, 0.92);
        color: white;
        border: none;
        border-radius: 22px;
        padding: 7px 16px 7px 11px;
        font-size: 12px;
        font-weight: 600;
        font-family: var(--font-primary), system-ui;
        cursor: pointer;
        z-index: 20;
        box-shadow: 0 3px 12px rgba(2, 80, 140, 0.3);
        animation: slideIn 0.22s ease both;
        transition: background 0.14s;
      }

      .back-btn:hover {
        background: rgba(2, 96, 160, 1);
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-12px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .map-tooltip {
        position: absolute;
        background: rgba(5, 30, 58, 0.9);
        color: white;
        font-size: 12px;
        font-weight: 500;
        padding: 5px 12px;
        border-radius: 20px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s;
        white-space: nowrap;
        transform: translate(-50%, -140%);
        z-index: 20;
      }

      .map-tooltip.visible {
        opacity: 1;
      }
    `,
  ],
})
export class SpainMapComponent implements OnInit, OnDestroy {
  @ViewChild('svgRef', { static: true })
  svgRef!: ElementRef<SVGSVGElement>;

  @ViewChild('wrapperRef', { static: true })
  wrapperRef!: ElementRef<HTMLDivElement>;

  private readonly state = inject(AppStateService);
  private readonly zone = inject(NgZone);

  isLoading = true;
  isZoomed = false;
  tooltip = { visible: false, x: 0, y: 0, name: '' };

  private W = 0;
  private H = 0;
  private proj!: d3.GeoProjection & { getCompositionBorders?: () => string };
  private pathFn!: d3.GeoPath<any, SpainFeature>;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  private topoCC: Topology | null = null;
  private topoProv: Topology | null = null;

  private screenBounds = new Map<string, ScreenBounds>();
  private ccaaByName = new Map<string, SpainFeature>();
  private provByCCAA = new Map<string, SpainFeature[]>();

  private resizeObserver?: ResizeObserver;
  private resizeTimer?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    await this.loadLib();

    [this.topoCC, this.topoProv] = await Promise.all([
      this.fetchTopo('https://unpkg.com/es-atlas@0.5.0/es/autonomous_regions.json'),
      this.fetchTopo('https://unpkg.com/es-atlas@0.5.0/es/provinces.json'),
    ]);

    this.buildFullMap();
    this.setupResize();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }

  zoomOut(): void {
    this.isZoomed = false;
    const todas = this.state.comunidades().find((c) => c.id === '00');
    if (todas) {
      this.state.selectCCAA(todas);
    }
    this.zone.run(() => this.resetViewBox());
  }

  private loadLib(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof d3CompositeProjections !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://unpkg.com/d3-composite-projections@1.4.0/dist/d3-composite-projections.min.js';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  private async fetchTopo(url: string): Promise<Topology | null> {
    try {
      const data = await d3.json(url);
      return (data as Topology) ?? null;
    } catch {
      return null;
    }
  }

  private buildFullMap(): void {
    this.isLoading = true;

    if (!this.topoCC) {
      this.isLoading = false;
      return;
    }

    const wrapper = this.wrapperRef.nativeElement;
    this.W = Math.max(wrapper.clientWidth, 400);
    this.H = Math.round(this.W * 0.65);

    const svgEl = this.svgRef.nativeElement;
    svgEl.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    svgEl.setAttribute('width', String(this.W));
    svgEl.setAttribute('height', String(this.H));

    this.svg = d3.select(svgEl);
    this.svg.selectAll('*').remove();
    this.screenBounds.clear();
    this.ccaaByName.clear();
    this.provByCCAA.clear();

    const useComposite =
      typeof d3CompositeProjections !== 'undefined' &&
      typeof d3CompositeProjections.geoConicConformalSpain === 'function';

    this.proj = useComposite
      ? d3CompositeProjections.geoConicConformalSpain!()
      : (d3.geoConicConformal().center([-3.7, 40.2]).rotate([0, 0]).parallels([36, 44]) as d3.GeoProjection);

    const ccaaGeo = topojson.feature(
      this.topoCC,
      (this.topoCC as Topology & { objects: Record<string, GeometryCollection> }).objects[
        'autonomous_regions'
      ]
    ) as SpainFeatureCollection;

    const pad = Math.round(this.W * 0.03);
    this.proj.fitSize([this.W - pad * 2, this.H - pad * 2], ccaaGeo);

    const currentTranslate = this.proj.translate();
    this.proj.translate([currentTranslate[0] + pad, currentTranslate[1] + pad]);
    this.pathFn = d3.geoPath(this.proj);

    ccaaGeo.features.forEach((feature) => {
      const key = this.norm(this.getLabel(feature));
      this.ccaaByName.set(key, feature);
      this.screenBounds.set(key, this.pathFn.bounds(feature) as ScreenBounds);
    });

    if (this.topoProv) {
      const provGeo = topojson.feature(
        this.topoProv,
        (this.topoProv as Topology & { objects: Record<string, GeometryCollection> }).objects['provinces']
      ) as SpainFeatureCollection;

      provGeo.features.forEach((feature) => {
        const rawId = String(feature.id ?? '').padStart(2, '0');
        const ccaaName = PROV_TO_CCAA[rawId];
        if (!ccaaName) {
          return;
        }

        const key = this.norm(ccaaName);
        if (!this.provByCCAA.has(key)) {
          this.provByCCAA.set(key, []);
        }
        this.provByCCAA.get(key)!.push(feature);
      });
    }

    this.drawCCAA(ccaaGeo);
    this.drawProvinces();
    this.drawCompositionBorders();
    this.drawLabels(ccaaGeo);

    this.isLoading = false;
  }

  private drawCCAA(ccaaGeo: SpainFeatureCollection): void {
    this.svg
      .append('g')
      .attr('class', 'ccaa-layer')
      .selectAll<SVGPathElement, SpainFeature>('path.ccaa')
      .data(ccaaGeo.features)
      .join('path')
      .attr('class', 'ccaa')
      .attr('d', this.pathFn)
      .attr('fill', (feature) => this.fillFor(feature))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.8)
      .attr('stroke-linejoin', 'round')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, feature) => {
        if (!this.isSelected(feature)) {
          d3.select(event.currentTarget).attr('fill', '#3a9fd4');
        }

        const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
        this.zone.run(() => {
          this.tooltip = {
            visible: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            name: this.getLabel(feature),
          };
        });
      })
      .on('mousemove', (event) => {
        const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
        this.tooltip.x = event.clientX - rect.left;
        this.tooltip.y = event.clientY - rect.top;
      })
      .on('mouseleave', (event, feature) => {
        d3.select(event.currentTarget).attr('fill', this.fillFor(feature));
        this.zone.run(() => {
          this.tooltip = { ...this.tooltip, visible: false };
        });
      })
      .on('click', (_event, feature) => {
        const label = this.getLabel(feature);
        const ccaa = this.resolveCCAAFromLabel(label);

        if (!ccaa) {
          return;
        }

        this.zone.run(() => {
          this.tooltip = { ...this.tooltip, visible: false };
          this.isZoomed = true;
          this.state.selectCCAA(ccaa);
          this.redrawFills();
          this.zoomToScreenBounds(this.norm(label));
          this.showProvinces(this.norm(ccaa.name));
        });
      });
  }

  private drawProvinces(): void {
    if (!this.topoProv) {
      return;
    }

    const provGeo = topojson.feature(
      this.topoProv,
      (this.topoProv as Topology & { objects: Record<string, GeometryCollection> }).objects['provinces']
    ) as SpainFeatureCollection;

    this.svg
      .append('g')
      .attr('class', 'prov-layer')
      .attr('opacity', 0)
      .selectAll<SVGPathElement, SpainFeature>('path.prov')
      .data(provGeo.features)
      .join('path')
      .attr('class', 'prov')
      .attr('d', this.pathFn)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.7)')
      .attr('stroke-width', 0.4)
      .attr('pointer-events', 'none');
  }

  private drawCompositionBorders(): void {
    if (typeof this.proj.getCompositionBorders !== 'function') {
      return;
    }

    this.svg
      .append('path')
      .attr('d', this.proj.getCompositionBorders())
      .attr('fill', 'none')
      .attr('stroke', '#7ab8d9')
      .attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.6);
  }

  private drawLabels(ccaaGeo: SpainFeatureCollection): void {
    const fontSize = Math.max(7, Math.round(this.W / 115));

    this.svg
      .append('g')
      .attr('class', 'labels')
      .selectAll<SVGTextElement, SpainFeature>('text')
      .data(ccaaGeo.features)
      .join('text')
      .attr('transform', (feature) => {
        const centroid = this.pathFn.centroid(feature);
        return centroid && Number.isFinite(centroid[0])
          ? `translate(${centroid[0]},${centroid[1]})`
          : 'translate(-999,-999)';
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', fontSize)
      .attr('font-family', 'var(--font-primary), system-ui')
      .attr('font-weight', '500')
      .attr('fill', 'rgba(255,255,255,0.88)')
      .attr('pointer-events', 'none')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'rgba(2,80,140,0.30)')
      .attr('stroke-width', fontSize * 0.4)
      .text((feature) => this.shortLabel(this.getLabel(feature)));
  }

  private zoomToScreenBounds(key: string): void {
    let bounds = this.screenBounds.get(key);

    if (!bounds) {
      for (const [currentKey, currentBounds] of this.screenBounds.entries()) {
        if (currentKey.includes(key) || key.includes(currentKey)) {
          bounds = currentBounds;
          break;
        }
      }
    }

    if (!bounds) {
      return;
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const bw = x1 - x0;
    const bh = y1 - y0;
    const area = bw * bh;
    const pf = area < 400 ? 3.0 : area < 2000 ? 1.2 : area < 8000 ? 0.4 : 0.2;
    const px = bw * pf;
    const py = bh * pf;
    const vx = x0 - px;
    const vy = y0 - py;
    const vw = bw + px * 2;
    const vh = bh + py * 2;

    const svgEl = this.svgRef.nativeElement;
    const interp = d3.interpolateArray([0, 0, this.W, this.H], [vx, vy, vw, vh]);

    d3.select(svgEl)
      .transition()
      .duration(600)
      .ease(d3.easeCubicInOut)
      .tween('viewBox', () => (t: number) => {
        const [x, y, w, h] = interp(t) as number[];
        svgEl.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);

        const scale = this.W / w;
        svgEl.querySelectorAll<SVGPathElement>('path.ccaa').forEach((path) => {
          path.setAttribute('stroke-width', `${(0.8 / scale).toFixed(3)}`);
        });
        svgEl.querySelectorAll<SVGPathElement>('path.prov').forEach((path) => {
          path.setAttribute('stroke-width', `${(0.4 / scale).toFixed(3)}`);
        });

        const baseFontSize = Math.max(7, Math.round(this.W / 115));
        svgEl.querySelectorAll<SVGTextElement>('g.labels text').forEach((text) => {
          const scaled = (baseFontSize / scale) * 2.2;
          text.setAttribute('font-size', scaled.toFixed(2));
          text.setAttribute('stroke-width', `${(scaled * 0.35).toFixed(2)}`);
        });
      });
  }

  private resetViewBox(): void {
    const svgEl = this.svgRef.nativeElement;
    const currentViewBox = (svgEl.getAttribute('viewBox') ?? `0 0 ${this.W} ${this.H}`)
      .split(' ')
      .map(Number);

    const interp = d3.interpolateArray(currentViewBox, [0, 0, this.W, this.H]);

    d3.select(svgEl)
      .transition()
      .duration(500)
      .ease(d3.easeCubicInOut)
      .tween('viewBox', () => (t: number) => {
        const [x, y, w, h] = interp(t) as number[];
        svgEl.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);

        const scale = this.W / w;
        svgEl.querySelectorAll<SVGPathElement>('path.ccaa').forEach((path) => {
          path.setAttribute('stroke-width', `${(0.8 / scale).toFixed(3)}`);
        });
        svgEl.querySelectorAll<SVGPathElement>('path.prov').forEach((path) => {
          path.setAttribute('stroke-width', `${(0.4 / scale).toFixed(3)}`);
        });

        const baseFontSize = Math.max(7, Math.round(this.W / 115));
        svgEl.querySelectorAll<SVGTextElement>('g.labels text').forEach((text) => {
          const scaled = baseFontSize / scale;
          text.setAttribute('font-size', scaled.toFixed(2));
          text.setAttribute('stroke-width', `${(scaled * 0.4).toFixed(2)}`);
        });
      });

    this.svg.select('g.prov-layer').transition().duration(400).attr('opacity', 0);
    this.redrawFills();
  }

  private showProvinces(ccaaKey: string): void {
    this.svg.select('g.prov-layer').transition().duration(400).attr('opacity', 1);

    this.svg
      .selectAll<SVGPathElement, SpainFeature>('path.prov')
      .attr('display', (feature) => {
        const rawId = String(feature.id ?? '').padStart(2, '0');
        const ccaaName = PROV_TO_CCAA[rawId];
        return this.norm(ccaaName ?? '') === ccaaKey ? null : 'none';
      });
  }

  private isSelected(feature: SpainFeature): boolean {
    const selected = this.state.selectedCCAA();
    if (selected.id === '00') {
      return false;
    }

    const featureName = this.norm(this.getLabel(feature));
    const selectedName = this.norm(selected.name);
    return (
      featureName === selectedName ||
      featureName.includes(selectedName) ||
      selectedName.includes(featureName)
    );
  }

  private fillFor(feature: SpainFeature): string {
    return this.isSelected(feature) ? '#0274b8' : '#7ac4e8';
  }

  private redrawFills(): void {
    if (!this.svg) {
      return;
    }

    this.svg
      .selectAll<SVGPathElement, SpainFeature>('path.ccaa')
      .attr('fill', (feature) => this.fillFor(feature));
  }

  private resolveCCAAFromLabel(label: string): ComunidadAutonoma | undefined {
    const normalizedLabel = this.norm(label);
    const list = this.state.comunidades().filter((item) => item.id !== '00');

    return (
      list.find((item) => this.norm(item.name) === normalizedLabel) ??
      list.find((item) => normalizedLabel.includes(this.norm(item.name))) ??
      list.find((item) => this.norm(item.name).includes(normalizedLabel))
    );
  }

  private getLabel(feature: SpainFeature): string {
    const properties = feature.properties ?? {};
    return String(properties['NAME_1'] ?? properties['name'] ?? properties['NAME'] ?? '');
  }

  private norm(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
  }

  private shortLabel(name: string): string {
    const labels: Record<string, string> = {
      Andalucía: 'Andalucía',
      Aragón: 'Aragón',
      'Principado de Asturias': 'Asturias',
      'Illes Balears': 'Baleares',
      Canarias: 'Canarias',
      Cantabria: 'Cantabria',
      'Castilla-La Mancha': 'C-La Mancha',
      'Castilla y León': 'C. y León',
      Cataluña: 'Cataluña',
      'Cataluña/Catalunya': 'Cataluña',
      Extremadura: 'Extremadura',
      Galicia: 'Galicia',
      'La Rioja': 'La Rioja',
      'Comunidad de Madrid': 'Madrid',
      'Región de Murcia': 'Murcia',
      'Comunidad Foral de Navarra': 'Navarra',
      'País Vasco': 'P. Vasco',
      'País Vasco/Euskadi': 'P. Vasco',
      'Comunitat Valenciana': 'Valencia',
      Ceuta: 'Ceuta',
      Melilla: 'Melilla',
      'Ciudad Autónoma de Ceuta': 'Ceuta',
      'Ciudad Autónoma de Melilla': 'Melilla',
    };

    return labels[name] ?? name.split('/')[0].split(' ').slice(0, 2).join(' ');
  }

  private setupResize(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }

      this.resizeTimer = setTimeout(() => {
        const wasZoomed = this.isZoomed;
        const selected = this.state.selectedCCAA();

        this.buildFullMap();

        if (wasZoomed && selected.id !== '00') {
          this.isZoomed = true;
          const selectedName = this.norm(selected.name);
          const key = [...this.screenBounds.keys()].find(
            (currentKey) =>
              currentKey === selectedName ||
              currentKey.includes(selectedName) ||
              selectedName.includes(currentKey)
          );

          if (key) {
            this.redrawFills();
            this.zoomToScreenBounds(key);
            this.showProvinces(key);
          }
        }
      }, 150);
    });

    this.resizeObserver.observe(this.wrapperRef.nativeElement);
  }
}
