import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../acceso-registro/auth.service';
import { environment } from '../../../environments/environment';

export interface WsEvent {
  tipo: string;
  payload: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private events$ = new Subject<WsEvent>();
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private intentos = 0;
  private readonly maxIntentos = 10;

  constructor(private auth: AuthService) {}

  conectar(): void {
    // Si ya hay una conexión abierta o abriéndose, no hacer nada
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.auth.getToken();
    if (!token) return;

    clearTimeout(this.reconnectTimer);

    const wsUrl = environment.apiUrl.replace(/^http/, 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

    this.ws.onopen = () => {
      this.intentos = 0;
      this.iniciarPing();
    };

    this.ws.onmessage = (ev) => {
      try {
        const data: WsEvent = JSON.parse(ev.data);
        if (data.tipo === 'pong') return;
        this.events$.next(data);
      } catch { /* ignore */ }
    };

    this.ws.onclose = () => {
      clearInterval(this.pingTimer);
      this.ws = null;
      this.reconectar();
    };

    this.ws.onerror = () => {
      // onclose se dispara después de onerror, no hacer nada aquí
    };
  }

  desconectar(): void {
    this.intentos = this.maxIntentos; // Evita reconexión
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingTimer);
    if (this.ws) {
      this.ws.onclose = null; // Evita que onclose intente reconectar
      this.ws.close();
      this.ws = null;
    }
  }

  on(tipo: string): Observable<any> {
    return this.events$.asObservable().pipe(
      filter(e => e.tipo === tipo),
      map(e => e.payload),
    );
  }

  onAny(): Observable<WsEvent> {
    return this.events$.asObservable();
  }

  private reconectar(): void {
    if (this.intentos >= this.maxIntentos) return;
    this.intentos++;
    const delay = Math.min(2000 * this.intentos, 15000);
    this.reconnectTimer = setTimeout(() => this.conectar(), delay);
  }

  private iniciarPing(): void {
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ tipo: 'ping' }));
      }
    }, 25000);
  }
}
