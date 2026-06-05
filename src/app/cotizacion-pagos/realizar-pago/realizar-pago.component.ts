import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CotizacionService,
  CotizacionResponse,
  ItemCotizacion,
  PagoResponse,
} from '../cotizacion.service';

@Component({
  selector: 'app-realizar-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './realizar-pago.component.html',
})
export class RealizarPagoComponent implements OnInit {
  cotizaciones: CotizacionResponse[] = [];
  cotizacionSeleccionada: CotizacionResponse | null = null;
  itemsSeleccionada: ItemCotizacion[] = [];

  metodo    = 'efectivo';
  loading   = false;
  procesando = false;
  errorMsg  = '';
  pago: PagoResponse | null = null;

  tarjeta = { numero: '', expiry: '', cvv: '', nombre: '' };
  tarjetaError = '';

  constructor(
    private svc: CotizacionService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParamMap.get('id');
    if (idParam) {
      this.loading = true;
      this.svc.getById(Number(idParam)).subscribe({
        next: (c) => {
          if (c.estado === 'aceptada') {
            this.cotizacionSeleccionada = c;
            this.itemsSeleccionada = this.svc.parsearItems(c.detalle);
          } else {
            this.errorMsg = `La cotización está en estado "${c.estado}" y no se puede pagar.`;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.detail ?? 'Error al cargar la cotización';
          this.loading  = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.cargarMisCotizaciones();
    }
  }

  cargarMisCotizaciones(): void {
    this.loading  = true;
    this.errorMsg = '';
    this.svc.misCotizaciones().subscribe({
      next: (data) => {
        this.cotizaciones = data.filter(c => c.estado === 'aceptada');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'Error al cargar cotizaciones';
        this.loading  = false;
        this.cdr.detectChanges();
      },
    });
  }

  seleccionar(c: CotizacionResponse): void {
    this.cotizacionSeleccionada = c;
    this.itemsSeleccionada = this.svc.parsearItems(c.detalle);
    this.errorMsg = '';
    this.pago = null;
    this.cdr.detectChanges();
  }

  volver(): void {
    this.cotizacionSeleccionada = null;
    this.pago = null;
    this.errorMsg = '';
    this.cargarMisCotizaciones();
  }

  get subtotal(): number {
    return this.itemsSeleccionada.reduce((s, it) => s + it.cantidad * it.precio_unitario, 0);
  }

  pagar(): void {
    if (!this.cotizacionSeleccionada) return;
    this.tarjetaError = '';
    if (this.metodo === 'tarjeta') {
      if (this.tarjeta.numero.replace(/\s/g, '').length < 16) { this.tarjetaError = 'Número de tarjeta inválido.'; return; }
      if (!this.tarjeta.expiry.match(/^\d{2}\/\d{2}$/)) { this.tarjetaError = 'Fecha de expiración inválida (MM/AA).'; return; }
      if (this.tarjeta.cvv.length < 3) { this.tarjetaError = 'CVV inválido.'; return; }
      if (!this.tarjeta.nombre.trim()) { this.tarjetaError = 'Ingresa el nombre del titular.'; return; }
    }
    this.procesando = true;
    this.errorMsg   = '';
    this.svc.realizarPago({ cotizacion_id: this.cotizacionSeleccionada.id, metodo: this.metodo }).subscribe({
      next: (p) => {
        this.pago       = p;
        this.procesando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg   = err.error?.detail ?? 'Error al procesar el pago';
        this.procesando = false;
        this.cdr.detectChanges();
      },
    });
  }

  formatTarjeta(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 16);
    this.tarjeta.numero = val.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0,2) + '/' + val.slice(2);
    this.tarjeta.expiry = val;
  }

  metodoLabel(m: string): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      qr:       'QR',
      tarjeta:  'Tarjeta',
    };
    return map[m] ?? m;
  }
}
