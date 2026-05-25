import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudService } from '../solicitud.service';
import { AsignacionResponse, TecnicoService } from '../../talleres-tecnicos/tecnico.service';

@Component({
  selector: 'app-rechazar-solicitud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rechazar-solicitud.component.html',
})
export class RechazarSolicitudComponent implements OnInit {
  asignaciones: AsignacionResponse[] = [];
  loading = false;
  rechazando: number | null = null;
  confirmarId: number | null = null;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;

  constructor(private solicitudSvc: SolicitudService, private tecnicoSvc: TecnicoService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.tecnicoSvc.listarActivas().subscribe({
      next: (data) => { this.asignaciones = data.filter((a) => a.estado === 'aceptado'); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  solicitarConfirmacion(incidenteId: number): void { this.confirmarId = incidenteId; this.msg = null; }

  rechazar(): void {
    if (!this.confirmarId || this.rechazando) return;
    const id = this.confirmarId;
    this.rechazando = id;
    this.confirmarId = null;
    this.solicitudSvc.rechazar(id).subscribe({
      next: (r) => { this.rechazando = null; this.msg = { tipo: 'ok', texto: r.msg ?? 'Rechazada.' }; this.cargar(); },
      error: (e) => { this.rechazando = null; this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al rechazar.' }; },
    });
  }

  cancelarConfirmacion(): void { this.confirmarId = null; }
}
