import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../acceso-registro/auth.service';
import { environment } from '../../../environments/environment';

interface AnalisisIA {
  categoria: string;
  etiqueta_es: string;
  severidad: string;
  severidad_es: string;
  confianza: number;
  descripcion_auto: string;
  advertencia: string;
}

@Component({
  selector: 'app-adjuntar-fotos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adjuntar-fotos.component.html',
})
export class AdjuntarFotosComponent {
  incidenteId: number | null = null;
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  uploading = false;
  analisisIA: AnalisisIA | null = null;
  fotosSubidas: { url: string; analisis: AnalisisIA | null }[] = [];
  errorMsg = '';
  successMsg = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    const id = this.route.snapshot.queryParamMap.get('id');
    this.incidenteId = id ? parseInt(id, 10) : null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMsg = 'Solo se permiten archivos de imagen (JPG, PNG, WEBP).';
      return;
    }
    this.selectedFile = file;
    this.analisisIA = null;
    this.errorMsg = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  descartar(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.analisisIA = null;
  }

  confirmarSubida(): void {
    if (!this.selectedFile || !this.incidenteId) return;
    this.uploading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const token = this.auth.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.http
      .post<{ url: string; analisis_ia: AnalisisIA }>(
        `${environment.apiUrl}/api/emergencias/${this.incidenteId}/fotos`,
        formData,
        { headers },
      )
      .subscribe({
        next: (res) => {
          this.fotosSubidas.push({ url: res.url, analisis: res.analisis_ia });
          this.analisisIA = res.analisis_ia;
          this.successMsg = 'Foto guardada y analizada por IA.';
          this.previewUrl = null;
          this.selectedFile = null;
          this.uploading = false;
          this.cdr.detectChanges();
        },
        error: (e) => {
          this.errorMsg = e?.error?.detail ?? 'No se pudo subir la foto.';
          this.uploading = false;
          this.cdr.detectChanges();
        },
      });
  }

  fullUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  confianzaLabel(c: number): string {
    const pct = Math.round(c * 100);
    if (pct >= 70) return `Alta (${pct}%)`;
    if (pct >= 50) return `Media (${pct}%)`;
    return `Baja (${pct}%)`;
  }

  volver(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
