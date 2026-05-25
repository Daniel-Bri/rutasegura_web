import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-boton-sos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boton-sos.component.html',
})
export class BotonSosComponent {
  enviando = false;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;
  coordenadas: { lat: number; lng: number } | null = null;
  obteniendo = false;

  constructor(private http: HttpClient) {}

  obtenerUbicacion(): void {
    if (!navigator.geolocation) {
      this.msg = { tipo: 'error', texto: 'Tu navegador no soporta geolocalización.' };
      return;
    }
    this.obteniendo = true;
    this.msg = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.coordenadas = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.obteniendo = false;
        this.enviarSOS();
      },
      () => {
        this.obteniendo = false;
        this.enviarSOS();
      },
      { timeout: 8000 }
    );
  }

  enviarSOS(): void {
    if (this.enviando) return;
    this.enviando = true;
    this.msg = null;
    const body = this.coordenadas
      ? { latitud: this.coordenadas.lat, longitud: this.coordenadas.lng }
      : {};
    this.http.post(`${environment.apiUrl}/api/emergencias/sos`, body).subscribe({
      next: () => {
        this.enviando = false;
        this.msg = {
          tipo: 'ok',
          texto: 'SOS enviado con éxito. Los talleres cercanos han sido notificados.',
        };
      },
      error: (e) => {
        this.enviando = false;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'No se pudo enviar el SOS.' };
      },
    });
  }

  activar(): void {
    this.obtenerUbicacion();
  }
}
