import { Injectable } from '@angular/core';
import { ReportesService } from '../../reportes/reportes.service';

const CONFIG_KEY = 'rutasegura_backup_config';

export interface AutoConfig {
  activo: boolean;
  hora: number;
  minuto: number;
  intervalo: 'diario' | 'semanal' | 'mensual';
  ultimaEjecucion: string | null;
}

@Injectable({ providedIn: 'root' })
export class BackupSchedulerService {
  private timer: any = null;

  constructor(private svc: ReportesService) {}

  iniciar(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.verificar(), 60_000);
  }

  detener(): void {
    clearInterval(this.timer);
    this.timer = null;
  }

  getConfig(): AutoConfig {
    const saved = localStorage.getItem(CONFIG_KEY);
    const base = saved ? JSON.parse(saved) : {
      activo: false, hora: 2, minuto: 0, intervalo: 'diario', ultimaEjecucion: null,
    };
    // Forzar números para evitar comparaciones string === number
    return { ...base, hora: Number(base.hora), minuto: Number(base.minuto) };
  }

  saveConfig(config: AutoConfig): void {
    const safe = { ...config, hora: Number(config.hora), minuto: Number(config.minuto) };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(safe));
  }

  private verificar(): void {
    const config = this.getConfig();
    if (!config.activo) return;

    const ahora  = new Date();
    // Hora local del dispositivo (Bolivia UTC-4)
    const hMatch = ahora.getHours()   === Number(config.hora);
    const mMatch = ahora.getMinutes() === Number(config.minuto);
    if (!hMatch || !mMatch) return;

    const ultima = config.ultimaEjecucion ? new Date(config.ultimaEjecucion) : null;
    if (ultima) {
      const diffMin = (ahora.getTime() - ultima.getTime()) / 60_000;
      const minimos: Record<string, number> = { diario: 1440, semanal: 10080, mensual: 43200 };
      if (diffMin < (minimos[config.intervalo] ?? 1440)) return;
    }

    config.ultimaEjecucion = ahora.toISOString();
    this.saveConfig(config);

    this.svc.descargarBackup().subscribe({
      next: (blob) => {
        const ts   = new Date().toLocaleString('es-BO', { hour12: false })
          .replace(/[/:, ]/g, '-').replace(/-+/g, '-');
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `rutasegura_backup_auto_${ts}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
