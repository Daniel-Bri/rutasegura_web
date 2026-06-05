import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoService, TallerResponse } from '../vehiculo.service';

const ESPECIALIDADES = [
  { value: 'mecanica_general', label: 'Mecánica General',         icon: 'build' },
  { value: 'electromecanica',  label: 'Electromecánica',          icon: 'electric_bolt' },
  { value: 'chaperia',         label: 'Chapería y Carrocería',    icon: 'car_repair' },
  { value: 'llanteria',        label: 'Llantas y Neumáticos',     icon: 'tire_repair' },
  { value: 'electricista',     label: 'Electricidad Automotriz',  icon: 'electrical_services' },
  { value: 'pintura',          label: 'Pintura Automotriz',       icon: 'format_paint' },
];

@Component({
  selector: 'app-mi-taller-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-taller-perfil.component.html',
})
export class MiTallerPerfilComponent implements OnInit {
  taller: TallerResponse | null = null;
  cargando   = true;
  guardando  = false;
  editando   = false;
  errorMsg   = '';
  successMsg = '';

  readonly especialidadesOpciones = ESPECIALIDADES;
  especialidadesSeleccionadas = new Set<string>();

  form = {
    nombre: '', direccion: '', telefono: '',
    email_comercial: '', latitud: '', longitud: '',
  };

  constructor(private svc: VehiculoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.svc.miTaller().subscribe({
      next: (t) => {
        this.taller = t;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.errorMsg = e?.error?.detail ?? 'Error al cargar perfil del taller';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  get especialidadesArray(): string[] {
    if (!this.taller?.especialidades) return [];
    try { return JSON.parse(this.taller.especialidades); }
    catch { return []; }
  }

  labelEspecialidad(value: string): string {
    return ESPECIALIDADES.find(e => e.value === value)?.label ?? value;
  }

  iconEspecialidad(value: string): string {
    return ESPECIALIDADES.find(e => e.value === value)?.icon ?? 'build';
  }

  get estadoColor(): string {
    if (this.taller?.estado === 'aprobado')  return '#16A34A';
    if (this.taller?.estado === 'rechazado') return '#DC2626';
    return '#D97706';
  }

  get estadoLabel(): string {
    const mapa: Record<string, string> = { aprobado: 'Aprobado', rechazado: 'Rechazado', pendiente: 'Pendiente de aprobación' };
    return mapa[this.taller?.estado ?? ''] ?? (this.taller?.estado ?? '');
  }

  iniciarEdicion(): void {
    if (!this.taller) return;
    this.form = {
      nombre:          this.taller.nombre ?? '',
      direccion:       this.taller.direccion ?? '',
      telefono:        this.taller.telefono ?? '',
      email_comercial: this.taller.email_comercial ?? '',
      latitud:         this.taller.latitud?.toString() ?? '',
      longitud:        this.taller.longitud?.toString() ?? '',
    };
    this.especialidadesSeleccionadas = new Set(this.especialidadesArray);
    this.editando   = true;
    this.successMsg = '';
    this.errorMsg   = '';
    this.cdr.detectChanges();
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.cdr.detectChanges();
  }

  toggleEspecialidad(value: string): void {
    this.especialidadesSeleccionadas.has(value)
      ? this.especialidadesSeleccionadas.delete(value)
      : this.especialidadesSeleccionadas.add(value);
  }

  guardar(): void {
    if (this.guardando) return;
    if (this.especialidadesSeleccionadas.size === 0) {
      this.errorMsg = 'Selecciona al menos una especialidad.';
      return;
    }
    this.guardando = true;
    this.errorMsg  = '';

    const payload: any = {
      nombre:          this.form.nombre   || undefined,
      direccion:       this.form.direccion || undefined,
      telefono:        this.form.telefono  || undefined,
      email_comercial: this.form.email_comercial || undefined,
      latitud:         this.form.latitud  ? parseFloat(this.form.latitud)  : undefined,
      longitud:        this.form.longitud ? parseFloat(this.form.longitud) : undefined,
      especialidades:  Array.from(this.especialidadesSeleccionadas),
    };

    this.svc.actualizarMiTaller(payload).subscribe({
      next: (t) => {
        this.taller     = t;
        this.guardando  = false;
        this.editando   = false;
        this.successMsg = '¡Datos actualizados correctamente!';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
      },
      error: (e) => {
        this.errorMsg  = e?.error?.detail ?? 'Error al guardar cambios';
        this.guardando = false;
        this.cdr.detectChanges();
      },
    });
  }
}
