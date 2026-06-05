import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface VehiculoPayload {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  numero_seguro?: string;
}

export interface VehiculoResponse {
  id: number;
  usuario_id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  numero_seguro?: string;
  activo: boolean;
  created_at: string;
}

export interface TallerPayload {
  nombre: string;
  direccion: string;
  telefono?: string;
  email_comercial?: string;
  latitud?: number;
  longitud?: number;
}

export interface UserDetailResponse {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  telefono: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
}

export interface UserListResponse {
  items: UserDetailResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UserPayload {
  full_name?: string;
  telefono?: string;
  email?: string;
  role?: string;
}

export interface TallerResponse {
  id: number;
  usuario_id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email_comercial?: string;
  latitud?: number;
  longitud?: number;
  disponible: boolean;
  estado: string;
  rating: number;
  especialidades?: string | null;
  tenant_id?: number | null;
  tenant_nombre?: string | null;
  created_at: string;
}

export interface TallerUpdatePayload {
  nombre?:          string;
  direccion?:       string;
  telefono?:        string;
  email_comercial?: string;
  latitud?:         number;
  longitud?:        number;
  especialidades?:  string[];
}

@Injectable({ providedIn: 'root' })
export class VehiculoService {
  private readonly API = `${environment.apiUrl}/api/acceso`;

  constructor(private http: HttpClient) {}

  registrar(payload: VehiculoPayload): Observable<VehiculoResponse> {
    return this.http.post<VehiculoResponse>(`${this.API}/vehiculos`, payload);
  }

  listar(): Observable<VehiculoResponse[]> {
    return this.http.get<VehiculoResponse[]>(`${this.API}/vehiculos`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/vehiculos/${id}`);
  }

  registrarTaller(payload: TallerPayload): Observable<TallerResponse> {
    return this.http.post<TallerResponse>(`${this.API}/talleres`, payload);
  }

  listarTalleres(estado?: string): Observable<TallerResponse[]> {
    const params = estado ? `?estado=${estado}` : '';
    return this.http.get<TallerResponse[]>(`${this.API}/talleres${params}`).pipe(timeout(8000));
  }

  aprobarTaller(id: number, tenantId?: number | null): Observable<TallerResponse> {
    const body = tenantId != null ? { tenant_id: tenantId } : {};
    return this.http.patch<TallerResponse>(`${this.API}/talleres/${id}/aprobar`, body).pipe(timeout(8000));
  }

  rechazarTaller(id: number): Observable<TallerResponse> {
    return this.http.patch<TallerResponse>(`${this.API}/talleres/${id}/rechazar`, {}).pipe(timeout(8000));
  }

  listarTenants(): Observable<{ id: number; nombre: string; slug: string; activo: boolean }[]> {
    return this.http.get<{ id: number; nombre: string; slug: string; activo: boolean }[]>(
      `${this.API}/tenants`
    ).pipe(timeout(8000));
  }

  // ── Mi perfil de taller ──────────────────────────────────
  miTaller(): Observable<TallerResponse> {
    return this.http.get<TallerResponse>(`${this.API}/mi-taller`).pipe(timeout(8000));
  }

  actualizarMiTaller(data: TallerUpdatePayload): Observable<TallerResponse> {
    return this.http.patch<TallerResponse>(`${this.API}/mi-taller`, data).pipe(timeout(8000));
  }

  // ── CU27 - Gestionar usuarios ──────────────────────────────
  listarUsuarios(params: {
    role?: string; activo?: boolean; search?: string; page?: number; size?: number;
  } = {}): Observable<UserListResponse> {
    let query = '';
    const p: string[] = [];
    if (params.role)             p.push(`role=${params.role}`);
    if (params.activo !== undefined) p.push(`activo=${params.activo}`);
    if (params.search)           p.push(`search=${encodeURIComponent(params.search)}`);
    if (params.page)             p.push(`page=${params.page}`);
    if (params.size)             p.push(`size=${params.size}`);
    if (p.length) query = '?' + p.join('&');
    return this.http.get<UserListResponse>(`${this.API}/usuarios${query}`).pipe(timeout(8000));
  }

  actualizarUsuario(id: number, data: Partial<UserPayload>): Observable<UserDetailResponse> {
    return this.http.patch<UserDetailResponse>(`${this.API}/usuarios/${id}`, data).pipe(timeout(8000));
  }

  activarUsuario(id: number): Observable<UserDetailResponse> {
    return this.http.patch<UserDetailResponse>(`${this.API}/usuarios/${id}/activar`, {}).pipe(timeout(8000));
  }

  desactivarUsuario(id: number): Observable<UserDetailResponse> {
    return this.http.patch<UserDetailResponse>(`${this.API}/usuarios/${id}/desactivar`, {}).pipe(timeout(8000));
  }
}
