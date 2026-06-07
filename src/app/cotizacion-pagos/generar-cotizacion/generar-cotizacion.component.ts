import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CotizacionService, ItemCotizacion, IncidenteDisponible } from '../cotizacion.service';

@Component({
  selector: 'app-generar-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generar-cotizacion.component.html',
})
export class GenerarCotizacionComponent implements OnInit {

  incidentes: IncidenteDisponible[] = [];
  incidenteSeleccionado: number | null = null;

  items: ItemCotizacion[] = [{ descripcion: '', cantidad: 1, precio_unitario: 0 }];
  tiempoEstimadoHoras: number | null = null;

  loadingIncidentes = false;
  guardando         = false;
  errorMsg          = '';
  successMsg        = '';

  constructor(
    private svc: CotizacionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarIncidentes();
  }

  cargarIncidentes(): void {
    this.loadingIncidentes = true;
    this.svc.listarIncidentesDisponibles().subscribe({
      next: (data) => { this.incidentes = data; this.loadingIncidentes = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorMsg          = err.error?.detail ?? 'Error al cargar incidentes';
        this.loadingIncidentes = false;
        this.cdr.detectChanges();
      },
    });
  }

  agregarItem(): void {
    this.items = [...this.items, { descripcion: '', cantidad: 1, precio_unitario: 0 }];
  }

  eliminarItem(idx: number): void {
    if (this.items.length === 1) return;
    this.items = this.items.filter((_, i) => i !== idx);
  }

  get montoTotal(): number {
    return this.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
  }

  get formValido(): boolean {
    return (
      this.incidenteSeleccionado !== null &&
      this.items.every((it) => it.descripcion.trim() && it.cantidad > 0 && it.precio_unitario >= 0)
    );
  }

  guardar(): void {
    if (!this.formValido) { this.errorMsg = 'Completa todos los campos antes de continuar'; return; }
    this.guardando = true;
    this.errorMsg  = '';

    this.svc.generar({
      incidente_id: this.incidenteSeleccionado!,
      items: this.items,
      tiempo_estimado_horas: this.tiempoEstimadoHoras ?? undefined,
    }).subscribe({
      next: (cot) => {
        this.successMsg = `Cotización #${cot.id} generada correctamente por Bs. ${cot.monto_estimado.toFixed(2)}`;
        this.guardando  = false;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/app/cotizacion-pagos/ver-cotizacion']), 1800);
      },
      error: (err) => {
        this.errorMsg  = err.error?.detail ?? 'Error al generar cotización';
        this.guardando = false;
        this.cdr.detectChanges();
      },
    });
  }

  trackByIdx(_: number, idx: number): number { return idx; }
}
