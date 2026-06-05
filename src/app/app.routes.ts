import { Routes } from '@angular/router';
import { IniciarSesionComponent } from './acceso-registro/iniciar-sesion/iniciar-sesion.component';
import { RegistrarseComponent } from './acceso-registro/registrarse/registrarse.component';
import { AppLayoutComponent } from './shared/layout/app-layout.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home.component';
import { RegistrarTallerComponent } from './acceso-registro/registrar-taller/registrar-taller.component';
import { AprobarTalleresComponent } from './acceso-registro/aprobar-talleres/aprobar-talleres.component';
import { GestionarUsuariosComponent } from './acceso-registro/gestionar-usuarios/gestionar-usuarios.component';
import { GestionarTenantsComponent } from './acceso-registro/gestionar-tenants/gestionar-tenants.component';
import { GestionarTecnicosComponent } from './talleres-tecnicos/gestionar-tecnicos/gestionar-tecnicos.component';
import { GestionarDisponibilidadComponent } from './talleres-tecnicos/gestionar-disponibilidad/gestionar-disponibilidad.component';
import { ActualizarEstadoServicioComponent } from './talleres-tecnicos/actualizar-estado-servicio/actualizar-estado-servicio.component';
import { RegistrarServicioRealizadoComponent } from './talleres-tecnicos/registrar-servicio-realizado/registrar-servicio-realizado.component';
import { GenerarCotizacionComponent } from './cotizacion-pagos/generar-cotizacion/generar-cotizacion.component';
import { VerCotizacionComponent } from './cotizacion-pagos/ver-cotizacion/ver-cotizacion.component';
import { ConfirmarCotizacionComponent } from './cotizacion-pagos/confirmar-cotizacion/confirmar-cotizacion.component';
import { ChatComponent } from './comunicacion/chat/chat.component';
import { NotificacionesComponent } from './comunicacion/notificaciones/notificaciones.component';
import { VerComisionesComponent } from './cotizacion-pagos/ver-comisiones/ver-comisiones.component';
import { VerDetalleIncidenteComponent } from './solicitudes/ver-detalle-incidente/ver-detalle-incidente.component';
import { AdjuntarFotosComponent } from './emergencias/adjuntar-fotos/adjuntar-fotos.component';
import { EnviarAudioComponent } from './emergencias/enviar-audio/enviar-audio.component';
import { VerSolicitudesDisponiblesComponent } from './solicitudes/ver-solicitudes-disponibles/ver-solicitudes-disponibles.component';
import { VerEstadoSolicitudComponent } from './solicitudes/ver-estado-solicitud/ver-estado-solicitud.component';
import { AuditoriaComponent } from './reportes/auditoria/auditoria.component';
import { RealizarPagoComponent } from './cotizacion-pagos/realizar-pago/realizar-pago.component';
import { HistorialServiciosComponent } from './reportes/historial-servicios/historial-servicios.component';
import { MetricasTallerComponent } from './reportes/metricas-taller/metricas-taller.component';
import { MetricasGlobalesComponent } from './reportes/metricas-globales/metricas-globales.component';
import { CalificarServicioComponent } from './reportes/calificar-servicio/calificar-servicio.component';
import { AccesoDenegadoComponent } from './shared/acceso-denegado/acceso-denegado.component';
import { CambiarContrasenaComponent } from './acceso-registro/cambiar-contrasena/cambiar-contrasena.component';
import { RecuperarContrasenaComponent } from './acceso-registro/recuperar-contrasena/recuperar-contrasena.component';
import { GestionarVehiculosComponent } from './acceso-registro/gestionar-vehiculos/gestionar-vehiculos.component';
import { EnviarUbicacionComponent } from './emergencias/enviar-ubicacion/enviar-ubicacion.component';
import { AgregarDescripcionComponent } from './emergencias/agregar-descripcion/agregar-descripcion.component';
import { CancelarSolicitudComponent } from './solicitudes/cancelar-solicitud/cancelar-solicitud.component';
import { RechazarSolicitudComponent } from './solicitudes/rechazar-solicitud/rechazar-solicitud.component';
import { VerTecnicoMapaComponent } from './comunicacion/ver-tecnico-mapa/ver-tecnico-mapa.component';
import { BotonSosComponent } from './emergencias/boton-sos/boton-sos.component';
import { VerificarLlegadaComponent } from './solicitudes/verificar-llegada/verificar-llegada.component';
import { RecordatoriosComponent } from './reportes/recordatorios/recordatorios.component';
import { ReporteTallerComponent } from './reportes/reporte-taller/reporte-taller.component';
import { KpisDashboardComponent } from './reportes/kpis-dashboard/kpis-dashboard.component';
import { MiTallerPerfilComponent } from './acceso-registro/mi-taller-perfil/mi-taller-perfil.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '',                    redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',               component: IniciarSesionComponent },
  { path: 'registro',            component: RegistrarseComponent },
  { path: 'recuperar-contrasena', component: RecuperarContrasenaComponent },

  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardHomeComponent },

      // ── Pantalla de acceso denegado ────────────────────────
      { path: 'acceso-denegado', component: AccesoDenegadoComponent },

      // ── Acceso y Registro ──────────────────────────────────
      { path: 'acceso-registro/cambiar-contrasena',  component: CambiarContrasenaComponent },
      { path: 'acceso-registro/registrar-taller',    component: RegistrarTallerComponent,    canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'acceso-registro/mi-taller',           component: MiTallerPerfilComponent,     canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'acceso-registro/aprobar-talleres',    component: AprobarTalleresComponent,    canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'acceso-registro/gestionar-usuarios',  component: GestionarUsuariosComponent,  canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'acceso-registro/gestionar-tenants',   component: GestionarTenantsComponent,   canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'acceso-registro/gestionar-vehiculos', component: GestionarVehiculosComponent, canActivate: [roleGuard], data: { roles: ['cliente'] } },

      // ── Emergencias (CU05–CU09) ────────────────────────────
      { path: 'emergencias/adjuntar-fotos',          component: AdjuntarFotosComponent,        canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'emergencias/enviar-audio',            component: EnviarAudioComponent,          canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'emergencias/reportar-emergencia',     component: DashboardHomeComponent,        canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'emergencias/enviar-ubicacion',        component: EnviarUbicacionComponent,      canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'emergencias/agregar-descripcion',     component: AgregarDescripcionComponent,   canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'emergencias/boton-sos',               component: BotonSosComponent,             canActivate: [roleGuard], data: { roles: ['cliente'] } },

      // ── Solicitudes ────────────────────────────────────────
      { path: 'solicitudes/ver-solicitudes-disponibles', component: VerSolicitudesDisponiblesComponent, canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'solicitudes/aceptar-solicitud',           component: VerSolicitudesDisponiblesComponent, canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'solicitudes/ver-estado-solicitud',        component: VerEstadoSolicitudComponent,        canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'solicitudes/ver-detalle-incidente',       component: VerDetalleIncidenteComponent,       canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'solicitudes/cancelar-solicitud',          component: CancelarSolicitudComponent,         canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'solicitudes/rechazar-solicitud',          component: RechazarSolicitudComponent,         canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'solicitudes/verificar-llegada',           component: VerificarLlegadaComponent,          canActivate: [roleGuard], data: { roles: ['cliente'] } },

      // ── Talleres y Técnicos ────────────────────────────────
      { path: 'talleres-tecnicos/gestionar-tecnicos',           component: GestionarTecnicosComponent,           canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'talleres-tecnicos/gestionar-disponibilidad',     component: GestionarDisponibilidadComponent,     canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'talleres-tecnicos/actualizar-estado-servicio',   component: ActualizarEstadoServicioComponent,    canActivate: [roleGuard], data: { roles: ['taller', 'tecnico'] } },
      { path: 'talleres-tecnicos/registrar-servicio-realizado', component: RegistrarServicioRealizadoComponent, canActivate: [roleGuard], data: { roles: ['taller', 'tecnico'] } },

      // ── Cotización y Pagos ─────────────────────────────────
      { path: 'cotizacion-pagos/generar-cotizacion',   component: GenerarCotizacionComponent,   canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'cotizacion-pagos/ver-cotizacion',       component: VerCotizacionComponent,       canActivate: [roleGuard], data: { roles: ['taller', 'cliente'] } },
      { path: 'cotizacion-pagos/confirmar-cotizacion', component: ConfirmarCotizacionComponent, canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'cotizacion-pagos/ver-comisiones',       component: VerComisionesComponent,       canActivate: [roleGuard], data: { roles: ['taller', 'admin'] } },
      { path: 'cotizacion-pagos/realizar-pago',        component: RealizarPagoComponent,        canActivate: [roleGuard], data: { roles: ['cliente'] } },

      // ── Comunicación ───────────────────────────────────────
      { path: 'comunicacion/chat',             component: ChatComponent,             canActivate: [roleGuard], data: { roles: ['cliente', 'taller', 'tecnico'] } },
      { path: 'comunicacion/notificaciones',   component: NotificacionesComponent,   canActivate: [roleGuard], data: { roles: ['cliente', 'taller'] } },
      { path: 'comunicacion/ver-tecnico-mapa', component: VerTecnicoMapaComponent,   canActivate: [roleGuard], data: { roles: ['cliente'] } },

      // ── Reportes ───────────────────────────────────────────
      { path: 'reportes/auditoria',           component: AuditoriaComponent,         canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'reportes/historial-servicios', component: HistorialServiciosComponent, canActivate: [roleGuard], data: { roles: ['cliente', 'taller'] } },
      { path: 'reportes/metricas-taller',     component: MetricasTallerComponent,     canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'reportes/metricas-globales',   component: MetricasGlobalesComponent,   canActivate: [roleGuard], data: { roles: ['admin'] } },
      { path: 'reportes/calificar-servicio',  component: CalificarServicioComponent,  canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'reportes/recordatorios',       component: RecordatoriosComponent,      canActivate: [roleGuard], data: { roles: ['cliente'] } },
      { path: 'reportes/reporte-taller',      component: ReporteTallerComponent,      canActivate: [roleGuard], data: { roles: ['taller'] } },
      { path: 'reportes/kpis-dashboard',     component: KpisDashboardComponent,      canActivate: [roleGuard], data: { roles: ['admin', 'taller'] } },

      // ── Stubs catch-all (rutas no implementadas aún) ───────
      { path: 'emergencias/:cu',       component: DashboardHomeComponent },
      { path: 'solicitudes/:cu',       component: DashboardHomeComponent },
      { path: 'talleres-tecnicos/:cu', component: DashboardHomeComponent },
      { path: 'cotizacion-pagos/:cu',  component: DashboardHomeComponent },
      { path: 'comunicacion/:cu',      component: DashboardHomeComponent },
      { path: 'reportes/:cu',          component: DashboardHomeComponent },
      { path: 'acceso-registro/:cu',   component: DashboardHomeComponent },
    ],
  },

  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
];
