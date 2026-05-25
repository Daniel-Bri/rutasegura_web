import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudService, MiSolicitud } from '../solicitud.service';

@Component({
  selector: 'app-cancelar-solicitud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cancelar-solicitud.component.html',
})
export class CancelarSolicitudComponent implements OnInit {
  solicitudes: MiSolicitud[] = [];
  loading = false;
  cancelando: number | null = null;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;
  confirmarId: number | null = null;

  constructor(private solicitudSvc: SolicitudService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data) => {
        this.solicitudes = data.filter(
          (s) => s.incidente.estado !== 'resuelto' && s.incidente.estado !== 'cancelado'
        );
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  solicitarConfirmacion(id: number): void {
    this.confirmarId = id;
    this.msg = null;
  }

  cancelar(): void {
    if (!this.confirmarId || this.cancelando) return;
    const id = this.confirmarId;
    this.cancelando = id;
    this.confirmarId = null;
    this.solicitudSvc.cancelar(id).subscribe({
      next: (r) => {
        this.cancelando = null;
        this.msg = { tipo: 'ok', texto: r.msg ?? 'Solicitud cancelada.' };
        this.cargar();
      },
      error: (e) => {
        this.cancelando = null;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'No se pudo cancelar la solicitud.' };
      },
    });
  }

  cancelarConfirmacion(): void {
    this.confirmarId = null;
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      pendiente: 'Pendiente', en_proceso: 'En proceso',
      resuelto: 'Atendido', cancelado: 'Cancelado',
    };
    return m[e] ?? e;
  }

  badgeClass(e: string): string {
    const m: Record<string, string> = {
      pendiente: 'badge-warning', en_proceso: 'badge-info',
      resuelto: 'badge-success', cancelado: 'badge-danger',
    };
    return m[e] ?? 'badge-muted';
  }
}
