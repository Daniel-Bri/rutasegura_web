import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SolicitudService, MiSolicitud } from '../../solicitudes/solicitud.service';

@Component({
  selector: 'app-enviar-ubicacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enviar-ubicacion.component.html',
})
export class EnviarUbicacionComponent implements OnInit {
  solicitudes: MiSolicitud[] = [];
  loading = false;
  enviando = false;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;
  coordenadas: { lat: number; lng: number } | null = null;
  errorGps = '';

  constructor(private http: HttpClient, private solicitudSvc: SolicitudService) {}

  ngOnInit(): void {
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data) => {
        this.solicitudes = data.filter(
          (s) => s.incidente.estado === 'pendiente' || s.incidente.estado === 'en_proceso'
        );
      },
    });
    this.obtenerUbicacion();
  }

  obtenerUbicacion(): void {
    if (!navigator.geolocation) {
      this.errorGps = 'Tu navegador no soporta geolocalización.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.coordenadas = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.errorGps = '';
      },
      () => {
        this.errorGps = 'No se pudo obtener la ubicación. Verifica los permisos del navegador.';
      }
    );
  }

  enviar(incidenteId: number): void {
    if (!this.coordenadas || this.enviando) return;
    this.enviando = true;
    this.msg = null;
    this.http
      .patch(`${environment.apiUrl}/api/emergencias/${incidenteId}/ubicacion`, {
        latitud: this.coordenadas.lat,
        longitud: this.coordenadas.lng,
      })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.msg = { tipo: 'ok', texto: 'Ubicación enviada correctamente.' };
        },
        error: (e) => {
          this.enviando = false;
          this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al enviar la ubicación.' };
        },
      });
  }
}
