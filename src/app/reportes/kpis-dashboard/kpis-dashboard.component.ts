import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ReportesService, KpisResponse } from '../reportes.service';
import { AuthService } from '../../acceso-registro/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-kpis-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpis-dashboard.component.html',
})
export class KpisDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartTipos')    chartTiposRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSLA')      chartSLARef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEfic')     chartEficRef!: ElementRef<HTMLCanvasElement>;

  kpis: KpisResponse | null = null;
  cargando = true;
  error = '';
  role = '';

  desde = '';
  hasta = '';
  tenantId: number | undefined;

  private charts: Chart[] = [];

  constructor(
    private svc: ReportesService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const u = this.auth.getUser();
    this.role = u?.role ?? '';
    this.cargar();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const params: { desde?: string; hasta?: string; tenant_id?: number } = {};
    if (this.desde) params.desde = this.desde;
    if (this.hasta) params.hasta = this.hasta;
    if (this.tenantId) params.tenant_id = this.tenantId;

    this.svc.kpis(params).subscribe({
      next: (data) => {
        this.kpis = data;
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 50);
      },
      error: (e) => {
        this.error = e?.error?.detail ?? 'Error al cargar KPIs';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private renderCharts(): void {
    if (!this.kpis) return;

    // ── Gráfica 1: Incidentes por tipo (dona) ──────────────
    if (this.chartTiposRef?.nativeElement) {
      const tipos = this.kpis.incidentes_por_tipo;
      const labels = Object.keys(tipos).map(k => k.charAt(0).toUpperCase() + k.slice(1));
      const data   = Object.values(tipos);
      const c = new Chart(this.chartTiposRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: ['#3B82F6','#F59E0B','#EF4444','#10B981','#8B5CF6','#F97316'] }],
        },
        options: { plugins: { legend: { position: 'bottom' } }, responsive: true },
      });
      this.charts.push(c);
    }

    // ── Gráfica 2: SLA compliance (dona) ───────────────────
    if (this.chartSLARef?.nativeElement) {
      const dentro = this.kpis.dentro_sla;
      const fuera  = this.kpis.total_servicios_completados - dentro;
      const c = new Chart(this.chartSLARef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: [`Dentro SLA (≤${this.kpis.sla_minutos} min)`, 'Fuera de SLA'],
          datasets: [{ data: [dentro, fuera], backgroundColor: ['#10B981', '#EF4444'] }],
        },
        options: { plugins: { legend: { position: 'bottom' } }, responsive: true },
      });
      this.charts.push(c);
    }

    // ── Gráfica 3: Talleres eficientes (barras) ─────────────
    if (this.chartEficRef?.nativeElement && this.kpis.talleres_eficientes.length > 0) {
      const nombres = this.kpis.talleres_eficientes.map(t => t.nombre);
      const tiempos = this.kpis.talleres_eficientes.map(t => t.tiempo_promedio_min);
      const c = new Chart(this.chartEficRef.nativeElement, {
        type: 'bar',
        data: {
          labels: nombres,
          datasets: [{
            label: 'Tiempo promedio (min)',
            data: tiempos,
            backgroundColor: '#3B82F6',
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          responsive: true,
          scales: { x: { beginAtZero: true } },
        },
      });
      this.charts.push(c);
    }
  }

  tiposLabels(): string[] {
    return this.kpis ? Object.keys(this.kpis.incidentes_por_tipo) : [];
  }

  slaColor(): string {
    const p = this.kpis?.sla_compliance_pct ?? 0;
    return p >= 80 ? '#10B981' : p >= 50 ? '#F59E0B' : '#EF4444';
  }
}
