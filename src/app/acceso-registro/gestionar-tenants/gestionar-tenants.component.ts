import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Tenant {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activo: boolean;
  config: string | null;
  created_at: string;
}

interface TenantDetalle extends Tenant {
  usuarios: { id: number; username: string; full_name: string | null; email: string; role: string }[];
  talleres: { id: number; nombre: string; estado: string; disponible: boolean }[];
}

interface Usuario {
  id: number;
  username: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface Taller {
  id: number;
  nombre: string;
  estado: string;
}

@Component({
  selector: 'app-gestionar-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-tenants.component.html',
})
export class GestionarTenantsComponent implements OnInit {
  private readonly API = `${environment.apiUrl}/api/acceso/tenants`;
  private readonly ACCESO = `${environment.apiUrl}/api/acceso`;

  tenants: Tenant[] = [];
  detalle: TenantDetalle | null = null;
  loading = false;
  loadingDetalle = false;
  msg: { tipo: 'ok' | 'error'; texto: string } | null = null;

  // Formulario nuevo tenant
  mostrarForm = false;
  guardando = false;
  form = { nombre: '', slug: '', descripcion: '' };

  // Edición inline
  editando: number | null = null;
  editForm = { nombre: '', descripcion: '', activo: true };

  // Asignación de usuario
  todosUsuarios: Usuario[] = [];
  todosLostalleres: Taller[] = [];
  asignandoUsuario = false;
  asignandoTaller = false;
  usuarioIdSeleccionado: number | null = null;
  tallerIdSeleccionado: number | null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.http.get<Tenant[]>(this.API).subscribe({
      next: (data) => { this.tenants = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  abrirDetalle(id: number): void {
    if (this.detalle?.id === id) { this.detalle = null; return; }
    this.loadingDetalle = true;
    this.detalle = null;
    this.http.get<TenantDetalle>(`${this.API}/${id}`).subscribe({
      next: (d) => { this.detalle = d; this.loadingDetalle = false; this.cdr.detectChanges(); },
      error: () => { this.loadingDetalle = false; this.cdr.detectChanges(); },
    });
  }

  crearTenant(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.msg = null;
    this.http.post<Tenant>(this.API, this.form).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarForm = false;
        this.form = { nombre: '', slug: '', descripcion: '' };
        this.msg = { tipo: 'ok', texto: 'Tenant creado correctamente.' };
        this.cargar();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.guardando = false;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al crear tenant.' };
        this.cdr.detectChanges();
      },
    });
  }

  iniciarEdicion(t: Tenant): void {
    this.editando = t.id;
    this.editForm = { nombre: t.nombre, descripcion: t.descripcion ?? '', activo: t.activo };
  }

  guardarEdicion(id: number): void {
    this.http.patch<Tenant>(`${this.API}/${id}`, this.editForm).subscribe({
      next: () => {
        this.editando = null;
        this.msg = { tipo: 'ok', texto: 'Tenant actualizado.' };
        this.cargar();
        if (this.detalle?.id === id) this.abrirDetalle(id);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al actualizar.' };
        this.cdr.detectChanges();
      },
    });
  }

  desactivar(id: number, nombre: string): void {
    if (!confirm(`¿Desactivar el tenant "${nombre}"? Los usuarios asignados quedarán sin tenant.`)) return;
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => {
        this.msg = { tipo: 'ok', texto: 'Tenant desactivado.' };
        if (this.detalle?.id === id) this.detalle = null;
        this.cargar();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al desactivar.' };
        this.cdr.detectChanges();
      },
    });
  }

  cargarUsuariosDisponibles(): void {
    this.http.get<{ items: Usuario[] }>(`${this.ACCESO}/usuarios?size=100`).subscribe({
      next: (r) => { this.todosUsuarios = r.items; this.cdr.detectChanges(); },
    });
  }

  cargarTalleresDisponibles(): void {
    this.http.get<Taller[]>(`${this.ACCESO}/talleres`).subscribe({
      next: (t) => { this.todosLostalleres = t; this.cdr.detectChanges(); },
    });
  }

  asignarUsuario(tenantId: number): void {
    if (!this.usuarioIdSeleccionado) return;
    this.asignandoUsuario = true;
    this.http.post(`${this.API}/${tenantId}/usuarios`, { usuario_id: this.usuarioIdSeleccionado }).subscribe({
      next: () => {
        this.asignandoUsuario = false;
        this.usuarioIdSeleccionado = null;
        this.msg = { tipo: 'ok', texto: 'Usuario asignado al tenant.' };
        this.abrirDetalle(tenantId);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.asignandoUsuario = false;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al asignar usuario.' };
        this.cdr.detectChanges();
      },
    });
  }

  removerUsuario(tenantId: number, usuarioId: number): void {
    this.http.delete(`${this.API}/${tenantId}/usuarios/${usuarioId}`).subscribe({
      next: () => {
        this.msg = { tipo: 'ok', texto: 'Usuario removido del tenant.' };
        this.abrirDetalle(tenantId);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al remover usuario.' };
        this.cdr.detectChanges();
      },
    });
  }

  asignarTaller(tenantId: number): void {
    if (!this.tallerIdSeleccionado) return;
    this.asignandoTaller = true;
    this.http.post(`${this.API}/${tenantId}/talleres`, { taller_id: this.tallerIdSeleccionado }).subscribe({
      next: () => {
        this.asignandoTaller = false;
        this.tallerIdSeleccionado = null;
        this.msg = { tipo: 'ok', texto: 'Taller asignado al tenant.' };
        this.abrirDetalle(tenantId);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.asignandoTaller = false;
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al asignar taller.' };
        this.cdr.detectChanges();
      },
    });
  }

  removerTaller(tenantId: number, tallerId: number): void {
    this.http.delete(`${this.API}/${tenantId}/talleres/${tallerId}`).subscribe({
      next: () => {
        this.msg = { tipo: 'ok', texto: 'Taller removido del tenant.' };
        this.abrirDetalle(tenantId);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.msg = { tipo: 'error', texto: e?.error?.detail ?? 'Error al remover taller.' };
        this.cdr.detectChanges();
      },
    });
  }

  slugDesdeNombre(): void {
    this.form.slug = this.form.nombre
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
  }

  roleLabel(r: string): string {
    const m: Record<string, string> = { cliente: 'Cliente', taller: 'Taller', tecnico: 'Técnico', admin: 'Admin' };
    return m[r] ?? r;
  }

  roleClass(r: string): string {
    const m: Record<string, string> = { cliente: 'badge-info', taller: 'badge-warning', tecnico: 'badge-success', admin: 'badge-danger' };
    return m[r] ?? 'badge-muted';
  }
}
