import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  ChangeDetectorRef, AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../acceso-registro/auth.service';
import { TecnicoService, AsignacionResponse } from '../../talleres-tecnicos/tecnico.service';
import { ComunicacionService, MensajeResponse } from '../comunicacion.service';
import { SolicitudService } from '../../solicitudes/solicitud.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  asignaciones: AsignacionResponse[] = [];
  asignacionSeleccionada: AsignacionResponse | null = null;
  mensajes: MensajeResponse[] = [];
  nuevoMensaje = '';
  currentUserId: number | null = null;

  cargandoAsignaciones = false;
  enviando = false;
  errorAsignaciones = '';
  errorMensajes = '';

  private wsSub?: Subscription;
  private debeScrollear = false;

  constructor(
    private auth: AuthService,
    private tecnicoSvc: TecnicoService,
    private comunicacionSvc: ComunicacionService,
    private solicitudSvc: SolicitudService,
    private wsSvc: WebSocketService,
    private offlineQueue: OfflineQueueService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getUser();
    this.currentUserId = user?.id ?? null;
    this.cargarAsignaciones();
    this.wsSub = this.wsSvc.on('nuevo_mensaje').subscribe((msg: MensajeResponse) => {
      if (this.asignacionSeleccionada && msg.asignacion_id === this.asignacionSeleccionada.id) {
        if (!this.mensajes.find(m => m.id === msg.id)) {
          this.mensajes = [...this.mensajes, msg];
          this.debeScrollear = true;
          this.cdr.detectChanges();
        }
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.debeScrollear) {
      this.scrollAlFinal();
      this.debeScrollear = false;
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  cargarAsignaciones(): void {
    this.cargandoAsignaciones = true;
    this.errorAsignaciones = '';

    const role = this.auth.getUser()?.role;
    const source$ = role === 'cliente'
      ? this.solicitudSvc.misAsignacionesActivas()
      : this.tecnicoSvc.listarActivas();

    source$.subscribe({
      next: (list) => {
        this.asignaciones = list;
        this.cargandoAsignaciones = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorAsignaciones = 'No se pudieron cargar las conversaciones activas.';
        this.cargandoAsignaciones = false;
        this.cdr.detectChanges();
      },
    });
  }

  seleccionarAsignacion(asig: AsignacionResponse): void {
    this.asignacionSeleccionada = asig;
    this.mensajes = [];
    this.errorMensajes = '';
    this.cargarMensajes(asig.id);
  }

  private cargarMensajes(asignacionId: number): void {
    this.comunicacionSvc.listarMensajes(asignacionId).subscribe({
      next: (msgs) => {
        this.mensajes = msgs;
        this.debeScrollear = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMensajes = 'Error al cargar mensajes.';
        this.cdr.detectChanges();
      },
    });
  }

  enviarMensaje(): void {
    const texto = this.nuevoMensaje.trim();
    if (!texto || !this.asignacionSeleccionada || this.enviando) return;

    this.enviando = true;
    this.comunicacionSvc
      .enviarMensaje({ asignacion_id: this.asignacionSeleccionada.id, contenido: texto })
      .subscribe({
        next: (msg) => {
          this.mensajes = [...this.mensajes, msg];
          this.nuevoMensaje = '';
          this.debeScrollear = true;
          this.enviando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.enviando = false;
          if (!navigator.onLine && this.asignacionSeleccionada) {
            this.offlineQueue.encolar('/api/comunicacion/mensajes', 'POST',
              { asignacion_id: this.asignacionSeleccionada.id, contenido: texto },
              `Mensaje: "${texto.substring(0, 30)}…"`
            );
            this.nuevoMensaje = '';
          }
          this.cdr.detectChanges();
        },
      });
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  esMio(msg: MensajeResponse): boolean {
    return msg.usuario_id === this.currentUserId;
  }

  rolLabel(rol: string): string {
    const map: Record<string, string> = {
      taller: 'Taller', tecnico: 'Técnico', cliente: 'Cliente', admin: 'Admin',
    };
    return map[rol] ?? rol;
  }

  private scrollAlFinal(): void {
    try {
      this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch { /* ignore */ }
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  }
}
