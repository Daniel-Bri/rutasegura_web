import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TecnicoCreate {
  nombre: string;
  especialidad: string;
  telefono?: string;
  email?: string;
}

export interface TecnicoUpdate {
  nombre?: string;
  especialidad?: string;
  telefono?: string;
  estado?: string;
  email?: string;
}

export interface TecnicoResponse {
  id: number;
  usuario_id?: number;
  taller_id: number;
  nombre: string;
  especialidad: string;
  telefono?: string;
  email?: string;
  estado: string;
  activo: boolean;
  created_at: string;
}

export interface RepuestoItem {
  descripcion: string;
  cantidad: number;
}

export interface ServicioRealizadoCreate {
  asignacion_id: number;
  descripcion_trabajo: string;
  repuestos?: RepuestoItem[];
  observaciones?: string;
}

export interface ServicioRealizadoResponse {
  id: number;
  asignacion_id: number;
  descripcion_trabajo: string;
  repuestos: string | null;
  observaciones: string | null;
  fecha_cierre: string;
}

export interface TallerInfoResponse {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email_comercial?: string;
  disponible: boolean;
  estado: string;
  rating: number;
  total_tecnicos: number;
  tecnicos_disponibles: number;
  tecnicos_ocupados: number;
}

export interface AsignacionResponse {
  id: number;
  incidente_id: number;
  taller_id: number;
  tecnico_id: number | null;
  estado: string;
  eta: number | null;
  observacion: string | null;
  created_at: string;
  es_sos: boolean;
}

@Injectable({ providedIn: 'root' })
export class TecnicoService {
  private readonly API = `${environment.apiUrl}/api/talleres`;

  constructor(private http: HttpClient) {}

  listar(): Observable<TecnicoResponse[]> {
    return this.http.get<TecnicoResponse[]>(`${this.API}/tecnicos`).pipe(timeout(8000));
  }

  registrar(data: TecnicoCreate): Observable<TecnicoResponse> {
    return this.http.post<TecnicoResponse>(`${this.API}/tecnicos`, data).pipe(timeout(8000));
  }

  actualizar(id: number, data: TecnicoUpdate): Observable<TecnicoResponse> {
    return this.http.patch<TecnicoResponse>(`${this.API}/tecnicos/${id}`, data).pipe(timeout(8000));
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/tecnicos/${id}`).pipe(timeout(8000));
  }

  listarAsignacionesPendientes(): Observable<AsignacionResponse[]> {
    return this.http.get<AsignacionResponse[]>(`${this.API}/asignaciones/pendientes`).pipe(timeout(8000));
  }

  getMiTaller(): Observable<TallerInfoResponse> {
    return this.http.get<TallerInfoResponse>(`${this.API}/mi-taller`).pipe(timeout(8000));
  }

  actualizarDisponibilidad(disponible: boolean): Observable<TallerInfoResponse> {
    return this.http.patch<TallerInfoResponse>(`${this.API}/disponibilidad`, { disponible }).pipe(timeout(8000));
  }

  listarAsignacionesListas(): Observable<AsignacionResponse[]> {
    return this.http.get<AsignacionResponse[]>(`${this.API}/servicios/listas`).pipe(timeout(8000));
  }

  registrarServicio(data: ServicioRealizadoCreate): Observable<ServicioRealizadoResponse> {
    return this.http.post<ServicioRealizadoResponse>(`${this.API}/servicios`, data).pipe(timeout(8000));
  }

  listarServiciosRealizados(): Observable<ServicioRealizadoResponse[]> {
    return this.http.get<ServicioRealizadoResponse[]>(`${this.API}/servicios`).pipe(timeout(8000));
  }

  parsearRepuestos(raw: string | null): RepuestoItem[] {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  listarActivas(): Observable<AsignacionResponse[]> {
    return this.http.get<AsignacionResponse[]>(`${this.API}/asignaciones/activas`).pipe(timeout(8000));
  }

  actualizarEstado(id: number, estado: string, observacion?: string): Observable<AsignacionResponse> {
    return this.http
      .patch<AsignacionResponse>(`${this.API}/asignaciones/${id}/estado`, { estado, observacion })
      .pipe(timeout(8000));
  }

  registrarCobroVisita(asignacionId: number, monto: number, concepto: string): Observable<unknown> {
    return this.http
      .post(`${this.API}/asignaciones/${asignacionId}/cobro-visita`, { monto, concepto })
      .pipe(timeout(8000));
  }

  asignarTecnico(asignacionId: number, tecnicoId: number): Observable<AsignacionResponse> {
    return this.http
      .patch<AsignacionResponse>(`${this.API}/asignaciones/${asignacionId}/asignar-tecnico`, { tecnico_id: tecnicoId })
      .pipe(timeout(8000));
  }
}
