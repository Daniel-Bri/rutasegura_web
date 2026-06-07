import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PagoDetalle {
  pago_id: number;
  monto: number;
  metodo: string;
  fecha: string | null;
  cotizacion_id: number;
  incidente_id: number;
}

export interface MetricasResumenResponse {
  desde: string | null;
  hasta: string | null;
  total_servicios: number;
  servicios_finalizados: number;
  servicios_pagados: number;
  ingresos_brutos: number;
  comision_plataforma: number;
  ingresos_netos: number;
  ticket_promedio: number;
  promedio_calificacion: number | null;
  total_calificaciones: number;
  detalle_pagos: PagoDetalle[];
}

export interface CalificacionPendienteItem {
  asignacion_id: number;
  incidente_id: number;
  taller_id: number;
  taller_nombre: string | null;
  fecha_finalizacion: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly API = `${environment.apiUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  metricasGlobales(params: { desde?: string; hasta?: string } = {}): Observable<MetricasResumenResponse> {
    const q = this.buildQuery(params);
    return this.http.get<MetricasResumenResponse>(`${this.API}/metricas/globales${q}`).pipe(timeout(12000));
  }

  metricasTaller(params: { desde?: string; hasta?: string } = {}): Observable<MetricasResumenResponse> {
    const q = this.buildQuery(params);
    return this.http.get<MetricasResumenResponse>(`${this.API}/metricas/taller${q}`).pipe(timeout(12000));
  }

  pendientesCalificacion(): Observable<CalificacionPendienteItem[]> {
    return this.http.get<CalificacionPendienteItem[]>(`${this.API}/calificaciones/pendientes`).pipe(timeout(10000));
  }

  calificar(payload: { asignacion_id: number; puntuacion: number; resena?: string }): Observable<unknown> {
    return this.http.post(`${this.API}/calificaciones`, payload).pipe(timeout(10000));
  }

  // CU44
  listarCalificaciones(taller_id?: number): Observable<CalificacionAdmin[]> {
    const q = taller_id ? `?taller_id=${taller_id}` : '';
    return this.http.get<CalificacionAdmin[]>(`${this.API}/calificaciones${q}`).pipe(timeout(10000));
  }

  cambiarEstadoCalificacion(id: number, estado: 'activa' | 'eliminada'): Observable<CalificacionAdmin> {
    return this.http.patch<CalificacionAdmin>(`${this.API}/calificaciones/${id}/estado`, { estado }).pipe(timeout(10000));
  }

  // CU43
  rankingTalleres(): Observable<TallerRanking[]> {
    return this.http.get<TallerRanking[]>(`${this.API}/ranking-talleres`).pipe(timeout(10000));
  }

  // Backup / Restore
  descargarBackup(): Observable<Blob> {
    return this.http.get(`${this.API}/backup`, { responseType: 'blob' }).pipe(timeout(60000));
  }

  restaurarBackup(data: object): Observable<{ ok: boolean; tablas_restauradas: string[] }> {
    return this.http.post<{ ok: boolean; tablas_restauradas: string[] }>(`${this.API}/restore`, data).pipe(timeout(60000));
  }

  kpis(params: { desde?: string; hasta?: string; tenant_id?: number } = {}): Observable<KpisResponse> {
    const p: string[] = [];
    if (params.desde)     p.push(`desde=${encodeURIComponent(params.desde)}`);
    if (params.hasta)     p.push(`hasta=${encodeURIComponent(params.hasta)}`);
    if (params.tenant_id) p.push(`tenant_id=${params.tenant_id}`);
    const q = p.length ? `?${p.join('&')}` : '';
    return this.http.get<KpisResponse>(`${this.API}/kpis${q}`).pipe(timeout(15000));
  }

  private buildQuery(params: { desde?: string; hasta?: string }): string {
    const p: string[] = [];
    if (params.desde) p.push(`desde=${encodeURIComponent(params.desde)}`);
    if (params.hasta) p.push(`hasta=${encodeURIComponent(params.hasta)}`);
    return p.length ? `?${p.join('&')}` : '';
  }
}

export interface TallerEficiente {
  taller_id: number;
  nombre: string;
  tiempo_promedio_min: number;
  total_servicios: number;
}

export interface ZonaCaliente {
  lat: number;
  lon: number;
  total: number;
}

export interface KpisResponse {
  tiempo_promedio_asignacion_min: number;
  tiempo_promedio_llegada_min:    number;
  tiempo_promedio_servicio_min:   number;
  total_incidentes:               number;
  total_servicios_completados:    number;
  casos_cancelados_asignacion:    number;
  casos_cancelados_incidente:     number;
  sla_compliance_pct:             number;
  sla_minutos:                    number;
  dentro_sla:                     number;
  incidentes_por_tipo:            Record<string, number>;
  talleres_eficientes:            TallerEficiente[];
  zonas_calientes:                ZonaCaliente[];
}

export interface CalificacionAdmin {
  id: number;
  asignacion_id: number;
  cliente_id: number;
  taller_id: number;
  puntuacion: number;
  comentario: string | null;
  estado: string;
  created_at: string;
  taller_nombre: string | null;
  cliente_nombre: string | null;
}

export interface ResenaReciente {
  puntuacion: number;
  comentario: string | null;
  created_at: string | null;
}

export interface TallerRanking {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  rating: number;
  total_calificaciones: number;
  especialidades: string[];
  resenas_recientes: ResenaReciente[];
}
