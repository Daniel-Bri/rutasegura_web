import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../acceso-registro/auth.service';
import { ReportesService, KpisResponse } from '../reportes/reportes.service';

Chart.register(...registerables);

interface QuickLink { icon: string; label: string; route: string; bg: string; color: string; }

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- Bienvenida -->
    <div class="welcome-row">
      <div>
        <h1 class="page-title">Bienvenido, {{ userName }}</h1>
        <p class="page-sub">{{ roleLabel }} · RutaSegura</p>
      </div>
      <span class="role-badge">{{ roleLabel }}</span>
    </div>

    <!-- Accesos rápidos -->
    <p class="section-label">Accesos rápidos</p>
    <div class="quick-grid">
      @for (link of quickLinks; track link.route) {
        <a [routerLink]="link.route" class="quick-card">
          <div class="quick-icon" [style.background]="link.bg" [style.color]="link.color">
            <span class="material-symbols-outlined">{{ link.icon }}</span>
          </div>
          <span class="quick-label">{{ link.label }}</span>
        </a>
      }
    </div>

    <!-- KPIs completo para taller y admin -->
    @if (role === 'taller' || role === 'admin') {
      <div style="margin-top:32px">
        <!-- Encabezado KPIs + filtros -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
          <div>
            <p class="section-label" style="margin:0">Indicadores clave operacionales</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <input type="date" [(ngModel)]="desde"
              style="padding:6px 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:12px;color:#374151"/>
            <input type="date" [(ngModel)]="hasta"
              style="padding:6px 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:12px;color:#374151"/>
            <input *ngIf="role === 'admin'" type="number" [(ngModel)]="tenantId" placeholder="Tenant ID"
              style="padding:6px 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:12px;width:100px;color:#374151"/>
            <button (click)="cargarKpis()"
              style="padding:6px 14px;background:#1D4ED8;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">
              <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">refresh</span>
              Actualizar
            </button>
          </div>
        </div>

        <!-- Skeleton cargando -->
        @if (kpiCargando) {
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div style="height:80px;background:#F3F4F6;border-radius:12px;animation:pulse 1.5s ease-in-out infinite"></div>
            }
          </div>
        }

        <!-- Error -->
        @if (kpiError && !kpiCargando) {
          <div style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:10px;padding:12px 16px;color:#DC2626;font-size:13px;margin-bottom:16px">
            {{ kpiError }}
          </div>
        }

        @if (kpis && !kpiCargando) {

          <!-- Fila 1: Tarjetas numéricas -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px;margin-bottom:20px">

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" style="color:#2563EB">emergency</span>
              <div>
                <p class="kpi-val">{{ kpis.total_incidentes }}</p>
                <p class="kpi-lbl">Total incidentes</p>
              </div>
            </div>

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" style="color:#16A34A">task_alt</span>
              <div>
                <p class="kpi-val">{{ kpis.total_servicios_completados }}</p>
                <p class="kpi-lbl">Servicios completados</p>
              </div>
            </div>

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" style="color:#D97706">timer</span>
              <div>
                <p class="kpi-val">{{ kpis.tiempo_promedio_asignacion_min }}<span class="kpi-unit">min</span></p>
                <p class="kpi-lbl">Tiempo medio asignación</p>
              </div>
            </div>

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" style="color:#0891B2">directions_car</span>
              <div>
                <p class="kpi-val">{{ kpis.tiempo_promedio_llegada_min }}<span class="kpi-unit">min</span></p>
                <p class="kpi-lbl">Tiempo medio llegada</p>
              </div>
            </div>

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" style="color:#7C3AED">build_circle</span>
              <div>
                <p class="kpi-val">{{ kpis.tiempo_promedio_servicio_min }}<span class="kpi-unit">min</span></p>
                <p class="kpi-lbl">Tiempo medio servicio</p>
              </div>
            </div>

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" style="color:#EF4444">cancel</span>
              <div>
                <p class="kpi-val">{{ kpis.casos_cancelados_asignacion }}</p>
                <p class="kpi-lbl">Casos cancelados</p>
                <p style="margin:1px 0 0;font-size:10px;color:#9CA3AF">{{ kpis.casos_cancelados_incidente }} sin atender</p>
              </div>
            </div>

            <div class="kpi-card">
              <span class="material-symbols-outlined kpi-icon" [style.color]="slaColor()">verified</span>
              <div>
                <p class="kpi-val" [style.color]="slaColor()">{{ kpis.sla_compliance_pct }}%</p>
                <p class="kpi-lbl">Cumplimiento SLA</p>
                <p style="margin:1px 0 0;font-size:10px;color:#9CA3AF">≤ {{ kpis.sla_minutos }} min</p>
              </div>
            </div>

          </div>

          <!-- Fila 2: Gráficas -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:20px">

            <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.07)">
              <h3 style="margin:0 0 14px;font-size:14px;font-weight:700;color:#111827">Incidentes por tipo</h3>
              <canvas #chartTipos style="max-height:220px"></canvas>
            </div>

            <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.07)">
              <h3 style="margin:0 0 14px;font-size:14px;font-weight:700;color:#111827">Cumplimiento SLA</h3>
              <canvas #chartSLA style="max-height:220px"></canvas>
            </div>

          </div>

          <!-- Fila 3: Talleres eficientes -->
          @if (kpis.talleres_eficientes.length > 0) {
            <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.07);margin-bottom:20px">
              <h3 style="margin:0 0 14px;font-size:14px;font-weight:700;color:#111827">Talleres más eficientes (top 5)</h3>
              <canvas #chartEfic style="max-height:200px"></canvas>
            </div>
          }

          <!-- Fila 4: Zonas calientes -->
          @if (kpis.zonas_calientes.length > 0) {
            <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.07)">
              <h3 style="margin:0 0 14px;font-size:14px;font-weight:700;color:#111827">Zonas con más incidentes</h3>
              <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                  <tr style="border-bottom:2px solid #F3F4F6">
                    <th style="text-align:left;padding:7px 10px;color:#6B7280;font-weight:600">#</th>
                    <th style="text-align:left;padding:7px 10px;color:#6B7280;font-weight:600">Latitud</th>
                    <th style="text-align:left;padding:7px 10px;color:#6B7280;font-weight:600">Longitud</th>
                    <th style="text-align:right;padding:7px 10px;color:#6B7280;font-weight:600">Incidentes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let z of kpis.zonas_calientes; let i = index"
                    [style.background]="i % 2 === 0 ? 'white' : '#F9FAFB'">
                    <td style="padding:7px 10px;color:#6B7280">{{ i + 1 }}</td>
                    <td style="padding:7px 10px;color:#374151;font-family:monospace">{{ z.lat }}</td>
                    <td style="padding:7px 10px;color:#374151;font-family:monospace">{{ z.lon }}</td>
                    <td style="padding:7px 10px;text-align:right">
                      <span style="background:#DBEAFE;color:#1D4ED8;padding:2px 10px;border-radius:20px;font-weight:700">{{ z.total }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          }

        }
      </div>
    }
  `,
  styles: [`
    .welcome-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 2rem;
    }
    .page-title { font-size: 1.4rem; font-weight: 700; color: var(--text); margin: 0 0 0.25rem; }
    .page-sub   { color: #6B7280; font-size: 0.88rem; margin: 0; }
    .role-badge {
      background: #EFF6FF; color: var(--primary);
      font-size: 0.75rem; font-weight: 700;
      padding: 0.3rem 0.75rem; border-radius: 20px;
      white-space: nowrap; flex-shrink: 0;
    }

    .section-label {
      font-size: 0.78rem; font-weight: 700; color: #6B7280;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin: 0 0 1rem;
    }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }
    .quick-card {
      background: #fff; border-radius: 12px;
      padding: 1.4rem 1rem;
      display: flex; flex-direction: column; align-items: center; gap: 0.7rem;
      text-decoration: none;
      border: 1px solid #F3F4F6;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
      transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
    }
    .quick-card:hover {
      box-shadow: 0 4px 16px rgba(37,99,235,0.1);
      transform: translateY(-2px); border-color: #DBEAFE;
    }
    .quick-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .quick-label { font-size: 0.82rem; font-weight: 600; color: var(--text); text-align: center; }

    .kpi-card {
      background: #fff; border-radius: 12px;
      padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
      border: 1px solid #F3F4F6;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .kpi-icon { font-size: 26px; }
    .kpi-val  { margin: 0; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.2; }
    .kpi-lbl  { margin: 2px 0 0; font-size: 11px; color: #6B7280; }
    .kpi-unit { font-size: 12px; font-weight: 500; margin-left: 2px; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  `],
})
export class DashboardHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartTipos') chartTiposRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSLA')   chartSLARef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEfic')  chartEficRef!: ElementRef<HTMLCanvasElement>;

  kpis: KpisResponse | null = null;
  kpiCargando = false;
  kpiError = '';
  desde = '';
  hasta = '';
  tenantId: number | undefined;

  private charts: Chart[] = [];
  private kpisLoaded = false;

  constructor(
    private auth: AuthService,
    private reportesSvc: ReportesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.role === 'taller' || this.role === 'admin') {
      this.cargarKpis();
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  cargarKpis(): void {
    this.kpiCargando = true;
    this.kpiError = '';
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.kpisLoaded = false;

    const params: { desde?: string; hasta?: string; tenant_id?: number } = {};
    if (this.desde) params.desde = this.desde;
    if (this.hasta) params.hasta = this.hasta;
    if (this.tenantId) params.tenant_id = this.tenantId;

    this.reportesSvc.kpis(params).subscribe({
      next: (data) => {
        this.kpis = data;
        this.kpiCargando = false;
        this.kpisLoaded = true;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 80);
      },
      error: (e) => {
        this.kpiError = e?.error?.detail ?? 'Error al cargar KPIs';
        this.kpiCargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private renderCharts(): void {
    if (!this.kpis) return;

    if (this.chartTiposRef?.nativeElement) {
      const tipos  = this.kpis.incidentes_por_tipo;
      const labels = Object.keys(tipos).map(k => k.charAt(0).toUpperCase() + k.slice(1));
      const data   = Object.values(tipos);
      this.charts.push(new Chart(this.chartTiposRef.nativeElement, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: ['#3B82F6','#F59E0B','#EF4444','#10B981','#8B5CF6','#F97316'] }] },
        options: { plugins: { legend: { position: 'bottom' } }, responsive: true },
      }));
    }

    if (this.chartSLARef?.nativeElement) {
      const dentro = this.kpis.dentro_sla;
      const fuera  = this.kpis.total_servicios_completados - dentro;
      this.charts.push(new Chart(this.chartSLARef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: [`Dentro SLA (≤${this.kpis.sla_minutos} min)`, 'Fuera de SLA'],
          datasets: [{ data: [dentro, fuera], backgroundColor: ['#10B981', '#EF4444'] }],
        },
        options: { plugins: { legend: { position: 'bottom' } }, responsive: true },
      }));
    }

    if (this.chartEficRef?.nativeElement && this.kpis.talleres_eficientes.length > 0) {
      const nombres = this.kpis.talleres_eficientes.map(t => t.nombre);
      const tiempos = this.kpis.talleres_eficientes.map(t => t.tiempo_promedio_min);
      this.charts.push(new Chart(this.chartEficRef.nativeElement, {
        type: 'bar',
        data: { labels: nombres, datasets: [{ label: 'Tiempo promedio (min)', data: tiempos, backgroundColor: '#3B82F6', borderRadius: 6 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false } }, responsive: true, scales: { x: { beginAtZero: true } } },
      }));
    }
  }

  slaColor(): string {
    const p = this.kpis?.sla_compliance_pct ?? 0;
    return p >= 80 ? '#16A34A' : p >= 50 ? '#D97706' : '#EF4444';
  }

  get user()     { return this.auth.getUser(); }
  get userName() { return this.user?.full_name || this.user?.username || 'Usuario'; }
  get role()     { return this.user?.role ?? ''; }

  get roleLabel(): string {
    const map: Record<string, string> = {
      cliente: 'Cliente', taller: 'Taller', tecnico: 'Técnico', admin: 'Administrador',
    };
    return map[this.role] ?? this.role;
  }

  get quickLinks(): QuickLink[] {
    const all: Record<string, QuickLink[]> = {
      cliente: [
        { icon: 'warning_amber',    label: 'Reportar Emergencia', route: '/app/emergencias/adjuntar-fotos',                   bg: '#FEF2F2', color: '#EF4444' },
        { icon: 'directions_car',   label: 'Mis Vehículos',       route: '/app/acceso-registro/gestionar-vehiculos',           bg: '#EFF6FF', color: '#2563EB' },
        { icon: 'track_changes',    label: 'Mis Solicitudes',      route: '/app/solicitudes/ver-estado-solicitud',              bg: '#EFF6FF', color: '#2563EB' },
        { icon: 'chat',             label: 'Chat',                 route: '/app/comunicacion/chat',                            bg: '#ECFDF5', color: '#16A34A' },
      ],
      taller: [
        { icon: 'assignment',       label: 'Ver Solicitudes',      route: '/app/solicitudes/ver-solicitudes-disponibles',       bg: '#EFF6FF', color: '#2563EB' },
        { icon: 'build',            label: 'Estado Servicio',      route: '/app/talleres-tecnicos/actualizar-estado-servicio',  bg: '#FEF2F2', color: '#EF4444' },
        { icon: 'people',           label: 'Técnicos',             route: '/app/talleres-tecnicos/gestionar-tecnicos',          bg: '#ECFDF5', color: '#16A34A' },
        { icon: 'receipt_long',     label: 'Cotizaciones',         route: '/app/cotizacion-pagos/generar-cotizacion',           bg: '#F5F3FF', color: '#7C3AED' },
        { icon: 'chat',             label: 'Chat',                 route: '/app/comunicacion/chat',                            bg: '#ECFDF5', color: '#16A34A' },
        { icon: 'bar_chart',        label: 'Reporte Taller',       route: '/app/reportes/metricas-taller',                     bg: '#FFF7ED', color: '#D97706' },
      ],
      tecnico: [
        { icon: 'build',            label: 'Estado Servicio',      route: '/app/talleres-tecnicos/actualizar-estado-servicio',  bg: '#EFF6FF', color: '#2563EB' },
        { icon: 'chat',             label: 'Chat',                 route: '/app/comunicacion/chat',                            bg: '#ECFDF5', color: '#16A34A' },
        { icon: 'task_alt',         label: 'Registrar Servicio',   route: '/app/talleres-tecnicos/registrar-servicio-realizado',bg: '#FEF2F2', color: '#EF4444' },
        { icon: 'notifications',    label: 'Notificaciones',       route: '/app/comunicacion/notificaciones',                  bg: '#F5F3FF', color: '#7C3AED' },
      ],
      admin: [
        { icon: 'verified',         label: 'Aprobar Talleres',     route: '/app/acceso-registro/aprobar-talleres',              bg: '#ECFDF5', color: '#16A34A' },
        { icon: 'manage_accounts',  label: 'Gestionar Usuarios',   route: '/app/acceso-registro/gestionar-usuarios',            bg: '#EFF6FF', color: '#2563EB' },
        { icon: 'policy',           label: 'Auditoría',            route: '/app/reportes/auditoria',                           bg: '#FEF2F2', color: '#EF4444' },
        { icon: 'bar_chart',        label: 'Reporte Global',       route: '/app/reportes/metricas-globales',                   bg: '#F5F3FF', color: '#7C3AED' },
      ],
    };
    return all[this.role] ?? [];
  }
}
