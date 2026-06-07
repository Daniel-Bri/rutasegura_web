import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TecnicoService,
  TecnicoResponse,
  AsignacionResponse,
} from '../tecnico.service';
import { DataCacheService } from '../../core/services/data-cache.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';

const TTL_2MIN = 2 * 60 * 1000;

type PanelMode = 'registrar' | 'editar' | null;

@Component({
  selector: 'app-gestionar-tecnicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-tecnicos.component.html',
})
export class GestionarTecnicosComponent implements OnInit {

  // ── Datos ──────────────────────────────────────────────
  tecnicos: TecnicoResponse[] = [];
  asignaciones: AsignacionResponse[] = [];

  // ── Carga ──────────────────────────────────────────────
  loadingTecnicos  = false;
  loadingAsig      = false;
  errorTecnicos    = '';
  errorAsig        = '';

  // ── Panel registro / edición ───────────────────────────
  panelMode: PanelMode = null;
  editandoId: number | null = null;

  form = { nombre: '', especialidad: '', telefono: '', email: '' };
  guardando = false;
  formError = '';
  formSuccess = '';

  // ── Asignar ────────────────────────────────────────────
  asignandoId: number | null = null;
  tecnicoSeleccionado: Record<number, number | null> = {};
  asigMensaje: Record<number, { tipo: 'ok' | 'error'; texto: string }> = {};

  // ── Desactivar ─────────────────────────────────────────
  desactivando: Record<number, boolean> = {};

  // ── Búsqueda ───────────────────────────────────────────
  busquedaTec = '';

  get tecnicosFiltrados(): TecnicoResponse[] {
    const q = this.busquedaTec.trim().toLowerCase();
    if (!q) return this.tecnicos;
    return this.tecnicos.filter(t =>
      t.nombre.toLowerCase().includes(q) ||
      (t.especialidad ?? '').toLowerCase().includes(q) ||
      (t.email ?? '').toLowerCase().includes(q)
    );
  }

  constructor(
    private svc: TecnicoService,
    private cdr: ChangeDetectorRef,
    private cache: DataCacheService,
    private offlineQueue: OfflineQueueService,
  ) {}

  ngOnInit(): void {
    this.cargarTecnicos();
    this.cargarAsignaciones();
  }

  // ── Carga de datos ─────────────────────────────────────
  cargarTecnicos(force = false): void {
    this.loadingTecnicos = true;
    this.errorTecnicos   = '';
    if (force) this.cache.invalidate('tecnicos');
    this.cache.get('tecnicos', TTL_2MIN, () => this.svc.listar()).subscribe({
      next: (data) => { this.tecnicos = data; this.loadingTecnicos = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorTecnicos = err.error?.detail ?? 'Error al cargar técnicos';
        this.loadingTecnicos = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarAsignaciones(force = false): void {
    this.loadingAsig = true;
    this.errorAsig   = '';
    if (force) this.cache.invalidate('asignaciones-pendientes');
    this.cache.get('asignaciones-pendientes', TTL_2MIN, () => this.svc.listarAsignacionesPendientes()).subscribe({
      next: (data) => { this.asignaciones = data; this.loadingAsig = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorAsig = err.error?.detail ?? 'Error al cargar asignaciones';
        this.loadingAsig = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Panel form ─────────────────────────────────────────
  abrirRegistrar(): void {
    this.form        = { nombre: '', especialidad: '', telefono: '', email: '' };
    this.formError   = '';
    this.formSuccess = '';
    this.editandoId  = null;
    this.panelMode   = 'registrar';
  }

  abrirEditar(t: TecnicoResponse): void {
    this.form        = { nombre: t.nombre, especialidad: t.especialidad, telefono: t.telefono ?? '', email: '' };
    this.formError   = '';
    this.formSuccess = '';
    this.editandoId  = t.id;
    this.panelMode   = 'editar';
  }

  cerrarPanel(): void {
    this.panelMode  = null;
    this.editandoId = null;
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.especialidad.trim()) {
      this.formError = 'Nombre y especialidad son obligatorios';
      return;
    }
    this.guardando = true;
    this.formError = '';
    this.formSuccess = '';

    const payload = {
      nombre:       this.form.nombre.trim(),
      especialidad: this.form.especialidad.trim(),
      telefono:     this.form.telefono.trim() || undefined,
      email:        this.form.email.trim() || undefined,
    };

    if (this.panelMode === 'registrar') {
      if (!this.offlineQueue.isOnline) {
        this.offlineQueue.encolar('/api/talleres/tecnicos', 'POST', payload, `Registrar técnico: ${payload.nombre}`);
        this.formSuccess = '📶 Sin conexión — se registrará al volver internet';
        this.guardando = false;
        setTimeout(() => this.cerrarPanel(), 2000);
        this.cdr.detectChanges();
        return;
      }
      this.svc.registrar(payload).subscribe({
        next: (nuevo) => {
          this.tecnicos = [nuevo, ...this.tecnicos];
          this.cache.invalidate('tecnicos');
          this.formSuccess = 'Técnico registrado correctamente';
          this.guardando = false;
          setTimeout(() => this.cerrarPanel(), 1500);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.formError = err.error?.detail ?? 'Error al registrar técnico';
          this.guardando = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      if (!this.offlineQueue.isOnline) {
        this.offlineQueue.encolar(`/api/talleres/tecnicos/${this.editandoId}`, 'PATCH', payload, `Editar técnico #${this.editandoId}`);
        this.formSuccess = '📶 Sin conexión — se actualizará al volver internet';
        this.guardando = false;
        setTimeout(() => this.cerrarPanel(), 2000);
        this.cdr.detectChanges();
        return;
      }
      this.svc.actualizar(this.editandoId!, payload).subscribe({
        next: (actualizado) => {
          this.tecnicos = this.tecnicos.map((t) => t.id === actualizado.id ? actualizado : t);
          this.cache.invalidate('tecnicos');
          this.formSuccess = 'Técnico actualizado correctamente';
          this.guardando = false;
          setTimeout(() => this.cerrarPanel(), 1500);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.formError = err.error?.detail ?? 'Error al actualizar técnico';
          this.guardando = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  // ── Desactivar ─────────────────────────────────────────
  desactivar(t: TecnicoResponse): void {
    if (!confirm(`¿Desactivar a ${t.nombre}?`)) return;
    this.desactivando[t.id] = true;
    this.svc.desactivar(t.id).subscribe({
      next: () => {
        this.tecnicos = this.tecnicos.filter((x) => x.id !== t.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.desactivando[t.id] = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Asignar ────────────────────────────────────────────
  asignar(asig: AsignacionResponse): void {
    const tecnicoId = this.tecnicoSeleccionado[asig.id];
    if (!tecnicoId) { this.asigMensaje[asig.id] = { tipo: 'error', texto: 'Selecciona un técnico' }; return; }
    this.asignandoId = asig.id;

    if (!this.offlineQueue.isOnline) {
      this.offlineQueue.encolar(`/api/talleres/asignaciones/${asig.id}/asignar-tecnico`, 'PATCH', { tecnico_id: tecnicoId }, `Asignar técnico a solicitud #${asig.id}`);
      this.asigMensaje[asig.id] = { tipo: 'ok', texto: '📶 Sin conexión — se sincronizará al volver internet' };
      this.asignandoId = null;
      this.cdr.detectChanges();
      return;
    }

    this.svc.asignarTecnico(asig.id, tecnicoId).subscribe({
      next: () => {
        this.asignaciones = this.asignaciones.filter((a) => a.id !== asig.id);
        this.cache.invalidate('asignaciones-pendientes');
        this.cache.invalidate('asignaciones-activas');
        this.cargarTecnicos(true);
        this.asignandoId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.asigMensaje[asig.id] = { tipo: 'error', texto: err.error?.detail ?? 'Error al asignar' };
        this.asignandoId = null;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────
  badgeEstado(estado: string): string {
    return { disponible: 'badge-success', ocupado: 'badge-warning', inactivo: 'badge-muted' }[estado] ?? 'badge-muted';
  }

  get disponibles(): TecnicoResponse[] {
    return this.tecnicos.filter((t) => t.estado === 'disponible');
  }
}
