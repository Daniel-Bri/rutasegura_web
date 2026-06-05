import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SolicitudService, SolicitudDisponible } from '../solicitud.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ver-solicitudes-disponibles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-solicitudes-disponibles.component.html',
  styleUrl: './ver-solicitudes-disponibles.component.css',
})
export class VerSolicitudesDisponiblesComponent implements OnInit, OnDestroy {
  items: SolicitudDisponible[] = [];
  loading = false;
  errorMsg = '';
  seleccion: SolicitudDisponible | null = null;
  bannerMsg: { tipo: 'ok' | 'error'; texto: string } | null = null;
  private _poll?: ReturnType<typeof setInterval>;

  constructor(
    private solicitudSvc: SolicitudService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this._poll = setInterval(() => this.cargar(true), 20000);
  }

  ngOnDestroy(): void { if (this._poll) clearInterval(this._poll); }

  cargar(silencioso = false): void {
    if (!silencioso) { this.loading = true; this.errorMsg = ''; this.cdr.detectChanges(); }
    this.solicitudSvc.listarDisponibles().subscribe({
      next: (data) => {
        this.items = data;
        if (this.seleccion)
          this.seleccion = data.find(d => d.incidente_id === this.seleccion!.incidente_id) ?? null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loading = false;
        this.errorMsg = e?.error?.detail ?? 'No se pudieron cargar las solicitudes.';
        this.cdr.detectChanges();
      },
    });
  }

  abrirDetalle(s: SolicitudDisponible): void { this.seleccion = s; }
  cerrarDetalle(): void { this.seleccion = null; }
  cerrarBanner(): void { this.bannerMsg = null; }

  /** Para solicitudes "invitado" → navega a generar cotización con el incidente pre-cargado */
  irACotizar(incidenteId: number): void {
    this.router.navigate(['/app/cotizacion-pagos/generar-cotizacion'], {
      queryParams: { incidente_id: incidenteId },
    });
  }

  estadoLabel(estado: string): string {
    const m: Record<string, string> = {
      invitado:      '📨 Invitado — cotizar',
      aceptado:      '✅ Cotización aceptada',
      en_camino:     '🚗 En camino',
      en_sitio:      '📍 En sitio',
      en_reparacion: '🔧 En reparación',
      finalizado:    '✔️ Finalizado',
      cancelado:     '❌ Cancelado',
      rechazado:     '🚫 No seleccionado',
    };
    return m[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    if (estado === 'invitado') return 'badge-warning';
    if (['aceptado','en_camino','en_sitio','en_reparacion'].includes(estado)) return 'badge-success';
    if (estado === 'finalizado') return 'badge-muted';
    return 'badge-danger';
  }

  prioridadClass(p: string): string {
    return p === 'alta' ? 'badge-danger' : p === 'media' ? 'badge-warning' : 'badge-muted';
  }

  prioridadLabel(p: string): string {
    return ({ alta: 'Alta', media: 'Media', baja: 'Baja' } as Record<string,string>)[p] ?? p;
  }

  fotoFullUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
