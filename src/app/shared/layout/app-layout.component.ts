import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../acceso-registro/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
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

  // Todos los módulos siempre visibles — el guard + lógica de bloqueo maneja acceso
  readonly ALL_NAV_SECTIONS: NavSection[] = [
    {
      id: 'acceso',
      label: 'Acceso y Registro',
      icon: 'manage_accounts',
      items: [
        { label: 'Mis Vehículos',      route: '/app/acceso-registro/gestionar-vehiculos',  roles: ['cliente'] },
        { label: 'Registrar Taller',   route: '/app/acceso-registro/registrar-taller',     roles: ['taller'] },
        { label: 'Gestionar Usuarios', route: '/app/acceso-registro/gestionar-usuarios',   roles: ['admin'] },
        { label: 'Gestionar Tenants',  route: '/app/acceso-registro/gestionar-tenants',   roles: ['admin'] },
        { label: 'Aprobar Talleres',   route: '/app/acceso-registro/aprobar-talleres',     roles: ['admin'] },
      ],
    },
    {
      id: 'emergencias',
      label: 'Emergencias',
      icon: 'emergency',
      items: [
        { label: 'Reportar Emergencia',  route: '/app/emergencias/reportar-emergencia', roles: ['cliente'] },
        { label: 'Botón SOS',            route: '/app/emergencias/boton-sos',           roles: ['cliente'] },
        { label: 'Enviar Ubicación GPS', route: '/app/emergencias/enviar-ubicacion',    roles: ['cliente'] },
        { label: 'Agregar Descripción',  route: '/app/emergencias/agregar-descripcion', roles: ['cliente'] },
        { label: 'Adjuntar Fotos',       route: '/app/emergencias/adjuntar-fotos',      roles: ['cliente'] },
        { label: 'Enviar Audio',         route: '/app/emergencias/enviar-audio',        roles: ['cliente'] },
      ],
    },
    {
      id: 'solicitudes',
      label: 'Solicitudes',
      icon: 'assignment',
      items: [
        { label: 'Ver Disponibles',    route: '/app/solicitudes/ver-solicitudes-disponibles', roles: ['taller'] },
        { label: 'Aceptar Solicitud', route: '/app/solicitudes/aceptar-solicitud',          roles: ['taller'] },
        { label: 'Rechazar Solicitud',route: '/app/solicitudes/rechazar-solicitud',         roles: ['taller'] },
        { label: 'Ver Estado',        route: '/app/solicitudes/ver-estado-solicitud',       roles: ['cliente'] },
        { label: 'Cancelar Solicitud',route: '/app/solicitudes/cancelar-solicitud',         roles: ['cliente'] },
        { label: 'Verificar Llegada', route: '/app/solicitudes/verificar-llegada',          roles: ['cliente'] },
        { label: 'Detalle Incidente', route: '/app/solicitudes/ver-detalle-incidente',      roles: ['taller'] },
      ],
    },
    {
      id: 'talleres',
      label: 'Talleres y Técnicos',
      icon: 'handyman',
      items: [
        { label: 'Gestionar Técnicos',       route: '/app/talleres-tecnicos/gestionar-tecnicos',           roles: ['taller'] },
        { label: 'Gestionar Disponibilidad', route: '/app/talleres-tecnicos/gestionar-disponibilidad',     roles: ['taller'] },
        { label: 'Actualizar Estado',        route: '/app/talleres-tecnicos/actualizar-estado-servicio',   roles: ['taller', 'tecnico'] },
        { label: 'Registrar Servicio',       route: '/app/talleres-tecnicos/registrar-servicio-realizado', roles: ['taller', 'tecnico'] },
      ],
    },
    {
      id: 'pagos',
      label: 'Cotización y Pagos',
      icon: 'receipt_long',
      items: [
        { label: 'Generar Cotización',   route: '/app/cotizacion-pagos/generar-cotizacion',   roles: ['taller'] },
        { label: 'Ver Cotizaciones',     route: '/app/cotizacion-pagos/ver-cotizacion',       roles: ['taller', 'cliente'] },
        { label: 'Confirmar Cotización', route: '/app/cotizacion-pagos/confirmar-cotizacion', roles: ['taller'] },
        { label: 'Realizar Pago',        route: '/app/cotizacion-pagos/realizar-pago',        roles: ['cliente'] },
        { label: 'Ver Comisiones',       route: '/app/cotizacion-pagos/ver-comisiones',       roles: ['taller', 'admin'] },
      ],
    },
    {
      id: 'comunicacion',
      label: 'Comunicación',
      icon: 'forum',
      items: [
        { label: 'Chat',             route: '/app/comunicacion/chat',             roles: ['cliente', 'taller', 'tecnico'] },
        { label: 'Notificaciones',   route: '/app/comunicacion/notificaciones',   roles: ['cliente', 'taller'] },
        { label: 'Técnico en Mapa',  route: '/app/comunicacion/ver-tecnico-mapa', roles: ['cliente'] },
      ],
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'analytics',
      items: [
        { label: 'Historial Servicios', route: '/app/reportes/historial-servicios', roles: ['cliente', 'taller'] },
        { label: 'Calificar Servicio',  route: '/app/reportes/calificar-servicio',  roles: ['cliente'] },
        { label: 'Recordatorios',       route: '/app/reportes/recordatorios',       roles: ['cliente'] },
        { label: 'Métricas Taller',     route: '/app/reportes/metricas-taller',     roles: ['taller'] },
        { label: 'Reporte del Taller',  route: '/app/reportes/reporte-taller',      roles: ['taller'] },
        { label: 'Métricas Globales',   route: '/app/reportes/metricas-globales',   roles: ['admin'] },
        { label: 'Auditoría',           route: '/app/reportes/auditoria',           roles: ['admin'] },
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
  ) {}

  private wsMsgSub?: Subscription;

  ngOnInit(): void {
    this.wsSvc.conectar();
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

  // Todos los módulos siempre visibles
  get navSections(): NavSection[] { return this.ALL_NAV_SECTIONS; }

  /** ¿El usuario tiene acceso a al menos un item de la sección? */
  sectionAccessible(section: NavSection): boolean {
    return section.items.some(i => i.roles.includes(this.userRole));
  }

  /** ¿El usuario puede acceder a este item? */
  itemAccessible(item: NavItem): boolean {
    return item.roles.includes(this.userRole);
  }

  navigateLocked(): void {
    this.router.navigate(['/app/acceso-denegado']);
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
