import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoService, TallerResponse } from '../vehiculo.service';

type Filtro = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';
interface TenantOption { id: number; nombre: string; slug: string; activo: boolean; }

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado',  label: 'Aprobados'  },
  { value: 'rechazado', label: 'Rechazados' },
  { value: 'todos',     label: 'Todos'      },
];

@Component({
  selector: 'app-aprobar-talleres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aprobar-talleres.component.html',
})
export class AprobarTalleresComponent implements OnInit {
  readonly filtros = FILTROS;
  talleres: TallerResponse[] = [];
  tenants: TenantOption[] = [];
  filtro: Filtro = 'pendiente';
  loading = false;
  errorMsg = '';

  // Tenant seleccionado por taller (antes de aprobar)
  tenantSel: Record<number, number | null> = {};

  // Para feedback por fila
  procesando: Record<number, 'aprobando' | 'rechazando' | null> = {};
  mensajeFila: Record<number, { tipo: 'ok' | 'error'; texto: string }> = {};

  constructor(private vehiculoService: VehiculoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
    this.vehiculoService.listarTenants().subscribe({
      next: (data) => { this.tenants = data.filter(t => t.activo); this.cdr.detectChanges(); },
      error: () => {},
    });
  }

  cargar(): void {
    this.loading = true;
    this.errorMsg = '';
    const estado = this.filtro === 'todos' ? undefined : this.filtro;
    this.vehiculoService.listarTalleres(estado).subscribe({
      next: (data) => {
        this.talleres = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.name === 'TimeoutError') {
          this.errorMsg = 'El servidor no responde. Verifica que el backend esté corriendo.';
        } else {
          this.errorMsg = err.error?.detail ?? 'Error al cargar los talleres';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cambiarFiltro(f: Filtro): void {
    this.filtro = f;
    this.cargar();
  }

  aprobar(taller: TallerResponse): void {
    this.procesando[taller.id] = 'aprobando';
    this.mensajeFila[taller.id] = { tipo: 'ok', texto: '' };
    const tenantId = this.tenantSel[taller.id] ?? null;

    this.vehiculoService.aprobarTaller(taller.id, tenantId).subscribe({
      next: (actualizado) => {
        this.procesando[taller.id] = null;
        this.mensajeFila[taller.id] = { tipo: 'ok', texto: 'Aprobado correctamente' };
        this.reemplazar(actualizado);
        this.cdr.detectChanges();
        setTimeout(() => { this.limpiarMensaje(taller.id); this.cdr.detectChanges(); }, 2500);
      },
      error: (err) => {
        this.procesando[taller.id] = null;
        this.mensajeFila[taller.id] = {
          tipo: 'error',
          texto: err.error?.detail ?? 'Error al aprobar',
        };
        this.cdr.detectChanges();
      },
    });
  }

  rechazar(taller: TallerResponse): void {
    this.procesando[taller.id] = 'rechazando';

    this.vehiculoService.rechazarTaller(taller.id).subscribe({
      next: (actualizado) => {
        this.procesando[taller.id] = null;
        this.mensajeFila[taller.id] = { tipo: 'ok', texto: 'Rechazado' };
        this.reemplazar(actualizado);
        this.cdr.detectChanges();
        setTimeout(() => { this.limpiarMensaje(taller.id); this.cdr.detectChanges(); }, 2500);
      },
      error: (err) => {
        this.procesando[taller.id] = null;
        this.mensajeFila[taller.id] = {
          tipo: 'error',
          texto: err.error?.detail ?? 'Error al rechazar',
        };
        this.cdr.detectChanges();
      },
    });
  }

  private reemplazar(actualizado: TallerResponse): void {
    const idx = this.talleres.findIndex((t) => t.id === actualizado.id);
    if (idx !== -1) {
      this.talleres[idx] = actualizado;
      // Si el filtro no es "todos", sacar del listado tras el cambio
      if (this.filtro !== 'todos') {
        setTimeout(() => {
          this.talleres = this.talleres.filter((t) => t.estado === this.filtro);
        }, 1800);
      }
    }
  }

  private limpiarMensaje(id: number): void {
    delete this.mensajeFila[id];
  }

  badgeClass(estado: string): string {
    return {
      pendiente: 'badge-warning',
      aprobado:  'badge-success',
      rechazado: 'badge-danger',
    }[estado] ?? 'badge-warning';
  }
}
