import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService, CalificacionAdmin } from '../reportes.service';

@Component({
  selector: 'app-gestionar-reputacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-reputacion.component.html',
})
export class GestionarReputacionComponent implements OnInit {
  calificaciones: CalificacionAdmin[] = [];
  loading = false;
  errorMsg = '';
  okMsg = '';
  tallerIdFiltro = '';
  busqueda = '';
  estadoFiltro = '';

  get filtrados(): CalificacionAdmin[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.calificaciones.filter(c => {
      if (q && !(
        (c.taller_nombre ?? '').toLowerCase().includes(q) ||
        (c.cliente_nombre ?? '').toLowerCase().includes(q) ||
        (c.comentario ?? '').toLowerCase().includes(q)
      )) return false;
      if (this.estadoFiltro && c.estado !== this.estadoFiltro) return false;
      return true;
    });
  }

  constructor(private reportes: ReportesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorMsg = '';
    this.okMsg = '';
    const tid = this.tallerIdFiltro ? +this.tallerIdFiltro : undefined;
    this.reportes.listarCalificaciones(tid).subscribe({
      next: (data) => {
        this.calificaciones = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'No se pudieron cargar las calificaciones';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cambiarEstado(cal: CalificacionAdmin, estado: 'activa' | 'eliminada'): void {
    this.reportes.cambiarEstadoCalificacion(cal.id, estado).subscribe({
      next: (updated) => {
        const idx = this.calificaciones.findIndex(c => c.id === cal.id);
        if (idx !== -1) this.calificaciones[idx] = updated;
        this.okMsg = `Calificación ${estado === 'eliminada' ? 'eliminada' : 'restaurada'} y rating del taller recalculado.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'No se pudo actualizar la calificación';
        this.cdr.detectChanges();
      },
    });
  }

  estrellas(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
}
