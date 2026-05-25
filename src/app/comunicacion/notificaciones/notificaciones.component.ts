import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TecnicoService, AsignacionResponse } from '../../talleres-tecnicos/tecnico.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  asignaciones: AsignacionResponse[] = [];
  loading = false;
  errorMsg = '';
  private wsSub?: Subscription;

  constructor(private svc: TecnicoService, private wsSvc: WebSocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this.wsSub = this.wsSvc.on('estado_asignacion').subscribe(() => {
      this.cargar(true);
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  cargar(silencioso = false): void {
    if (!silencioso) { this.loading = true; this.errorMsg = ''; }
    this.svc.listarActivas().subscribe({
      next: (data) => {
        this.asignaciones = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!silencioso) {
          this.errorMsg = err.error?.detail ?? 'Error al cargar notificaciones';
          this.loading = false;
        }
        this.cdr.detectChanges();
      },
    });
  }

  estadoBadge(estado: string): string {
    const m: Record<string, string> = {
      aceptado: 'badge-warning', en_camino: 'badge-primary',
      en_sitio: 'badge-purple', en_reparacion: 'badge-orange',
      finalizado: 'badge-success', cancelado: 'badge-danger',
    };
    return m[estado] ?? 'badge-muted';
  }

  estadoLabel(estado: string): string {
    const m: Record<string, string> = {
      aceptado: 'Aceptado', en_camino: 'En camino', en_sitio: 'En sitio',
      en_reparacion: 'En reparación', finalizado: 'Finalizado', cancelado: 'Cancelado',
    };
    return m[estado] ?? estado;
  }

  iconEstado(estado: string): string {
    const m: Record<string, string> = {
      aceptado: 'check_circle', en_camino: 'directions_car', en_sitio: 'location_on',
      en_reparacion: 'build', finalizado: 'task_alt', cancelado: 'cancel',
    };
    return m[estado] ?? 'notifications';
  }
}
