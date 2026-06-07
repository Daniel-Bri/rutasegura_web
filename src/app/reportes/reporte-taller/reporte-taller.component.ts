import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../acceso-registro/auth.service';
import jsPDF from 'jspdf';

interface ReporteTallerResp {
  periodo_label: string;
  taller_nombre: string;
  taller_id: number;
  total_servicios: number;
  servicios_finalizados: number;
  servicios_pagados: number;
  ingresos_brutos: number;
  comision_plataforma: number;
  ingresos_netos: number;
  ticket_promedio: number;
  promedio_calificacion: number | null;
  total_calificaciones: number;
  detalle_pagos: { pago_id: number; incidente_id: number; monto: number; metodo: string; fecha: string | null }[];
}

@Component({
  selector: 'app-reporte-taller',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-taller.component.html',
})
export class ReporteTallerComponent implements OnDestroy {
  // Filtros de fecha
  fechaInicio = '';
  fechaFin    = '';
  chipPeriodo = '';   // 'mes' | '3m' | '6m' | 'todo' | ''

  // Filtro de monto (client-side)
  montoMinimo: number | null = null;

  resultado: ReporteTallerResp | null = null;
  loading   = false;
  errorMsg  = '';
  grabando  = false;
  fechaGeneracion: Date | null = null;

  private recognition: any = null;
  private readonly API = `${environment.apiUrl}/api/reportes/reporte-taller/consulta`;

  readonly periodoChips = [
    { label: 'Este mes',  key: 'mes' },
    { label: '3 meses',   key: '3m'  },
    { label: '6 meses',   key: '6m'  },
    { label: 'Todo',      key: 'todo' },
  ];

  readonly montoBtns: { label: string; valor: number | null }[] = [
    { label: 'Todos',    valor: null },
    { label: '>Bs 100',  valor: 100  },
    { label: '>Bs 200',  valor: 200  },
    { label: '>Bs 500',  valor: 500  },
  ];

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void { this.detenerGrabacion(); }

  // ── Fecha helpers ────────────────────────────────────────
  get hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  seleccionarChip(key: string): void {
    this.chipPeriodo = key;
    this.fechaInicio = '';
    this.fechaFin    = '';
    const hoy  = new Date();
    const iso  = (d: Date) => d.toISOString().slice(0, 10);
    if (key === 'mes') {
      this.fechaInicio = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      this.fechaFin    = iso(hoy);
    } else if (key === '3m') {
      this.fechaInicio = iso(new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1));
      this.fechaFin    = iso(hoy);
    } else if (key === '6m') {
      this.fechaInicio = iso(new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1));
      this.fechaFin    = iso(hoy);
    }
    // 'todo' deja fechas vacías
  }

  onFechaChange(): void { this.chipPeriodo = ''; }

  limpiarFechas(): void {
    this.fechaInicio = '';
    this.fechaFin    = '';
    this.chipPeriodo = '';
  }

  private _construirConsulta(): string {
    if (this.fechaInicio && this.fechaFin) {
      return `reportes del ${this.fechaInicio} al ${this.fechaFin}`;
    }
    if (this.fechaInicio) return `reportes desde ${this.fechaInicio}`;
    if (this.chipPeriodo === 'todo') return 'todos mis reportes';
    if (this.chipPeriodo === 'mes')  return 'reportes de este mes';
    if (this.chipPeriodo === '3m')   return 'reportes de los últimos 3 meses';
    if (this.chipPeriodo === '6m')   return 'reportes de los últimos 6 meses';
    return 'reportes de este mes';
  }

  // ── Pagos filtrados por monto ────────────────────────────
  get pagosFiltrados() {
    if (!this.resultado) return [];
    if (this.montoMinimo === null) return this.resultado.detalle_pagos;
    return this.resultado.detalle_pagos.filter(p => p.monto >= this.montoMinimo!);
  }

  // ── Consultar ────────────────────────────────────────────
  consultar(): void {
    this.loading   = true;
    this.errorMsg  = '';
    this.resultado = null;
    this.fechaGeneracion = new Date();
    const token = this.auth.getToken();
    const body  = { consulta: this._construirConsulta() };
    this.http.post<ReporteTallerResp>(this.API, body, {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: (data) => { this.resultado = data; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'No se pudo generar el reporte.';
        this.loading  = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Web Speech API ───────────────────────────────────────
  iniciarGrabacion(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      this.errorMsg = 'Tu navegador no soporta reconocimiento de voz. Usá Chrome o Edge.';
      this.cdr.detectChanges();
      return;
    }
    this.recognition = new SR();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.onresult = (event: any) => {
      const texto = event.results[0][0].transcript as string;
      this.grabando = false;
      this.cdr.detectChanges();
      // Intenta parsear fechas del texto hablado
      this._aplicarTextoHablado(texto);
    };
    this.recognition.onerror = (event: any) => {
      this.errorMsg = event.error === 'no-speech'
        ? 'No se detectó voz. Intentá de nuevo.'
        : `Error: ${event.error}`;
      this.grabando = false;
      this.cdr.detectChanges();
    };
    this.recognition.onend = () => { this.grabando = false; this.cdr.detectChanges(); };
    this.grabando = true;
    this.errorMsg = '';
    this.recognition.start();
  }

  detenerGrabacion(): void {
    if (this.recognition) { this.recognition.stop(); this.recognition = null; }
    this.grabando = false;
  }

  private _aplicarTextoHablado(texto: string): void {
    const t = texto.toLowerCase();
    if (t.includes('mes')) { this.seleccionarChip('mes'); }
    else if (t.includes('3 mes') || t.includes('tres mes')) { this.seleccionarChip('3m'); }
    else if (t.includes('6 mes') || t.includes('seis mes')) { this.seleccionarChip('6m'); }
    else if (t.includes('todo')) { this.seleccionarChip('todo'); }
    this.consultar();
  }

  // ── Exportar CSV ─────────────────────────────────────────
  exportarCSV(): void {
    if (!this.resultado) return;
    const r = this.resultado;
    const pagos = this.pagosFiltrados;
    const enc = [
      'Reporte del Taller',
      `Taller: ${r.taller_nombre}`,
      `Período: ${r.periodo_label}`,
      `Generado: ${this.fechaGeneracion?.toLocaleString()}`,
      '',
      'RESUMEN',
      'Métrica,Valor',
      `Total servicios,${r.total_servicios}`,
      `Servicios finalizados,${r.servicios_finalizados}`,
      `Servicios pagados,${r.servicios_pagados}`,
      `Ingresos brutos (Bs),${r.ingresos_brutos.toFixed(2)}`,
      `Comisión plataforma (Bs),${r.comision_plataforma.toFixed(2)}`,
      `Ingresos netos (Bs),${r.ingresos_netos.toFixed(2)}`,
      `Ticket promedio (Bs),${r.ticket_promedio.toFixed(2)}`,
      `Calificación promedio,${r.promedio_calificacion?.toFixed(2) ?? 'N/A'}`,
      `Total calificaciones,${r.total_calificaciones}`,
    ];
    const det = pagos.length
      ? ['', 'DETALLE DE PAGOS', '#Pago,Incidente,Monto (Bs),Método,Fecha',
          ...pagos.map(p => `${p.pago_id},#${p.incidente_id},${p.monto.toFixed(2)},${p.metodo},${p.fecha ?? '-'}`)]
      : [];
    this._descargar([...enc, ...det].join('\n'),
      `reporte_${r.taller_id}_${r.periodo_label.replace(/\s/g,'_')}.csv`, 'text/csv;charset=utf-8;');
  }

  // ── Exportar Excel ───────────────────────────────────────
  exportarExcel(): void {
    if (!this.resultado) return;
    const r = this.resultado;
    const pagos = this.pagosFiltrados;
    const filas: any[][] = [
      ['Taller', r.taller_nombre], ['Período', r.periodo_label],
      ['Generado', this.fechaGeneracion?.toLocaleString() ?? ''], [],
      ['Métrica', 'Valor'],
      ['Total servicios', r.total_servicios],
      ['Servicios finalizados', r.servicios_finalizados],
      ['Servicios pagados', r.servicios_pagados],
      ['Ingresos brutos (Bs)', r.ingresos_brutos.toFixed(2)],
      ['Comisión plataforma (Bs)', r.comision_plataforma.toFixed(2)],
      ['Ingresos netos (Bs)', r.ingresos_netos.toFixed(2)],
      ['Ticket promedio (Bs)', r.ticket_promedio.toFixed(2)],
      ['Calificación promedio', r.promedio_calificacion?.toFixed(2) ?? 'N/A'],
      ['Total calificaciones', r.total_calificaciones],
    ];
    let html = `<html><head><meta charset="utf-8"></head><body><table>`;
    for (const f of filas)
      html += '<tr>' + (f.length ? f.map(c => `<td>${c}</td>`).join('') : '<td></td>') + '</tr>';
    if (pagos.length) {
      html += '<tr></tr><tr><td><b>#Pago</b></td><td><b>Incidente</b></td><td><b>Monto (Bs)</b></td><td><b>Método</b></td><td><b>Fecha</b></td></tr>';
      for (const p of pagos)
        html += `<tr><td>${p.pago_id}</td><td>#${p.incidente_id}</td><td>${p.monto.toFixed(2)}</td><td>${p.metodo}</td><td>${p.fecha ?? '-'}</td></tr>`;
    }
    html += '</table></body></html>';
    this._descargar('﻿' + html,
      `reporte_${r.taller_id}_${r.periodo_label.replace(/\s/g,'_')}.xls`, 'application/vnd.ms-excel');
  }

  // ── Exportar PDF ─────────────────────────────────────────
  exportarPDF(): void {
    if (!this.resultado) return;
    const r   = this.resultado;
    const pagos = this.pagosFiltrados;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W   = doc.internal.pageSize.getWidth();
    let   y   = 18;

    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text('RutaSegura — Reporte del Taller', 12, 12);
    doc.setFontSize(9);  doc.setFont('helvetica', 'normal');
    doc.text(r.taller_nombre, 12, 19);
    doc.text(`Período: ${r.periodo_label}`, 12, 24);
    const gen = this.fechaGeneracion?.toLocaleString() ?? '';
    if (gen) doc.text(`Generado: ${gen}`, W - 12, 24, { align: 'right' });
    if (this.montoMinimo !== null)
      doc.text(`Filtro: pagos ≥ Bs ${this.montoMinimo}`, 12, 28);
    y = 36;
    doc.setTextColor(17, 24, 39);

    const kpis = [
      { lbl: 'Total servicios',  val: String(r.total_servicios),                 color: [29, 78, 216]  },
      { lbl: 'Finalizados',      val: String(r.servicios_finalizados),            color: [22, 163, 74]  },
      { lbl: 'Pagados',          val: String(r.servicios_pagados),                color: [14, 165, 233] },
      { lbl: 'Calificación',     val: r.promedio_calificacion != null ? `${r.promedio_calificacion.toFixed(1)} /5` : 'N/A', color: [245, 158, 11] },
      { lbl: 'Ingresos brutos',  val: `Bs ${r.ingresos_brutos.toFixed(2)}`,       color: [55, 65, 81]   },
      { lbl: 'Comision (10%)',   val: `Bs ${r.comision_plataforma.toFixed(2)}`,   color: [220, 38, 38]  },
      { lbl: 'Ingresos netos',   val: `Bs ${r.ingresos_netos.toFixed(2)}`,        color: [22, 163, 74]  },
      { lbl: 'Ticket promedio',  val: `Bs ${r.ticket_promedio.toFixed(2)}`,       color: [217, 119, 6]  },
    ];
    const cols = 4; const cardW = (W - 24) / cols; const cardH = 18; const gap = 3;
    kpis.forEach((k, i) => {
      const col = i % cols; const row = Math.floor(i / cols);
      const x = 12 + col * (cardW + gap); const cy = y + row * (cardH + gap);
      doc.setFillColor(249, 250, 251); doc.roundedRect(x, cy, cardW, cardH, 2, 2, 'F');
      doc.setDrawColor(229, 231, 235); doc.roundedRect(x, cy, cardW, cardH, 2, 2, 'S');
      doc.setFillColor(k.color[0], k.color[1], k.color[2]); doc.rect(x, cy, 2, cardH, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
      doc.text(k.lbl.toUpperCase(), x + 5, cy + 5.5);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.setTextColor(k.color[0], k.color[1], k.color[2]);
      doc.text(k.val, x + 5, cy + 13);
    });
    y += 2 * (cardH + gap) + 8;

    if (pagos.length > 0) {
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
      doc.text('DETALLE DE PAGOS', 12, y); y += 5;
      const cols2 = ['#Pago', 'Incidente', 'Monto (Bs)', 'Método', 'Fecha'];
      const widths = [20, 25, 35, 30, 30]; const rowH = 7;
      doc.setFillColor(243, 244, 246); doc.rect(12, y, W - 24, rowH, 'F');
      doc.setDrawColor(229, 231, 235); doc.rect(12, y, W - 24, rowH, 'S');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
      let cx = 14;
      cols2.forEach((c, i) => { doc.text(c, cx, y + 4.8); cx += widths[i]; });
      y += rowH;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      pagos.forEach((p, idx) => {
        if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(12, y, W - 24, rowH, 'F'); }
        doc.setDrawColor(229, 231, 235); doc.rect(12, y, W - 24, rowH, 'S');
        const cells = [`#${p.pago_id}`, `#${p.incidente_id}`, `Bs ${p.monto.toFixed(2)}`, p.metodo, p.fecha ? p.fecha.substring(0, 10) : '—'];
        let cx2 = 14;
        cells.forEach((cell, i) => {
          doc.setTextColor(i === 2 ? 22 : 17, i === 2 ? 163 : 24, i === 2 ? 74 : 39);
          doc.text(cell, cx2, y + 4.8); cx2 += widths[i];
        });
        y += rowH;
        if (y > 270 && idx < pagos.length - 1) { doc.addPage(); y = 15; }
      });
    } else {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175);
      doc.text('Sin pagos registrados en este período.', 12, y);
    }

    doc.setFontSize(7); doc.setTextColor(156, 163, 175);
    doc.text('Generado por RutaSegura', W / 2, 290, { align: 'center' });
    doc.save(`reporte_${r.taller_nombre.replace(/\s+/g, '_')}_${r.periodo_label.replace(/\s/g, '_')}.pdf`);
  }

  private _descargar(contenido: string, nombre: string, tipo: string): void {
    const blob = new Blob([contenido], { type: tipo });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = nombre; a.click();
    URL.revokeObjectURL(url);
  }

  estadoClass(p: string): string {
    return p === 'alta' ? 'badge-danger' : p === 'media' ? 'badge-warning' : 'badge-muted';
  }
}
