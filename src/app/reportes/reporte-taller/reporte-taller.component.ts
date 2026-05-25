import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesService, MetricasResumenResponse } from '../reportes.service';

@Component({
  selector: 'app-reporte-taller',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-taller.component.html',
})
export class ReporteTallerComponent implements OnInit {
  resumen: MetricasResumenResponse | null = null;
  loading = false;
  error: string | null = null;
  fechaGeneracion = new Date();

  constructor(private reportes: ReportesService) {}

  ngOnInit(): void {
    this.loading = true;
    this.reportes.metricasTaller().subscribe({
      next: (data) => { this.resumen = data; this.loading = false; },
      error: (e) => {
        this.error = e?.error?.detail ?? 'No se pudo generar el reporte.';
        this.loading = false;
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  exportarCSV(): void {
    if (!this.resumen) return;
    const lines = [
      'Métrica,Valor',
      `Total servicios,${this.resumen.total_servicios}`,
      `Servicios finalizados,${this.resumen.servicios_finalizados}`,
      `Servicios pagados,${this.resumen.servicios_pagados}`,
      `Ingresos brutos (Bs),${this.resumen.ingresos_brutos.toFixed(2)}`,
      `Comisión plataforma (Bs),${this.resumen.comision_plataforma.toFixed(2)}`,
      `Ingresos netos (Bs),${this.resumen.ingresos_netos.toFixed(2)}`,
      `Ticket promedio (Bs),${this.resumen.ticket_promedio.toFixed(2)}`,
      `Calificación promedio,${this.resumen.promedio_calificacion?.toFixed(2) ?? 'N/A'}`,
      `Total calificaciones,${this.resumen.total_calificaciones}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_taller_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
