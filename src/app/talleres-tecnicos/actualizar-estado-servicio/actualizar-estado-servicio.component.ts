import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TecnicoService, AsignacionResponse } from '../tecnico.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { DataCacheService } from '../../core/services/data-cache.service';

interface EstadoInfo {
  label: string;
  badgeClass: string;
  icon: string;
}

const ESTADO_INFO: Record<string, EstadoInfo> = {
  aceptado:      { label: 'Aceptado',       badgeClass: 'badge-warning',  icon: 'check_circle'    },
  en_camino:     { label: 'En camino',      badgeClass: 'badge-primary',  icon: 'directions_car'  },
  en_sitio:      { label: 'En sitio',       badgeClass: 'badge-purple',   icon: 'location_on'     },
  en_reparacion: { label: 'En reparación',  badgeClass: 'badge-orange',   icon: 'build'           },
  finalizado:    { label: 'Finalizado',     badgeClass: 'badge-success',  icon: 'task_alt'        },
  cancelado:     { label: 'Cancelado',      badgeClass: 'badge-danger',   icon: 'cancel'          },
};

// en_sitio es confirmado por el cliente (CU31) en el caso normal.
// El taller puede usarlo como fallback si el cliente no tiene señal (ej. SOS).
const TRANSICIONES: Record<string, string[]> = {
  aceptado:      ['en_camino', 'cancelado'],
  en_camino:     ['en_sitio',  'cancelado'],
  en_sitio:      ['en_reparacion'],
  en_reparacion: ['finalizado'],
};

const PASOS = ['aceptado', 'en_camino', 'en_sitio', 'en_reparacion', 'finalizado'];

@Component({
  selector: 'app-actualizar-estado-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actualizar-estado-servicio.component.html',
})
export class ActualizarEstadoServicioComponent implements OnInit {

  asignaciones: AsignacionResponse[] = [];
  loading  = false;
  errorMsg = '';

  // Por asignación: estado seleccionado, observación, cargando, mensaje
  estadoSel:  Record<number, string>                              = {};
  obsTexto:   Record<number, string>                             = {};
  procesando: Record<number, boolean>                            = {};
  mensajeFila: Record<number, { tipo: 'ok'|'error'; texto: string }> = {};

  // Cobro por visita
  cobroVisitaId:  number | null = null;
  cobroMonto:     number | null = null;
  cobroConcepto:  string        = 'Cobro por desplazamiento al sitio';
  cobrandoVisita  = false;
  cobroError      = '';
  cobroExito      = false;

  readonly estadoInfo   = ESTADO_INFO;
  readonly transiciones = TRANSICIONES;
  readonly pasos        = PASOS;

  constructor(
    private svc: TecnicoService,
    private cdr: ChangeDetectorRef,
    private offlineQueue: OfflineQueueService,
    private cache: DataCacheService,
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading  = true;
    this.errorMsg = '';
    this.cache.get('asignaciones-activas', 30_000, () => this.svc.listarActivas()).subscribe({
      next: (data) => {
        this.asignaciones = data;
        data.forEach((a) => {
          const opts = TRANSICIONES[a.estado] ?? [];
          this.estadoSel[a.id] = opts[0] ?? '';
          this.obsTexto[a.id]  = '';
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'Error al cargar asignaciones';
        this.loading  = false;
        this.cdr.detectChanges();
      },
    });
  }

  opcionesTransicion(estado: string): string[] {
    return TRANSICIONES[estado] ?? [];
  }

  guardar(a: AsignacionResponse): void {
    const nuevoEstado = this.estadoSel[a.id];
    if (!nuevoEstado) return;
    this.procesando[a.id] = true;
    delete this.mensajeFila[a.id];

    if (!this.offlineQueue.isOnline) {
      this.offlineQueue.encolar(
        `/api/talleres/asignaciones/${a.id}/estado`,
        'PATCH',
        { estado: nuevoEstado, observacion: this.obsTexto[a.id] || undefined },
        `Cambiar estado asignación #${a.id} → ${ESTADO_INFO[nuevoEstado]?.label ?? nuevoEstado}`,
      );
      this.mensajeFila[a.id] = { tipo: 'ok', texto: '📶 Sin conexión — se sincronizará cuando vuelva internet' };
      this.procesando[a.id]  = false;
      this.cdr.detectChanges();
      setTimeout(() => { delete this.mensajeFila[a.id]; this.cdr.detectChanges(); }, 4000);
      return;
    }

    this.svc.actualizarEstado(a.id, nuevoEstado, this.obsTexto[a.id] || undefined).subscribe({
      next: (actualizada) => {
        const idx = this.asignaciones.findIndex((x) => x.id === actualizada.id);
        if (idx !== -1) this.asignaciones[idx] = actualizada;
        const activos = ['aceptado', 'en_camino', 'en_sitio', 'en_reparacion'];
        if (!activos.includes(actualizada.estado)) {
          setTimeout(() => {
            this.asignaciones = this.asignaciones.filter((x) => x.id !== actualizada.id);
            this.cdr.detectChanges();
          }, 2500);
        } else {
          const opts = TRANSICIONES[actualizada.estado] ?? [];
          this.estadoSel[actualizada.id] = opts[0] ?? '';
          this.obsTexto[actualizada.id]  = '';
        }
        this.cache.invalidate('asignaciones-activas');
        this.mensajeFila[a.id] = { tipo: 'ok', texto: `Estado actualizado a: ${ESTADO_INFO[actualizada.estado]?.label}` };
        this.procesando[a.id]  = false;
        this.cdr.detectChanges();
        setTimeout(() => { delete this.mensajeFila[a.id]; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.mensajeFila[a.id] = { tipo: 'error', texto: err.error?.detail ?? 'Error al actualizar' };
        this.procesando[a.id]  = false;
        this.cdr.detectChanges();
      },
    });
  }

  pasoIndex(estado: string): number { return PASOS.indexOf(estado); }

  abrirCobroVisita(asignacionId: number): void {
    this.cobroVisitaId = asignacionId;
    this.cobroMonto    = null;
    this.cobroConcepto = 'Cobro por desplazamiento al sitio';
    this.cobroError    = '';
    this.cobroExito    = false;
    this.cdr.detectChanges();
  }

  cerrarCobroVisita(): void {
    this.cobroVisitaId = null;
    this.cdr.detectChanges();
  }

  registrarCobroVisita(): void {
    if (!this.cobroVisitaId || !this.cobroMonto || this.cobroMonto <= 0) {
      this.cobroError = 'Ingresa un monto válido mayor a 0';
      this.cdr.detectChanges();
      return;
    }
    this.cobrandoVisita = true;
    this.cobroError     = '';
    this.svc.registrarCobroVisita(
      this.cobroVisitaId,
      this.cobroMonto,
      this.cobroConcepto || 'Cobro por desplazamiento al sitio',
    ).subscribe({
      next: () => {
        this.cobroExito    = true;
        this.cobrandoVisita = false;
        this.cdr.detectChanges();
        setTimeout(() => this.cerrarCobroVisita(), 1800);
      },
      error: (err) => {
        this.cobroError    = err.error?.detail ?? 'Error al registrar cobro';
        this.cobrandoVisita = false;
        this.cdr.detectChanges();
      },
    });
  }
}
