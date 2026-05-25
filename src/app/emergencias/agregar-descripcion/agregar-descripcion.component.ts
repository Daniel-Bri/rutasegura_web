import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SolicitudService, MiSolicitud } from '../../solicitudes/solicitud.service';

@Component({
  selector: 'app-agregar-descripcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-descripcion.component.html',
})
export class AgregarDescripcionComponent implements OnInit {
  solicitudes: MiSolicitud[] = [];
  seleccionId: number | null = null;
  descripcion = '';
  enviando = false;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;

  constructor(private http: HttpClient, private solicitudSvc: SolicitudService) {}

  ngOnInit(): void {
    this.solicitudSvc.misSolicitudes().subscribe({
      next: (data) => {
        this.solicitudes = data.filter(
          (s) => s.incidente.estado === 'pendiente' || s.incidente.estado === 'en_proceso'
        );
        if (this.solicitudes.length === 1) {
          this.seleccionId = this.solicitudes[0].incidente.id;
          this.descripcion = this.solicitudes[0].incidente.descripcion ?? '';
        }
      },
    });
  }

  enviar(): void {
    if (!this.seleccionId || !this.descripcion.trim() || this.enviando) return;
    this.enviando = true;
    this.msg = null;
    this.http
      .patch(`${environment.apiUrl}/api/emergencias/${this.seleccionId}/descripcion`, {
        descripcion: this.descripcion.trim(),
      })
      .subscribe({
        next: () => {
          this.enviando = false;
          this.msg = { tipo: 'ok', texto: 'Descripción guardada correctamente.' };
        },
        error: (e) => {
          this.enviando = false;
          this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al guardar la descripción.' };
        },
      });
  }
}
