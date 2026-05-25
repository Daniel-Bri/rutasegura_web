import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SolicitudService, MiSolicitud } from '../../solicitudes/solicitud.service';
import { WebSocketService } from '../../core/services/websocket.service';

interface TecnicoUbicacion {
  tecnico_id: number;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
  ultima_actualizacion: string | null;
  estado_asignacion: string;
  eta: number | null;
}

@Component({
  selector: 'app-ver-tecnico-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-tecnico-mapa.component.html',
})
export class VerTecnicoMapaComponent implements OnInit, OnDestroy {
  asignacionId: number | null = null;
  ubicacion: TecnicoUbicacion | null = null;
  loading = false;
  error: string | null = null;
  private wsSub?: Subscription;

  constructor(
    private http: HttpClient,
    private solicitudSvc: SolicitudService,
    private wsSvc: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data: MiSolicitud[]) => {
        const activa = data.find(
          (s) => s.asignacion && s.asignacion.estado !== 'cancelado' && s.asignacion.estado !== 'finalizado'
        );
        if (activa?.asignacion) {
          this.asignacionId = activa.asignacion.id;
          this.cargarUbicacionInicial();
          this.escucharWebSocket();
        }
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  cargarUbicacionInicial(): void {
    if (!this.asignacionId) return;
    this.loading = true;
    this.error = null;
    this.http
      .get<TecnicoUbicacion>(
        `${environment.apiUrl}/api/comunicacion/asignaciones/${this.asignacionId}/tecnico-ubicacion`
      )
      .subscribe({
        next: (data) => {
          this.ubicacion = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (e) => {
          this.loading = false;
          this.error = e?.error?.detail ?? 'No se pudo obtener la ubicación del técnico.';
          this.cdr.detectChanges();
        },
      });
  }

  private escucharWebSocket(): void {
    this.wsSub = this.wsSvc.on('ubicacion_tecnico').subscribe((payload) => {
      if (payload.asignacion_id !== this.asignacionId) return;
      this.ubicacion = {
        tecnico_id: payload.tecnico_id,
        nombre: payload.nombre ?? this.ubicacion?.nombre ?? '',
        latitud: payload.latitud,
        longitud: payload.longitud,
        ultima_actualizacion: new Date().toISOString(),
        estado_asignacion: this.ubicacion?.estado_asignacion ?? 'en_camino',
        eta: this.ubicacion?.eta ?? null,
      };
      this.error = null;
      this.cdr.detectChanges();
    });
  }

  get mapsUrl(): string | null {
    if (!this.ubicacion?.latitud || !this.ubicacion?.longitud) return null;
    return `https://www.google.com/maps?q=${this.ubicacion.latitud},${this.ubicacion.longitud}`;
  }
}
