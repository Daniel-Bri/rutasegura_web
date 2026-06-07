import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotizacionService, HistorialItem } from '../../cotizacion-pagos/cotizacion.service';

@Component({
  selector: 'app-historial-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-servicios.component.html',
})
export class HistorialServiciosComponent implements OnInit {
  historial: HistorialItem[] = [];
  loading  = false;
  errorMsg = '';
  busqueda = '';
  tipoFiltro = '';
  desdeFilter = '';
  hastaFilter = '';

  get tipos(): string[] {
    const set = new Set(this.historial.map(h => h.tipo_incidente).filter(Boolean) as string[]);
    return [...set].sort();
  }

  get filtrados(): HistorialItem[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.historial.filter(h => {
      if (q && !(
        (h.descripcion_trabajo ?? '').toLowerCase().includes(q) ||
        (h.tipo_incidente ?? '').toLowerCase().includes(q) ||
        (h.descripcion ?? '').toLowerCase().includes(q) ||
        String(h.incidente_id ?? h.asignacion_id).includes(q)
      )) return false;
      if (this.tipoFiltro && h.tipo_incidente !== this.tipoFiltro) return false;
      if (this.desdeFilter && h.fecha_cierre < this.desdeFilter) return false;
      if (this.hastaFilter && h.fecha_cierre.substring(0, 10) > this.hastaFilter) return false;
      return true;
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.tipoFiltro = '';
    this.desdeFilter = '';
    this.hastaFilter = '';
  }

  constructor(private svc: CotizacionService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading  = true;
    this.errorMsg = '';
    this.svc.listarHistorial().subscribe({
      next: (data) => {
        this.historial = data;
        this.loading   = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'Error al cargar el historial';
        this.loading  = false;
        this.cdr.detectChanges();
      },
    });
  }

  parsearRepuestos(raw: string | null): string {
    if (!raw) return '—';
    try {
      const list = JSON.parse(raw) as { descripcion: string; cantidad: number }[];
      return list.map(r => `${r.descripcion} ×${r.cantidad}`).join(', ') || '—';
    } catch { return '—'; }
  }
}
