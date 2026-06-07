import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService, MiSolicitud, CalificacionPendiente, TallerCandidato } from '../solicitud.service';

@Component({
  selector: 'app-ver-estado-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ver-estado-solicitud.component.html',
})
export class VerEstadoSolicitudComponent implements OnInit, OnDestroy {
  items: MiSolicitud[] = [];
  loading = false;
  errorMsg = '';
  private _poll?: ReturnType<typeof setInterval>;
  modalCalificar = false;
  pendientesCalificacion: CalificacionPendiente[] = [];
  seleccionCalificacion: CalificacionPendiente | null = null;
  puntuacion = 5;
  resena = '';
  enviandoCalificacion = false;
  candidatos: Record<number, TallerCandidato[]> = {};

  constructor(private solicitudSvc: SolicitudService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this._poll = setInterval(() => this.cargar(true), 15000);
  }

  ngOnDestroy(): void {
    if (this._poll) clearInterval(this._poll);
  }

  cargar(silencioso = false): void {
    if (!silencioso) {
      this.loading = true;
      this.errorMsg = '';
    }
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
        if (!silencioso) this.cargarPendientesCalificacion();
        // CU39: cargar candidatos para incidentes pendientes
        for (const item of data) {
          if (item.incidente.estado === 'pendiente' && !this.candidatos[item.incidente.id]) {
            this.solicitudSvc.tallersCandidatos(item.incidente.id).subscribe({
              next: (cands) => { this.candidatos[item.incidente.id] = cands; this.cdr.detectChanges(); },
              error: () => {},
            });
          }
        }
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loading = false;
        this.errorMsg =
          e?.error?.detail ??
          (typeof e?.message === 'string' ? e.message : 'No se pudieron cargar las solicitudes.');
        this.cdr.detectChanges();
      },
    });
  }

  cargarPendientesCalificacion(): void {
    this.solicitudSvc.pendientesCalificacion().subscribe({
      next: (rows) => {
        this.pendientesCalificacion = rows;
        this.seleccionCalificacion = rows[0] ?? null;
        this.modalCalificar = rows.length > 0;
      },
      error: () => {
        // Silencioso para no bloquear CU10
      },
    });
  }

  cerrarModalCalificar(): void {
    this.modalCalificar = false;
  }

  enviarCalificacion(): void {
    if (!this.seleccionCalificacion || this.enviandoCalificacion) return;
    this.enviandoCalificacion = true;
    this.solicitudSvc
      .calificar(this.seleccionCalificacion.asignacion_id, this.puntuacion, this.resena.trim() || undefined)
      .subscribe({
        next: () => {
          this.enviandoCalificacion = false;
          this.resena = '';
          this.puntuacion = 5;
          this.cargarPendientesCalificacion();
        },
        error: (e) => {
          this.enviandoCalificacion = false;
          this.errorMsg = e?.error?.detail ?? 'No se pudo registrar la calificación.';
        },
      });
  }

  labelIncidente(e: string): string {
    const m: Record<string, string> = {
      pendiente: 'Pendiente',
      en_proceso: 'En proceso',
      resuelto: 'Atendido',
      cancelado: 'Cancelado',
    };
    return m[e] ?? e;
  }

  labelAsignacion(e: string): string {
    const m: Record<string, string> = {
      aceptado: 'Aceptado',
      en_camino: 'En camino',
      en_sitio: 'En sitio',
      en_reparacion: 'En reparación',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
    };
    return m[e] ?? e;
  }

  estrellas(r: number): string {
    return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  }

  badgeClass(estado: string): string {
    const m: Record<string, string> = {
      pendiente: 'badge-warning',
      en_proceso: 'badge-info',
      resuelto: 'badge-success',
      cancelado: 'badge-danger',
      aceptado: 'badge-info',
      en_camino: 'badge-info',
      en_sitio: 'badge-primary',
      en_reparacion: 'badge-primary',
      finalizado: 'badge-success',
    };
    return m[estado] ?? 'badge-muted';
  }
}
