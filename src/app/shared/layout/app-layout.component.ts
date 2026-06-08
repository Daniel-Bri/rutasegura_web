import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../acceso-registro/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { BackupSchedulerService } from '../../core/services/backup-scheduler.service';
import { type AppRole } from '../../core/permissions/permissions.config';

interface NavItem    { label: string; route: string; roles: AppRole[]; }
interface NavSection { id: string; label: string; icon: string; items: NavItem[]; }

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  collapsed = signal(false);
  openSections = new Set<string>();
  notifToast: { titulo: string; mensaje: string } | null = null;
  private wsSub?: Subscription;
  private toastTimer: any;

  readonly ALL_NAV_SECTIONS: NavSection[] = [
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: 'person',
      items: [
        { label: 'Mis Vehículos',      route: '/app/acceso-registro/gestionar-vehiculos', roles: ['cliente'] },
        { label: 'Mi Taller',           route: '/app/acceso-registro/mi-taller',           roles: ['taller'] },
        { label: 'Registrar Taller',   route: '/app/acceso-registro/registrar-taller',    roles: ['taller'] },
      ],
    },
    {
      id: 'emergencias',
      label: 'Emergencias',
      icon: 'emergency',
      items: [
        { label: 'Reportar Emergencia', route: '/app/emergencias/reportar-emergencia', roles: ['cliente'] },
        { label: 'Botón SOS',           route: '/app/emergencias/boton-sos',           roles: ['cliente'] },
        { label: 'Enviar Ubicación',    route: '/app/emergencias/enviar-ubicacion',    roles: ['cliente'] },
        { label: 'Agregar Descripción', route: '/app/emergencias/agregar-descripcion', roles: ['cliente'] },
        { label: 'Adjuntar Fotos',      route: '/app/emergencias/adjuntar-fotos',      roles: ['cliente'] },
        { label: 'Enviar Audio',        route: '/app/emergencias/enviar-audio',        roles: ['cliente'] },
      ],
    },
    {
      id: 'solicitudes',
      label: 'Solicitudes',
      icon: 'assignment',
      items: [
        { label: 'Ver Estado',         route: '/app/solicitudes/ver-estado-solicitud',       roles: ['cliente'] },
        { label: 'Cancelar',           route: '/app/solicitudes/cancelar-solicitud',         roles: ['cliente'] },
        { label: 'Verificar Llegada',  route: '/app/solicitudes/verificar-llegada',          roles: ['cliente'] },
        { label: 'Disponibles',        route: '/app/solicitudes/ver-solicitudes-disponibles', roles: ['taller'] },
        { label: 'Detalle Incidente',  route: '/app/solicitudes/ver-detalle-incidente',      roles: ['taller'] },
      ],
    },
    {
      id: 'servicios',
      label: 'Servicios',
      icon: 'handyman',
      items: [
        { label: 'Gestionar Técnicos',  route: '/app/talleres-tecnicos/gestionar-tecnicos',           roles: ['taller'] },
        { label: 'Disponibilidad',      route: '/app/talleres-tecnicos/gestionar-disponibilidad',     roles: ['taller'] },
        { label: 'Estado del Servicio', route: '/app/talleres-tecnicos/actualizar-estado-servicio',   roles: ['taller', 'tecnico'] },
        { label: 'Registrar Servicio',  route: '/app/talleres-tecnicos/registrar-servicio-realizado', roles: ['taller', 'tecnico'] },
      ],
    },
    {
      id: 'pagos',
      label: 'Cotización y Pagos',
      icon: 'receipt_long',
      items: [
        { label: 'Mis Cotizaciones',    route: '/app/cotizacion-pagos/ver-cotizacion',       roles: ['cliente'] },
        { label: 'Realizar Pago',       route: '/app/cotizacion-pagos/realizar-pago',        roles: ['cliente'] },
        { label: 'Generar Cotización',  route: '/app/cotizacion-pagos/generar-cotizacion',   roles: ['taller'] },
        { label: 'Ver Cotizaciones',    route: '/app/cotizacion-pagos/ver-cotizacion',       roles: ['taller'] },
        { label: 'Comisiones',          route: '/app/cotizacion-pagos/ver-comisiones',       roles: ['taller', 'admin'] },
      ],
    },
    {
      id: 'comunicacion',
      label: 'Comunicación',
      icon: 'forum',
      items: [
        { label: 'Chat',            route: '/app/comunicacion/chat',             roles: ['cliente', 'taller', 'tecnico'] },
        { label: 'Notificaciones',  route: '/app/comunicacion/notificaciones',   roles: ['cliente', 'taller'] },
        { label: 'Técnico en Mapa', route: '/app/comunicacion/ver-tecnico-mapa', roles: ['cliente'] },
      ],
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'analytics',
      items: [
        { label: 'Historial',           route: '/app/reportes/historial-servicios',   roles: ['cliente', 'taller'] },
        { label: 'Calificar',           route: '/app/reportes/calificar-servicio',    roles: ['cliente'] },
        { label: 'Recordatorios',       route: '/app/reportes/recordatorios',         roles: ['cliente'] },
        { label: 'Ranking Talleres',    route: '/app/reportes/ranking-talleres',      roles: ['cliente', 'taller', 'admin'] },
        { label: 'Métricas Taller',     route: '/app/reportes/metricas-taller',       roles: ['taller'] },
        { label: 'Reporte Taller',      route: '/app/reportes/reporte-taller',        roles: ['taller'] },
        { label: 'KPIs Dashboard',      route: '/app/reportes/kpis-dashboard',        roles: ['admin', 'taller'] },
        { label: 'Métricas Globales',   route: '/app/reportes/metricas-globales',     roles: ['admin'] },
        { label: 'Gestionar Reputación',route: '/app/reportes/gestionar-reputacion',  roles: ['admin'] },
        { label: 'Auditoría',           route: '/app/reportes/auditoria',             roles: ['admin'] },
        { label: 'Backup / Restore',    route: '/app/reportes/backup-restore',        roles: ['admin'] },
      ],
    },
    {
      id: 'admin',
      label: 'Administración',
      icon: 'admin_panel_settings',
      items: [
        { label: 'Gestionar Usuarios', route: '/app/acceso-registro/gestionar-usuarios', roles: ['admin'] },
        { label: 'Gestionar Tenants',  route: '/app/acceso-registro/gestionar-tenants',  roles: ['admin'] },
        { label: 'Aprobar Talleres',   route: '/app/acceso-registro/aprobar-talleres',   roles: ['admin'] },
      ],
    },
  ];

  isOnline = true;
  pendientesOffline = 0;
  private onlineSub?: Subscription;
  private pendientesSub?: Subscription;
  private syncSub?: Subscription;

  constructor(
    private auth: AuthService,
    readonly router: Router,
    private wsSvc: WebSocketService,
    public offlineSvc: OfflineQueueService,
    private pushSvc: PushNotificationService,
    private backupScheduler: BackupSchedulerService,
  ) {}

  private wsMsgSub?: Subscription;

  ngOnInit(): void {
    this.backupScheduler.iniciar();
    this.wsSvc.conectar();
    this.pushSvc.inicializar();
    this.wsSub = this.wsSvc.on('notificacion').subscribe((payload) => {
      this.mostrarToast(payload.titulo, payload.mensaje);
    });
    this.wsMsgSub = this.wsSvc.on('nuevo_mensaje').subscribe((payload) => {
      if (!this.router.url.includes('/comunicacion/chat')) {
        const remitente = payload.remitente ?? 'Nuevo mensaje';
        this.mostrarToast(`Mensaje de ${remitente}`, payload.contenido);
      }
    });
    this.onlineSub = this.offlineSvc.online$.subscribe(v => this.isOnline = v);
    this.pendientesSub = this.offlineSvc.pendientes$.subscribe(v => this.pendientesOffline = v);
    this.syncSub = this.offlineSvc.sincronizado$.subscribe(({ sincronizados, labels }) => {
      const detalle = labels.length === 1
        ? labels[0]
        : `${sincronizados} acciones sincronizadas`;
      this.mostrarToast('✅ Conexión restaurada', detalle);
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsMsgSub?.unsubscribe();
    this.onlineSub?.unsubscribe();
    this.pendientesSub?.unsubscribe();
    this.syncSub?.unsubscribe();
    clearTimeout(this.toastTimer);
  }

  private mostrarToast(titulo: string, mensaje: string): void {
    this.notifToast = { titulo, mensaje };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.notifToast = null; }, 6000);
  }

  cerrarToast(): void {
    this.notifToast = null;
    clearTimeout(this.toastTimer);
  }

  get user()         { return this.auth.getUser(); }
  get userRole()     { return (this.user?.role ?? 'cliente') as AppRole; }
  get userInitial()  { return (this.user?.username ?? 'U')[0].toUpperCase(); }
  get userName()     { return this.user?.full_name || this.user?.username || 'Usuario'; }

  get userRoleLabel(): string {
    const map: Record<string, string> = {
      admin: 'Administrador', taller: 'Taller', tecnico: 'Técnico', cliente: 'Cliente',
    };
    return map[this.userRole] ?? 'Usuario';
  }

  /** Solo secciones e ítems accesibles para el rol actual */
  get navSections(): NavSection[] {
    return this.ALL_NAV_SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => i.roles.includes(this.userRole)) }))
      .filter(s => s.items.length > 0);
  }

  toggle()               { this.collapsed.update(v => !v); }
  toggleSection(id: string) {
    this.openSections.has(id) ? this.openSections.delete(id) : this.openSections.add(id);
  }
  isOpen(id: string)     { return this.openSections.has(id); }

  goChangePassword() {
    this.router.navigate(['/app/acceso-registro/cambiar-contrasena']);
  }

  logout() {
    this.wsSvc.desconectar();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
