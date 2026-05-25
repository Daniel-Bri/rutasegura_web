import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OfflineAction {
  id: string;
  timestamp: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT';
  body: any;
  label: string;
}

const STORAGE_KEY = 'rutasegura_offline_queue';

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private queue: OfflineAction[] = [];
  readonly pendientes$ = new BehaviorSubject<number>(0);
  readonly online$ = new BehaviorSubject<boolean>(navigator.onLine);
  private sincronizando = false;

  constructor(private http: HttpClient) {
    this.queue = this.loadFromStorage();
    this.pendientes$.next(this.queue.length);

    window.addEventListener('online', () => {
      this.online$.next(true);
      this.sincronizar();
    });
    window.addEventListener('offline', () => {
      this.online$.next(false);
    });

    if (navigator.onLine && this.queue.length > 0) {
      this.sincronizar();
    }
  }

  get isOnline(): boolean {
    return navigator.onLine;
  }

  encolar(endpoint: string, method: 'POST' | 'PATCH' | 'PUT', body: any, label: string): void {
    const action: OfflineAction = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      body,
      label,
    };
    this.queue.push(action);
    this.saveToStorage();
    this.pendientes$.next(this.queue.length);
  }

  async sincronizar(): Promise<void> {
    if (this.sincronizando || this.queue.length === 0 || !navigator.onLine) return;
    this.sincronizando = true;

    const pendientes = [...this.queue];
    for (const action of pendientes) {
      try {
        const url = `${environment.apiUrl}${action.endpoint}`;
        if (action.method === 'POST') {
          await this.http.post(url, action.body).toPromise();
        } else if (action.method === 'PATCH') {
          await this.http.patch(url, action.body).toPromise();
        } else {
          await this.http.put(url, action.body).toPromise();
        }
        this.queue = this.queue.filter(a => a.id !== action.id);
        this.saveToStorage();
        this.pendientes$.next(this.queue.length);
      } catch {
        break;
      }
    }

    this.sincronizando = false;
  }

  getQueue(): OfflineAction[] {
    return [...this.queue];
  }

  limpiar(): void {
    this.queue = [];
    this.saveToStorage();
    this.pendientes$.next(0);
  }

  private loadFromStorage(): OfflineAction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
  }
}
