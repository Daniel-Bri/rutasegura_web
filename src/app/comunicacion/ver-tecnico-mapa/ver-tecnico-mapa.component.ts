import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SolicitudService, MiSolicitud } from '../../solicitudes/solicitud.service';

interface TecnicoUbicacion {
  latitud: number;
  longitud: number;
  updated_at: string;
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
  private _poll?: ReturnType<typeof setInterval>;

  constructor(private http: HttpClient, private solicitudSvc: SolicitudService) {}

  ngOnInit(): void {
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data: MiSolicitud[]) => {
        const activa = data.find(
          (s) => s.asignacion && s.asignacion.estado !== 'cancelado' && s.asignacion.estado !== 'finalizado'
        );
        if (activa?.asignacion) {
          this.asignacionId = activa.asignacion.id;
          this.cargarUbicacion();
          this._poll = setInterval(() => this.cargarUbicacion(), 20000);
        }
      },
    });
  }

  ngOnDestroy(): void {
    if (this._poll) clearInterval(this._poll);
  }

  cargarUbicacion(): void {
    if (!this.asignacionId) return;
    this.loading = true;
    this.error = null;
    this.http
      .get<TecnicoUbicacion>(
        `${environment.apiUrl}/api/comunicacion/asignaciones/${this.asignacionId}/tecnico-ubicacion`
      )
      .subscribe({
        next: (data) => { this.ubicacion = data; this.loading = false; },
        error: (e) => {
          this.loading = false;
          this.error = e?.error?.detail ?? 'No se pudo obtener la ubicación del técnico.';
        },
      });
  }

  get mapsUrl(): string | null {
    if (!this.ubicacion) return null;
    return `https://www.google.com/maps?q=${this.ubicacion.latitud},${this.ubicacion.longitud}`;
  }
}
