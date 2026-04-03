import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { AppStateService } from '../../services/app-state.service';

declare const d3CompositeProjections: any;

@Component({
  selector: 'app-spain-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper" #wrapperRef>
      @if (isLoading) {
        <div class="map-loading"><div class="spinner"></div><span>Cargando mapa…</span></div>
      }
      <svg #svgRef class="map-svg"></svg>
      @if (isZoomed) {
        <button class="back-btn" (click)="zoomOut()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Ver toda España
        </button>
      }
      <div class="map-tooltip" [class.visible]="tooltip.visible"
           [style.left.px]="tooltip.x" [style.top.px]="tooltip.y">
        {{ tooltip.name }}
      </div>
    </div>
  `,
  styles: [`
    .map-wrapper { position: relative; width: 100%; overflow: hidden; }
    .map-svg { display: block; width: 100%; height: auto; }
    .map-loading {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; gap: 8px; color: var(--sky-600); font-size: 13px;
      background: rgba(200,230,247,0.6); z-index: 5;
    }
    .spinner {
      width: 20px; height: 20px; border: 2px solid var(--sky-200);
      border-top-color: var(--sky-600); border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .back-btn {
      position: absolute; top: 12px; left: 14px;
      display: flex; align-items: center; gap: 7px;
      background: rgba(2,116,184,0.92); color: white;
      border: none; border-radius: 22px; padding: 7px 16px 7px 11px;
      font-size: 12px; font-weight: 600; font-family: var(--font-primary), system-ui;
      cursor: pointer; z-index: 20; box-shadow: 0 3px 12px rgba(2,80,140,0.3);
      animation: slideIn 0.22s ease both; transition: background 0.14s;
    }
    .back-btn:hover { background: rgba(2,96,160,1); }
    @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
    .map-tooltip {
      position: absolute; background: rgba(5,30,58,0.90); color: white;
      font-size: 12px; font-weight: 500; padding: 5px 12px; border-radius: 20px;
      pointer-events: none; opacity: 0; transition: opacity 0.12s; white-space: nowrap;
      transform: translate(-50%, -140%); z-index: 20;
    }
    .map-tooltip.visible { opacity: 1; }
  `]
})
export class SpainMapComponent implements OnInit, OnDestroy {
  @ViewChild('svgRef',     { static: true }) svgRef!:     ElementRef<SVGSVGElement>;
  @ViewChild('wrapperRef', { static: true }) wrapperRef!: ElementRef<HTMLDivElement>;

  private state = inject(AppStateService);
  private zone  = inject(NgZone);

  isLoading = true;
  isZoomed  = false;
  tooltip   = { visible: false, x: 0, y: 0, name: '' };

  private svg!:     d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private projFull!: any; // full-Spain projection
  private pathFull!: d3.GeoPath;
  private W = 0; private H = 0;

  private topoCC:   Topology | null = null;
  private topoProv: Topology | null = null;

  // Map from normalised CCAA name → TopoJSON feature (for zoom)
  private ccaaFeatureMap = new Map<string, any>();
  // Map from normalised CCAA name → province features
  private provFeatureMap = new Map<string, any[]>();

  private resizeObserver?: ResizeObserver;
  private resizeTimer?: ReturnType<typeof setTimeout>;

  async ngOnInit() {
    await this.loadLib();
    [this.topoCC, this.topoProv] = await Promise.all([
      this.fetchTopo('https://unpkg.com/es-atlas@0.5.0/es/autonomous_regions.json'),
      this.fetchTopo('https://unpkg.com/es-atlas@0.5.0/es/provinces.json'),
    ]);
    this.indexFeatures();
    this.buildMap();
    this.setupResize();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    clearTimeout(this.resizeTimer);
  }

  zoomOut(): void {
    this.isZoomed = false;
    const todas = this.state.comunidades().find(c => c.id === '00');
    if (todas) this.state.selectCCAA(todas);
    this.zone.run(() => {
      this.rebuildWithProjection(null); // null = use full Spain projection
    });
  }

  // ── Load d3-composite-projections ─────────────────────────────────────────
  private loadLib(): Promise<void> {
    return new Promise(resolve => {
      if (typeof d3CompositeProjections !== 'undefined') { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/d3-composite-projections@1.4.0/dist/d3-composite-projections.min.js';
      s.onload = s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }

  private async fetchTopo(url: string): Promise<Topology | null> {
    try { return await d3.json<Topology>(url) ?? null; } catch { return null; }
  }

  // ── Index features by normalised CCAA name ─────────────────────────────────
  private indexFeatures(): void {
    if (!this.topoCC) return;

    const ccaaGeo = topojson.feature(
      this.topoCC, (this.topoCC as any).objects.autonomous_regions as GeometryCollection
    );

    (ccaaGeo as any).features.forEach((f: any) => {
      const name = this.ccaaLabel(f);
      this.ccaaFeatureMap.set(this.norm(name), f);
    });

    // Index provinces: group by the CCAA they belong to using the province code prefix
    if (!this.topoProv) return;
    const provGeo = topojson.feature(
      this.topoProv, (this.topoProv as any).objects.provinces as GeometryCollection
    );

    // Log first province properties to understand the data structure
    const firstProv = (provGeo as any).features[0];
    console.log('[MAP] Province properties sample:', firstProv?.properties);

    // Build a mapping: for each province feature, find which CCAA it belongs to
    // by checking if the province centroid (geographic) falls within any CCAA
    // We use the code prefix: province codes are 2-digit INE codes
    // CCAA INE codes: 01=AND,02=ARA,03=AST,04=BAL,05=CAN,06=CNT,07=CLM,08=CYL,
    //                 09=CAT,10=EXT,11=GAL,12=?,13=MAD,14=MUR,15=NAV,16=PV,17=RIO,18=VAL
    const provinceToCC: Record<string, string> = {
      '04':'01','11':'01','14':'01','18':'01','21':'01','23':'01','29':'01','41':'01', // Andalucía
      '22':'02','44':'02','50':'02', // Aragón
      '33':'03',                    // Asturias
      '07':'04',                    // Baleares
      '35':'05','38':'05',          // Canarias
      '39':'06',                    // Cantabria
      '02':'07','13':'07','16':'07','19':'07','45':'07', // C-La Mancha
      '05':'08','09':'08','24':'08','34':'08','37':'08','40':'08','42':'08','47':'08','49':'08', // CyL
      '08':'09','17':'09','25':'09','43':'09', // Cataluña
      '06':'10','10':'10',          // Extremadura
      '15':'11','27':'11','32':'11','36':'11', // Galicia
      '28':'13',                    // Madrid
      '30':'14',                    // Murcia
      '31':'15',                    // Navarra
      '01':'16','20':'16','48':'16', // País Vasco
      '26':'17',                    // La Rioja
      '03':'18','12':'18','46':'18', // Valencia
      '51':'19',                    // Ceuta
      '52':'20',                    // Melilla
    };

    // Reverse: CCAA code → list of province features
    const ccaaCodeToName: Record<string, string> = {
      '01':'Andalucía','02':'Aragón','03':'Principado de Asturias',
      '04':'Illes Balears','05':'Canarias','06':'Cantabria',
      '07':'Castilla-La Mancha','08':'Castilla y León','09':'Cataluña',
      '10':'Extremadura','11':'Galicia','13':'Comunidad de Madrid',
      '14':'Región de Murcia','15':'Comunidad Foral de Navarra',
      '16':'País Vasco','17':'La Rioja','18':'Comunitat Valenciana',
      '19':'Ceuta','20':'Melilla',
    };

    (provGeo as any).features.forEach((f: any) => {
      // Try to get province code from properties
      const rawCode = String(
        f.properties?.code ?? f.properties?.CODE ??
        f.properties?.cpro ?? f.properties?.CPRO ?? ''
      ).padStart(2, '0');

      const ccaaCode = provinceToCC[rawCode];
      if (!ccaaCode) return;

      const ccaaName = ccaaCodeToName[ccaaCode];
      if (!ccaaName) return;

      const key = this.norm(ccaaName);
      if (!this.provFeatureMap.has(key)) this.provFeatureMap.set(key, []);
      this.provFeatureMap.get(key)!.push(f);
    });

    console.log('[MAP] Province groups:', [...this.provFeatureMap.keys()]);
  }

  // ── Build overview map ─────────────────────────────────────────────────────
  private buildMap(): void {
    this.rebuildWithProjection(null);
  }

  /**
   * Rebuild the SVG.
   * @param zoomFeature If null: draw full Spain (composite proj).
   *                    If a GeoJSON feature: zoom to that feature using
   *                    a fresh mercator projection fitted to its bounding box.
   */
  private rebuildWithProjection(zoomFeature: any | null): void {
    this.isLoading = true;
    if (!this.topoCC) { this.isLoading = false; return; }

    const wrapper = this.wrapperRef.nativeElement;
    this.W = Math.max(wrapper.clientWidth, 400);
    this.H = Math.round(this.W * 0.65);

    this.svg = d3.select(this.svgRef.nativeElement)
      .attr('viewBox', `0 0 ${this.W} ${this.H}`)
      .attr('width',   this.W)
      .attr('height',  this.H);

    this.svg.selectAll('*').remove();

    const padX = Math.round(this.W * 0.04);
    const padY = Math.round(this.H * 0.04);

    let proj: any;
    let pathFn: d3.GeoPath;
    const ccaaGeo = topojson.feature(
      this.topoCC!, (this.topoCC as any).objects.autonomous_regions as GeometryCollection
    );

    if (!zoomFeature) {
      // ── OVERVIEW: use composite projection for Canarias placement ──────
      const useComposite =
        typeof d3CompositeProjections !== 'undefined' &&
        typeof d3CompositeProjections.geoConicConformalSpain === 'function';

      proj = useComposite
        ? d3CompositeProjections.geoConicConformalSpain()
        : d3.geoConicConformal().center([-3.7, 40.2]).rotate([0, 0]).parallels([36, 44]);

      proj.fitSize([this.W - padX*2, this.H - padY*2], ccaaGeo);
      proj.translate([proj.translate()[0] + padX, proj.translate()[1] + padY]);
      this.projFull = proj;
      pathFn = d3.geoPath(proj);
      this.pathFull = pathFn;
    } else {
      // ── ZOOM: use mercator fitted to this specific feature ─────────────
      // This avoids the composite projection repositioning issue
      proj = d3.geoMercator();
      proj.fitExtent([[padX*3, padY*3], [this.W - padX*3, this.H - padY*3]], zoomFeature);
      pathFn = d3.geoPath(proj);
    }

    // ── Draw CCAA regions ───────────────────────────────────────────────
    this.svg.append('g').attr('class', 'ccaa-layer')
      .selectAll<SVGPathElement, any>('path.ccaa')
      .data((ccaaGeo as any).features)
      .join('path')
      .attr('class',  'ccaa')
      .attr('d',      pathFn as any)
      .attr('fill',   f => this.fillForCCAA(f))
      .attr('stroke', 'white')
      .attr('stroke-width', 0.8)
      .attr('stroke-linejoin', 'round')
      .style('cursor', 'pointer')
      .on('mouseenter', (ev: MouseEvent, f: any) => {
        if (!this.isCCAASelected(f)) {
          d3.select(ev.currentTarget as Element).attr('fill', '#3a9fd4');
        }
        const rect = wrapper.getBoundingClientRect();
        this.zone.run(() => {
          this.tooltip = { visible: true, x: ev.clientX - rect.left, y: ev.clientY - rect.top, name: this.ccaaLabel(f) };
        });
      })
      .on('mousemove', (ev: MouseEvent) => {
        const rect = wrapper.getBoundingClientRect();
        this.tooltip.x = ev.clientX - rect.left;
        this.tooltip.y = ev.clientY - rect.top;
      })
      .on('mouseleave', (ev: MouseEvent, f: any) => {
        d3.select(ev.currentTarget as Element).attr('fill', this.fillForCCAA(f));
        this.zone.run(() => { this.tooltip = { ...this.tooltip, visible: false }; });
      })
      .on('click', (_ev: MouseEvent, f: any) => {
        const label    = this.ccaaLabel(f);
        const resolved = this.resolveCCAA(label);
        if (!resolved || resolved.id === '00') return;

        // Get this exact feature from our map (no fuzzy name issues)
        const feature = this.ccaaFeatureMap.get(this.norm(label));

        this.zone.run(() => {
          this.tooltip  = { ...this.tooltip, visible: false };
          this.isZoomed = true;
          this.state.selectCCAA(resolved);
          // Rebuild with zoom projection centred on this feature
          this.rebuildWithProjection(feature ?? f);
        });
      });

    // ── Draw province borders (only when zoomed) ──────────────────────────
    if (zoomFeature && this.topoProv) {
      const labelKey = this.getSelectedCCAAKey();
      const provs    = this.provFeatureMap.get(labelKey) ?? [];

      if (provs.length > 0) {
        const provPath = d3.geoPath(proj);
        this.svg.append('g').attr('class', 'prov-layer')
          .selectAll<SVGPathElement, any>('path.prov')
          .data(provs)
          .join('path')
          .attr('class',  'prov')
          .attr('d',      provPath as any)
          .attr('fill',   'none')
          .attr('stroke', 'rgba(255,255,255,0.75)')
          .attr('stroke-width', 1.2)
          .attr('pointer-events', 'none');
      }
    }

    // ── Composition borders (only on overview) ───────────────────────────
    if (!zoomFeature && typeof proj.getCompositionBorders === 'function') {
      this.svg.append('path')
        .attr('d', proj.getCompositionBorders())
        .attr('fill', 'none').attr('stroke', '#7ab8d9')
        .attr('stroke-width', 0.8).attr('stroke-dasharray', '4,3').attr('opacity', 0.6);
    }

    // ── Labels ────────────────────────────────────────────────────────────
    const fs = zoomFeature
      ? Math.max(10, Math.round(this.W / 60))   // larger when zoomed
      : Math.max(7,  Math.round(this.W / 115));  // smaller on overview

    this.svg.append('g').attr('class', 'labels')
      .selectAll('text')
      .data((ccaaGeo as any).features)
      .join('text')
      .attr('transform', (f: any) => {
        const c = pathFn.centroid(f);
        return c && isFinite(c[0]) ? `translate(${c})` : 'translate(-999,-999)';
      })
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', fs)
      .attr('font-family', 'var(--font-primary), system-ui, sans-serif')
      .attr('font-weight', '500')
      .attr('fill', 'rgba(255,255,255,0.88)')
      .attr('pointer-events', 'none')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'rgba(2,80,140,0.30)')
      .attr('stroke-width', fs * 0.4)
      .text((f: any) => this.shortLabel(this.ccaaLabel(f)));

    this.isLoading = false;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private getSelectedCCAAKey(): string {
    return this.norm(this.state.selectedCCAA().name);
  }

  private isCCAASelected(f: any): boolean {
    const sel = this.state.selectedCCAA();
    if (sel.id === '00') return false;
    // Exact match by normalised name
    const rn = this.norm(this.ccaaLabel(f));
    const sn = this.norm(sel.name);
    return rn === sn || rn.includes(sn) || sn.includes(rn);
  }

  private fillForCCAA(f: any): string {
    return this.isCCAASelected(f) ? '#0274b8' : '#7ac4e8';
  }

  /**
   * Resolve a TopoJSON region label to a ComunidadAutonoma from state.
   * Uses EXACT normalised match first, then single-direction includes.
   */
  private resolveCCAA(label: string) {
    const rl = this.norm(label);
    const comunidades = this.state.comunidades().filter(c => c.id !== '00');

    // 1. Exact match
    let found = comunidades.find(c => this.norm(c.name) === rl);
    if (found) return found;

    // 2. TopoJSON name contains our name (e.g. "País Vasco/Euskadi" contains "País Vasco")
    found = comunidades.find(c => rl.includes(this.norm(c.name)));
    if (found) return found;

    // 3. Our name contains TopoJSON name (e.g. "Principado de Asturias" contains "Asturias")
    found = comunidades.find(c => this.norm(c.name).includes(rl));
    return found;
  }

  private ccaaLabel(f: any): string {
    return f.properties?.NAME_1 ?? f.properties?.name ?? f.properties?.NAME ?? '';
  }

  private shortLabel(name: string): string {
    const M: Record<string,string> = {
      'Andalucía':'Andalucía','Aragón':'Aragón',
      'Principado de Asturias':'Asturias','Illes Balears':'Baleares',
      'Canarias':'Canarias','Cantabria':'Cantabria',
      'Castilla-La Mancha':'C-La Mancha','Castilla y León':'C. y León',
      'Cataluña':'Cataluña','Cataluña/Catalunya':'Cataluña',
      'Extremadura':'Extremadura','Galicia':'Galicia','La Rioja':'La Rioja',
      'Comunidad de Madrid':'Madrid','Región de Murcia':'Murcia',
      'Comunidad Foral de Navarra':'Navarra',
      'País Vasco':'P. Vasco','País Vasco/Euskadi':'P. Vasco',
      'Comunitat Valenciana':'Valencia',
      'Ciudad Autónoma de Ceuta':'Ceuta','Ciudad Autónoma de Melilla':'Melilla',
      'Ceuta':'Ceuta','Melilla':'Melilla',
    };
    return M[name] ?? name.split('/')[0].split(' ').slice(0,2).join(' ');
  }

  private norm(name: string): string {
    return name.toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z\s]/g,'').trim();
  }

  private setupResize(): void {
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        const sel = this.state.selectedCCAA();
        if (this.isZoomed && sel.id !== '00') {
          const feature = this.ccaaFeatureMap.get(this.norm(sel.name))
            ?? [...this.ccaaFeatureMap.entries()]
               .find(([k]) => k.includes(this.norm(sel.name)) || this.norm(sel.name).includes(k))
               ?.[1];
          this.rebuildWithProjection(feature ?? null);
        } else {
          this.isZoomed = false;
          this.buildMap();
        }
      }, 150);
    });
    this.resizeObserver.observe(this.wrapperRef.nativeElement);
  }
}
