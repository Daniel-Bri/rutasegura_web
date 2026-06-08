import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../reportes.service';
import { BackupSchedulerService, AutoConfig } from '../../core/services/backup-scheduler.service';

@Component({
  selector: 'app-backup-restore',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding:24px;background:#F8FAFC;min-height:100vh;max-width:800px;margin:0 auto">

      <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111827">Backup y Restauración</h1>
      <p style="margin:0 0 32px;color:#6B7280;font-size:13px">Solo accesible para administradores del sistema</p>

      <!-- ── Backup Manual ── -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <span class="material-symbols-outlined" style="font-size:28px;color:#1D4ED8">download</span>
          <div>
            <h2 style="margin:0;font-size:16px;font-weight:700;color:#111827">Backup Manual</h2>
            <p style="margin:2px 0 0;font-size:12px;color:#6B7280">Descarga un archivo JSON con toda la base de datos ahora mismo</p>
          </div>
        </div>
        <button (click)="descargarManual()" [disabled]="descargando"
          style="padding:10px 22px;background:#1D4ED8;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;opacity:1"
          [style.opacity]="descargando ? '0.6' : '1'">
          <span class="material-symbols-outlined" style="font-size:16px">{{ descargando ? 'hourglass_empty' : 'download' }}</span>
          {{ descargando ? 'Generando backup...' : 'Descargar Backup Ahora' }}
        </button>
        @if (mensajeManual) {
          <p style="margin:10px 0 0;font-size:12px" [style.color]="mensajeManual.ok ? '#16A34A' : '#EF4444'">
            {{ mensajeManual.texto }}
          </p>
        }
      </div>

      <!-- ── Backup Automático ── -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <span class="material-symbols-outlined" style="font-size:28px;color:#7C3AED">schedule</span>
          <div>
            <h2 style="margin:0;font-size:16px;font-weight:700;color:#111827">Backup Automático</h2>
            <p style="margin:2px 0 0;font-size:12px;color:#6B7280">Se descargará automáticamente a la hora configurada mientras la app esté abierta</p>
          </div>
        </div>

        <!-- Toggle -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <label style="position:relative;display:inline-block;width:48px;height:26px">
            <input type="checkbox" [(ngModel)]="autoConfig.activo" (change)="guardarConfig()"
              style="opacity:0;width:0;height:0">
            <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;border-radius:26px;transition:.3s"
              [style.background]="autoConfig.activo ? '#1D4ED8' : '#D1D5DB'">
              <span style="position:absolute;content:'';height:20px;width:20px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.3s"
                [style.transform]="autoConfig.activo ? 'translateX(22px)' : 'translateX(0)'"></span>
            </span>
          </label>
          <span style="font-size:14px;font-weight:600;color:#374151">
            {{ autoConfig.activo ? 'Activado' : 'Desactivado' }}
          </span>
          @if (autoConfig.activo) {
            <span style="background:#DCFCE7;color:#16A34A;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px">
              ACTIVO
            </span>
          }
        </div>

        <!-- Configuración -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px">

          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Hora</label>
            <input type="number" [(ngModel)]="autoConfig.hora" (change)="guardarConfig()"
              min="0" max="23"
              style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;color:#111827;box-sizing:border-box"/>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Minuto</label>
            <input type="number" [(ngModel)]="autoConfig.minuto" (change)="guardarConfig()"
              min="0" max="59"
              style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;color:#111827;box-sizing:border-box"/>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Frecuencia</label>
            <select [(ngModel)]="autoConfig.intervalo" (change)="guardarConfig()"
              style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;color:#111827;box-sizing:border-box">
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

        </div>

        @if (autoConfig.activo) {
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:12px 16px;font-size:12px;color:#1D4ED8">
            <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">info</span>
            Próximo backup: <strong>{{ proximaEjecucion() }}</strong> · Última ejecución: {{ autoConfig.ultimaEjecucion ? formatFecha(autoConfig.ultimaEjecucion) : 'Nunca' }}
          </div>
        }
      </div>

      <!-- ── Toast backup automático ── -->
      @if (toastAuto) {
        <div style="position:fixed;bottom:24px;right:24px;z-index:9999;padding:14px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;max-width:340px"
          [style.background]="toastAuto.ok ? '#F0FDF4' : '#FEF2F2'"
          [style.color]="toastAuto.ok ? '#16A34A' : '#DC2626'"
          [style.border]="toastAuto.ok ? '1px solid #BBF7D0' : '1px solid #FCA5A5'">
          <span class="material-symbols-outlined" style="font-size:18px">{{ toastAuto.ok ? 'check_circle' : 'error' }}</span>
          {{ toastAuto.texto }}
        </div>
      }

      <!-- ── Restaurar ── -->
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <span class="material-symbols-outlined" style="font-size:28px;color:#EF4444">restore</span>
          <div>
            <h2 style="margin:0;font-size:16px;font-weight:700;color:#111827">Restaurar Base de Datos</h2>
            <p style="margin:2px 0 0;font-size:12px;color:#EF4444;font-weight:600">⚠ Esta acción reemplaza todos los datos actuales</p>
          </div>
        </div>

        <!-- Zona de carga -->
        <div class="drop-zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)"
          style="border:2px dashed #D1D5DB;border-radius:12px;padding:32px;text-align:center;cursor:pointer;margin-bottom:16px;transition:border-color .2s"
          [style.borderColor]="archivoRestore ? '#16A34A' : '#D1D5DB'"
          [style.background]="archivoRestore ? '#F0FDF4' : '#FAFAFA'"
          (click)="fileInput.click()">
          <input #fileInput type="file" accept=".json" (change)="onFile($event)" style="display:none"/>
          <span class="material-symbols-outlined" style="font-size:40px" [style.color]="archivoRestore ? '#16A34A' : '#9CA3AF'">
            {{ archivoRestore ? 'check_circle' : 'upload_file' }}
          </span>
          <p style="margin:8px 0 0;font-size:13px;color:#374151;font-weight:600">
            {{ archivoRestore ? archivoRestore.name : 'Arrastra el JSON aquí o haz clic para seleccionarlo' }}
          </p>
          @if (archivoRestore) {
            <p style="margin:4px 0 0;font-size:11px;color:#6B7280">{{ formatSize(archivoRestore.size) }}</p>
          }
        </div>

        @if (archivoRestore) {
          <!-- Confirmación -->
          @if (!confirmarRestore) {
            <button (click)="confirmarRestore = true"
              style="padding:10px 22px;background:#EF4444;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;width:100%">
              Restaurar Base de Datos
            </button>
          } @else {
            <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:16px;text-align:center">
              <p style="margin:0 0 12px;font-size:13px;color:#DC2626;font-weight:600">
                ¿Estás seguro? Esto eliminará y reemplazará TODOS los datos actuales.
              </p>
              <div style="display:flex;gap:10px;justify-content:center">
                <button (click)="confirmarRestore = false"
                  style="padding:8px 20px;background:#F3F4F6;color:#374151;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
                  Cancelar
                </button>
                <button (click)="ejecutarRestore()" [disabled]="restaurando"
                  style="padding:8px 20px;background:#DC2626;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer"
                  [style.opacity]="restaurando ? '0.6' : '1'">
                  {{ restaurando ? 'Restaurando...' : 'Sí, restaurar' }}
                </button>
              </div>
            </div>
          }
        }

        @if (mensajeRestore) {
          <div style="margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px"
            [style.background]="mensajeRestore.ok ? '#F0FDF4' : '#FEF2F2'"
            [style.color]="mensajeRestore.ok ? '#16A34A' : '#DC2626'"
            [style.border]="mensajeRestore.ok ? '1px solid #BBF7D0' : '1px solid #FCA5A5'">
            {{ mensajeRestore.texto }}
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .card {
      background: white;
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,.07);
      border: 1px solid #F3F4F6;
    }
  `],
})
export class BackupRestoreComponent implements OnInit, OnDestroy {
  autoConfig: AutoConfig = {
    activo: false, hora: 2, minuto: 0,
    intervalo: 'diario', ultimaEjecucion: null,
  };

  descargando   = false;
  mensajeManual: { ok: boolean; texto: string } | null = null;

  archivoRestore: File | null = null;
  confirmarRestore = false;
  restaurando  = false;
  mensajeRestore: { ok: boolean; texto: string } | null = null;

  constructor(
    private svc: ReportesService,
    private scheduler: BackupSchedulerService,
    private cdr: ChangeDetectorRef,
  ) {}

  toastAuto: { ok: boolean; texto: string } | null = null;
  private toastTimer: any = null;

  ngOnInit(): void {
    this.autoConfig = this.scheduler.getConfig();
    this.scheduler.onBackupCompletado = (result) => {
      clearTimeout(this.toastTimer);
      this.autoConfig = this.scheduler.getConfig();
      this.toastAuto = result.ok
        ? { ok: true,  texto: 'Backup automático descargado correctamente.' }
        : { ok: false, texto: 'Error al generar el backup automático. Se reintentará en el próximo ciclo.' };
      this.cdr.detectChanges();
      this.toastTimer = setTimeout(() => {
        this.toastAuto = null;
        this.cdr.detectChanges();
      }, 6000);
    };
  }

  ngOnDestroy(): void {
    this.scheduler.onBackupCompletado = undefined;
    clearTimeout(this.toastTimer);
  }

  guardarConfig(): void {
    this.scheduler.saveConfig(this.autoConfig);
  }

  descargarManual(): void {
    this.descargando = true;
    this.mensajeManual = null;
    this.svc.descargarBackup().subscribe({
      next: (blob) => {
        this.triggerDownload(blob);
        this.descargando = false;
        this.mensajeManual = { ok: true, texto: 'Backup descargado correctamente.' };
        this.cdr.detectChanges();
      },
      error: () => {
        this.descargando = false;
        this.mensajeManual = { ok: false, texto: 'Error al generar el backup. Revisa la conexión con el servidor.' };
        this.cdr.detectChanges();
      },
    });
  }

  private triggerDownload(blob: Blob): void {
    const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `rutasegura_backup_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  proximaEjecucion(): string {
    const h = String(this.autoConfig.hora).padStart(2, '0');
    const m = String(this.autoConfig.minuto).padStart(2, '0');
    const map: Record<string, string> = { diario: 'todos los días', semanal: 'cada semana', mensual: 'cada mes' };
    return `${h}:${m} ${map[this.autoConfig.intervalo]}`;
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoRestore = input.files?.[0] ?? null;
    this.confirmarRestore = false;
    this.mensajeRestore = null;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.archivoRestore = event.dataTransfer?.files?.[0] ?? null;
    this.confirmarRestore = false;
    this.mensajeRestore = null;
  }

  ejecutarRestore(): void {
    if (!this.archivoRestore) return;
    this.restaurando = true;
    this.mensajeRestore = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        this.svc.restaurarBackup(data).subscribe({
          next: (res) => {
            this.restaurando = false;
            this.confirmarRestore = false;
            this.mensajeRestore = {
              ok: true,
              texto: `Restauración completada. Tablas: ${res.tablas_restauradas.join(', ')}.`,
            };
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.restaurando = false;
            this.mensajeRestore = {
              ok: false,
              texto: err?.error?.detail ?? 'Error al restaurar. Verifica que el archivo sea un backup válido.',
            };
            this.cdr.detectChanges();
          },
        });
      } catch {
        this.restaurando = false;
        this.mensajeRestore = { ok: false, texto: 'El archivo no es un JSON válido.' };
        this.cdr.detectChanges();
      }
    };
    reader.readAsText(this.archivoRestore);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
