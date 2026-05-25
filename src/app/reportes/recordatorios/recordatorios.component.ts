import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Recordatorio {
  vehiculo_id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  alertas: { categoria: string; dias_desde_ultimo: number; recomendacion: string }[];
}

@Component({
  selector: 'app-recordatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recordatorios.component.html',
})
export class RecordatoriosComponent implements OnInit {
  recordatorios: Recordatorio[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.http
      .get<Recordatorio[]>(`${environment.apiUrl}/api/reportes/mantenimiento`)
      .subscribe({
        next: (data) => { this.recordatorios = data; this.loading = false; },
        error: (e) => {
          this.loading = false;
          this.error = e?.error?.detail ?? 'Error al cargar los recordatorios.';
        },
      });
  }

  alertaClass(dias: number): string {
    if (dias >= 180) return 'badge-danger';
    if (dias >= 90)  return 'badge-warning';
    return 'badge-info';
  }
}
