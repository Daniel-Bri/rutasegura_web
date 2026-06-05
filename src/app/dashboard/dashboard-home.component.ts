import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../acceso-registro/auth.service';
import { ReportesService, KpisResponse } from '../reportes/reportes.service';

interface QuickLink { icon: string; label: string; route: string; bg: string; color: string; }

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Bienvenida -->
    <div class="welcome-row">
      <div>
        <h1 class="page-title">Bienvenido, {{ userName }}</h1>
        <p class="page-sub">{{ roleLabel }} · RutaSegura</p>
      </div>
      <span class="role-badge">{{ roleLabel }}</span>
    </div>

    <!-- KPIs rápidos para taller y admin -->
    @if ((role === 'taller' || role === 'admin') && kpis) {
      <p class="section-label">Indicadores clave</p>
      <div class="kpi-grid">
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
            <p class="kpi-val">{{ kpis.tiempo_promedio_asignacion_min }} <span style="font-size:13px;font-weight:500">min</span></p>
            <p class="kpi-lbl">Tiempo medio asignación</p>
          </div>
        </div>
        <div class="kpi-card">
          <span class="material-symbols-outlined kpi-icon" style="color:#7C3AED">build_circle</span>
          <div>
            <p class="kpi-val">{{ kpis.tiempo_promedio_servicio_min }} <span style="font-size:13px;font-weight:500">min</span></p>
            <p class="kpi-lbl">Tiempo medio servicio</p>
          </div>
        </div>
        <div class="kpi-card">
          <span class="material-symbols-outlined kpi-icon" style="color:#EF4444">cancel</span>
          <div>
            <p class="kpi-val">{{ kpis.casos_cancelados_asignacion }}</p>
            <p class="kpi-lbl">Casos cancelados</p>
          </div>
        </div>
        <div class="kpi-card">
          <span class="material-symbols-outlined kpi-icon" [style.color]="slaColor()">verified</span>
          <div>
            <p class="kpi-val" [style.color]="slaColor()">{{ kpis.sla_compliance_pct }}%</p>
            <p class="kpi-lbl">Cumplimiento SLA</p>
          </div>
        </div>
      </div>
    }
    @if ((role === 'taller' || role === 'admin') && kpiCargando) {
      <div style="display:flex;gap:12px;margin-bottom:24px">
        @for (i of [1,2,3,4,5,6]; track i) {
          <div style="flex:1;height:80px;background:#F3F4F6;border-radius:12px;animation:pulse 1.5s ease-in-out infinite"></div>
        }
      </div>
    }

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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px; margin-bottom: 24px;
    }
    .kpi-card {
      background: #fff; border-radius: 12px;
      padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
      border: 1px solid #F3F4F6;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .kpi-icon { font-size: 28px; }
    .kpi-val  { margin: 0; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.2; }
    .kpi-lbl  { margin: 2px 0 0; font-size: 11px; color: #6B7280; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  `],
})
export class DashboardHomeComponent implements OnInit {
  kpis: KpisResponse | null = null;
  kpiCargando = false;

  constructor(
    private auth: AuthService,
    private reportesSvc: ReportesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.role === 'taller' || this.role === 'admin') {
      this.kpiCargando = true;
      this.reportesSvc.kpis().subscribe({
        next: (data) => { this.kpis = data; this.kpiCargando = false; this.cdr.detectChanges(); },
        error: ()     => { this.kpiCargando = false; this.cdr.detectChanges(); },
      });
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
        { icon: 'monitoring',       label: 'KPIs Dashboard',       route: '/app/reportes/kpis-dashboard',                      bg: '#EFF6FF', color: '#1D4ED8' },
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
        { icon: 'monitoring',       label: 'KPIs Dashboard',       route: '/app/reportes/kpis-dashboard',                      bg: '#EFF6FF', color: '#1D4ED8' },
      ],
    };
    return all[this.role] ?? [];
  }
}
