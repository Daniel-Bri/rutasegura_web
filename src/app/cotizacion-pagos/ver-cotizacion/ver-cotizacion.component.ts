import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CotizacionService, CotizacionResponse } from '../cotizacion.service';
import { AuthService } from '../../acceso-registro/auth.service';

@Component({
  selector: 'app-ver-cotizacion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ver-cotizacion.component.html',
})
export class VerCotizacionComponent implements OnInit {

  cotizaciones: CotizacionResponse[] = [];
  loading  = false;
  errorMsg = '';
  esCliente = false;

  constructor(
    private svc: CotizacionService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.esCliente = this.auth.getUser()?.role === 'cliente';
    this.cargar();
  }

  cargar(): void {
    this.loading  = true;
    this.errorMsg = '';
    const obs = this.esCliente ? this.svc.misCotizaciones() : this.svc.listar();
    obs.subscribe({
      next: (data) => { this.cotizaciones = data; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'Error al cargar cotizaciones';
        this.loading  = false;
        this.cdr.detectChanges();
      },
    });
  }

  aceptar(id: number): void {
    this.svc.actualizarEstado(id, 'aceptada').subscribe({
      next: () => { this.cargar(); },
      error: (err) => { this.errorMsg = err.error?.detail ?? 'Error al aceptar'; this.cdr.detectChanges(); },
    });
  }

  rechazar(id: number): void {
    this.svc.actualizarEstado(id, 'rechazada').subscribe({
      next: () => { this.cargar(); },
      error: (err) => { this.errorMsg = err.error?.detail ?? 'Error al rechazar'; this.cdr.detectChanges(); },
    });
  }

  irAPagar(id: number): void {
    this.router.navigate(['/app/cotizacion-pagos/realizar-pago'], { queryParams: { id } });
  }

  badgeEstado(estado: string): string {
    return { pendiente: 'badge-warning', aceptada: 'badge-green', rechazada: 'badge-danger', pagada: 'badge-muted' }[estado] ?? 'badge-muted';
  }

  estrellas(r: number): string {
    return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  }
}
