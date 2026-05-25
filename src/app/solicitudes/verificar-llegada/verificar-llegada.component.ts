import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SolicitudService, MiSolicitud } from '../solicitud.service';

@Component({
  selector: 'app-verificar-llegada',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificar-llegada.component.html',
})
export class VerificarLlegadaComponent implements OnInit {
  solicitudes: MiSolicitud[] = [];
  loading = false;
  confirmando: number | null = null;
  confirmarId: number | null = null;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;

  constructor(private http: HttpClient, private solicitudSvc: SolicitudService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data) => {
        this.solicitudes = data.filter(
          (s) => s.asignacion?.estado === 'en_camino'
        );
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  solicitarConfirmacion(asignacionId: number): void {
    this.confirmarId = asignacionId;
    this.msg = null;
  }

  confirmar(): void {
    if (!this.confirmarId || this.confirmando) return;
    const id = this.confirmarId;
    this.confirmando = id;
    this.confirmarId = null;
    this.http
      .patch(`${environment.apiUrl}/api/talleres/asignaciones/${id}/confirmar-llegada`, {})
      .subscribe({
        next: () => {
          this.confirmando = null;
          this.msg = { tipo: 'ok', texto: 'Llegada confirmada. El técnico está en tu ubicación.' };
          this.cargar();
        },
        error: (e) => {
          this.confirmando = null;
          this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'No se pudo confirmar la llegada.' };
        },
      });
  }

  cancelarConfirmacion(): void { this.confirmarId = null; }
}
