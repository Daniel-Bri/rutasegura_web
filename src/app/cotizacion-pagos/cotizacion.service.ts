import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ItemCotizacion {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CotizacionCreate {
  incidente_id: number;
  items: ItemCotizacion[];
  tiempo_estimado_horas?: number | null;
}

export interface CotizacionResponse {
  id: number;
  incidente_id: number;
  taller_id: number;
  monto_estimado: number;
  detalle: string | null;
  estado: string;
  estado_asignacion?: string | null;
  tiempo_estimado_horas?: number | null;
  taller_nombre?: string | null;
  taller_rating?: number | null;
  created_at: string;
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

export interface IncidenteDisponible {
  asignacion_id: number;
  incidente_id: number;
  estado_asignacion: string;
  created_at: string;
}

export interface PagoCreate {
  cotizacion_id: number;
  metodo: string;
}

export interface PagoResponse {
  id: number;
  cotizacion_id: number;
  monto: number;
  metodo: string;
  estado: string;
  created_at: string;
}

export interface ComisionItem {
  pago_id: number;
  cotizacion_id: number;
  incidente_id: number;
  monto_bruto: number;
  comision: number;
  monto_neto: number;
  metodo: string;
  fecha: string;
}

export interface ComisionesResponse {
  taller_id: number;
  total_servicios: number;
  ingresos_brutos: number;
  tasa_comision: number;
  comision_plataforma: number;
  ingresos_netos: number;
  pagos: ComisionItem[];
}

export interface HistorialItem {
  id: number;
  asignacion_id: number;
  descripcion_trabajo: string;
  repuestos: string | null;
  observaciones: string | null;
  fecha_cierre: string;
  monto_cotizacion: number | null;
  incidente_id: number | null;
  descripcion: string | null;
  tipo_incidente: string | null;
}

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private readonly API = `${environment.apiUrl}/api/pagos`;
  private readonly REPORTES = `${environment.apiUrl}/api/reportes`;

  constructor(private http: HttpClient) {}

  listarIncidentesDisponibles(): Observable<IncidenteDisponible[]> {
    return this.http.get<IncidenteDisponible[]>(`${this.API}/incidentes-disponibles`).pipe(timeout(8000));
  }

  generar(data: CotizacionCreate): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(`${this.API}/cotizaciones`, data).pipe(timeout(8000));
  }

  listar(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(`${this.API}/cotizaciones`).pipe(timeout(8000));
  }

  misCotizaciones(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(`${this.API}/mis-cotizaciones`).pipe(timeout(8000));
  }

  getById(id: number): Observable<CotizacionResponse> {
    return this.http.get<CotizacionResponse>(`${this.API}/cotizaciones/${id}`).pipe(timeout(8000));
  }

  actualizarEstado(id: number, estado: 'aceptada' | 'rechazada'): Observable<CotizacionResponse> {
    return this.http.patch<CotizacionResponse>(`${this.API}/cotizaciones/${id}/estado`, { estado }).pipe(timeout(8000));
  }

  realizarPago(data: PagoCreate): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.API}/pagos`, data).pipe(timeout(10000));
  }

  listarComisiones(): Observable<ComisionesResponse> {
    return this.http.get<ComisionesResponse>(`${this.API}/comisiones`).pipe(timeout(10000));
  }

  listarHistorial(): Observable<HistorialItem[]> {
    return this.http.get<HistorialItem[]>(`${this.REPORTES}/historial`).pipe(timeout(10000));
  }

  tallersCandidatos(incidenteId: number): Observable<TallerCandidato[]> {
    return this.http.get<TallerCandidato[]>(`${environment.apiUrl}/api/solicitudes/${incidenteId}/talleres-candidatos`).pipe(timeout(8000));
  }

  parsearItems(detalle: string | null): ItemCotizacion[] {
    if (!detalle) return [];
    try { return JSON.parse(detalle); } catch { return []; }
  }
}
