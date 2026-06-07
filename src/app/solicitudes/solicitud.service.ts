import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { AsignacionResponse } from '../talleres-tecnicos/tecnico.service';

export interface AsignacionResumen {
  id: number;
  estado: string;
  eta: number | null;
  taller_id: number;
  taller_nombre: string | null;
  tecnico_id: number | null;
  observacion: string | null;
}

export interface IncidenteResumen {
  id: number;
  vehiculo_id: number;
  estado: string;
  prioridad: string;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
}

export interface MiSolicitud {
  incidente: IncidenteResumen;
  asignacion: AsignacionResumen | null;
  fotos_urls: string[];
}

export interface CalificacionPendiente {
  asignacion_id: number;
  incidente_id: number;
  taller_id: number;
  taller_nombre: string | null;
  fecha_finalizacion: string | null;
}

export interface SolicitudDisponible {
  incidente_id: number;
  latitud: number | null;
  longitud: number | null;
  descripcion: string | null;
  tipo_problema: string;
  prioridad: string;
  estado: string;
  fotos_urls: string[];
  tiene_audio: boolean;
  created_at: string;
  es_sos: boolean;
  distancia_km: number | null;
  eta_min: number | null;
  score_ia: number;
}

export interface TallerCandidato {
  taller_id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  rating: number;
  especialidades: string[];
  distancia_km: number | null;
  eta_min: number | null;
  estado_asignacion: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly API = `${environment.apiUrl}/api/solicitudes`;
  private readonly REPORTES_API = `${environment.apiUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  misSolicitudes(): Observable<MiSolicitud[]> {
    return this.http
      .get<MiSolicitud[]>(`${environment.apiUrl}/api/emergencias/mis-solicitudes`)
      .pipe(timeout(12000));
  }

  listarDisponibles(): Observable<SolicitudDisponible[]> {
    return this.http.get<SolicitudDisponible[]>(`${this.API}/disponibles`).pipe(timeout(12000));
  }

  misAsignacionesActivas(): Observable<AsignacionResponse[]> {
    return this.http.get<AsignacionResponse[]>(`${this.API}/mis-asignaciones`).pipe(timeout(12000));
  }

  /** CU15 – incidente_id es el id devuelto en listar disponibles. */
  aceptar(incidenteId: number, eta?: number | null): Observable<AsignacionResponse> {
    const body: { eta?: number } = {};
    if (eta != null && eta > 0) body.eta = eta;
    return this.http
      .patch<AsignacionResponse>(`${this.API}/${incidenteId}/aceptar`, body)
      .pipe(timeout(15000));
  }

  /** CU11 – Cliente cancela su incidente. */
  cancelar(incidenteId: number): Observable<{ id: number; estado: string; msg: string }> {
    return this.http
      .patch<{ id: number; estado: string; msg: string }>(`${this.API}/${incidenteId}/cancelar`, {})
      .pipe(timeout(10000));
  }

  /** CU16 – Taller rechaza su asignación activa para un incidente. */
  rechazar(incidenteId: number): Observable<{ asignacion_id: number; estado: string; msg: string }> {
    return this.http
      .patch<{ asignacion_id: number; estado: string; msg: string }>(`${this.API}/${incidenteId}/rechazar`, {})
      .pipe(timeout(10000));
  }

  tallersCandidatos(incidenteId: number): Observable<TallerCandidato[]> {
    return this.http.get<TallerCandidato[]>(`${this.API}/${incidenteId}/talleres-candidatos`).pipe(timeout(10000));
  }

  pendientesCalificacion(): Observable<CalificacionPendiente[]> {
    return this.http
      .get<CalificacionPendiente[]>(`${this.REPORTES_API}/calificaciones/pendientes`)
      .pipe(timeout(10000));
  }

  calificar(asignacionId: number, puntuacion: number, resena?: string): Observable<unknown> {
    return this.http
      .post(`${this.REPORTES_API}/calificaciones`, {
        asignacion_id: asignacionId,
        puntuacion,
        resena,
      })
      .pipe(timeout(10000));
  }
}
