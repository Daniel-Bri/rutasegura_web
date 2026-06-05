import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VehiculoService } from '../vehiculo.service';

export const ESPECIALIDADES = [
  { value: 'mecanica_general', label: 'Mecánica General' },
  { value: 'electromecanica',  label: 'Electromecánica' },
  { value: 'chaperia',         label: 'Chapería y Carrocería' },
  { value: 'llanteria',        label: 'Llantas y Neumáticos' },
  { value: 'electricista',     label: 'Electricidad Automotriz' },
  { value: 'pintura',          label: 'Pintura Automotriz' },
];

@Component({
  selector: 'app-registrar-taller',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registrar-taller.component.html',
})
export class RegistrarTallerComponent {
  form: FormGroup;
  loading = false;
  serverError = '';
  successMsg = '';
  readonly especialidades = ESPECIALIDADES;
  especialidadesSeleccionadas = new Set<string>();

  constructor(private fb: FormBuilder, private vehiculoService: VehiculoService) {
    this.form = this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(3)]],
      direccion:       ['', Validators.required],
      telefono:        [''],
      email_comercial: [''],
      latitud:         [''],
      longitud:        [''],
    });
  }

  get nombre()    { return this.form.get('nombre')!; }
  get direccion() { return this.form.get('direccion')!; }

  toggleEspecialidad(value: string): void {
    this.especialidadesSeleccionadas.has(value)
      ? this.especialidadesSeleccionadas.delete(value)
      : this.especialidadesSeleccionadas.add(value);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.especialidadesSeleccionadas.size === 0) {
      this.serverError = 'Selecciona al menos una especialidad.';
      return;
    }
    this.loading = true;
    this.serverError = '';

    const payload = {
      ...this.form.value,
      latitud:        this.form.value.latitud  ? parseFloat(this.form.value.latitud)  : null,
      longitud:       this.form.value.longitud ? parseFloat(this.form.value.longitud) : null,
      especialidades: Array.from(this.especialidadesSeleccionadas),
    };

    this.vehiculoService.registrarTaller(payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Taller registrado. Pendiente de aprobación por el administrador.';
      },
      error: (err) => {
        this.serverError = err.error?.detail ?? 'Error al registrar el taller';
        this.loading = false;
      },
    });
  }
}
