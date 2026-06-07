import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService, TallerRanking } from '../reportes.service';

@Component({
  selector: 'app-ranking-talleres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ranking-talleres.component.html',
})
export class RankingTalleresComponent implements OnInit {
  talleres: TallerRanking[] = [];
  loading = false;
  errorMsg = '';
  expandido: number | null = null;
  busqueda = '';

  get filtrados(): TallerRanking[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.talleres;
    return this.talleres.filter(t =>
      t.nombre.toLowerCase().includes(q) ||
      (t.direccion ?? '').toLowerCase().includes(q) ||
      (t.especialidades ?? []).some((e: string) => e.toLowerCase().includes(q))
    );
  }

  constructor(private reportes: ReportesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    this.reportes.rankingTalleres().subscribe({
      next: (data) => {
        this.talleres = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail ?? 'No se pudo cargar el ranking';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  estrellas(rating: number): string {
    const llenas = Math.floor(rating);
    const media = rating - llenas >= 0.5 ? 1 : 0;
    return '★'.repeat(llenas) + (media ? '½' : '') + '☆'.repeat(5 - llenas - media);
  }

  toggleResenas(id: number): void {
    this.expandido = this.expandido === id ? null : id;
  }
}
