import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VehiculoService } from '../vehiculo.service';

@Component({
  selector: 'app-registrar-vehiculo',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './registrar-vehiculo.component.html',
})
export class RegistrarVehiculoComponent {
  form: FormGroup;
  loading = false;
  serverError = '';
  successMsg = '';

  readonly currentYear = new Date().getFullYear();

  readonly marcas = [
    'Toyota','Chevrolet','Ford','Nissan','Hyundai','Kia','Honda',
    'Volkswagen','Mazda','Renault','Suzuki','Mitsubishi','Otro',
  ];

  readonly colores = [
    'Blanco','Negro','Gris','Plata','Rojo','Azul',
    'Verde','Amarillo','Naranja','Café','Beige','Otro',
  ];

  constructor(
    private fb: FormBuilder,
    private vehiculoService: VehiculoService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      placa:         ['', [Validators.required, Validators.minLength(5), Validators.maxLength(8)]],
      marca:         ['', Validators.required],
      modelo:        ['', Validators.required],
      anio:          ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      color:         ['', Validators.required],
      numero_seguro: [''],
    });
  }

  get placa()  { return this.form.get('placa')!; }
  get marca()  { return this.form.get('marca')!; }
  get modelo() { return this.form.get('modelo')!; }
  get anio()   { return this.form.get('anio')!; }
  get color()  { return this.form.get('color')!; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.serverError = '';
    this.successMsg = '';

    this.vehiculoService.registrar(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Vehículo registrado correctamente';
        setTimeout(() => this.router.navigate(['/app/acceso-registro/gestionar-vehiculos']), 1200);
      },
      error: (err) => {
        this.serverError = err.error?.detail ?? 'Error al registrar el vehículo';
        this.loading = false;
      },
    });
  }
}
