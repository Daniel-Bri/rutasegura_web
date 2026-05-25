import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  activo: boolean;
}

@Component({
  selector: 'app-gestionar-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-vehiculos.component.html',
})
export class GestionarVehiculosComponent implements OnInit {
  private readonly API = `${environment.apiUrl}/api/acceso-registro/vehiculos`;

  vehiculos: Vehiculo[] = [];
  loading = false;
  mostrarForm = false;
  guardando = false;
  eliminando: number | null = null;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;

  form = { placa: '', marca: '', modelo: '', anio: new Date().getFullYear(), color: '' };

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.http.get<Vehiculo[]>(this.API).subscribe({
      next: (data) => { this.vehiculos = data.filter((v) => v.activo); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  toggleForm(): void {
    this.mostrarForm = !this.mostrarForm;
    this.msg = null;
    if (!this.mostrarForm) this.resetForm();
  }

  resetForm(): void {
    this.form = { placa: '', marca: '', modelo: '', anio: new Date().getFullYear(), color: '' };
  }

  registrar(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.msg = null;
    this.http.post<Vehiculo>(this.API, this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.msg = { tipo: 'ok', texto: 'Vehículo registrado correctamente.' };
        this.mostrarForm = false;
        this.resetForm();
        this.cargar();
      },
      error: (e) => {
        this.guardando = false;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al registrar el vehículo.' };
      },
    });
  }

  eliminar(id: number): void {
    if (this.eliminando) return;
    this.eliminando = id;
    this.msg = null;
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => {
        this.eliminando = null;
        this.msg = { tipo: 'ok', texto: 'Vehículo eliminado.' };
        this.cargar();
      },
      error: (e) => {
        this.eliminando = null;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al eliminar el vehículo.' };
      },
    });
  }
}
