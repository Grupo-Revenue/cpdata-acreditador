## Entregable

Un PDF nuevo: `/mnt/documents/guion_capacitacion_practica.pdf`, reemplazando el enfoque tipo "demo" del anterior. Esta vez es un guion de **capacitación práctica**: el usuario opera el sistema con sus manos, el capacitador acompaña.

No se modifica código del proyecto.

## Estructura del PDF

**Portada**
- Título: "Guion de Capacitación Práctica – Sistema CPData Acreditador"
- Subtítulo: "2 sesiones de 90 minutos · El usuario opera, el capacitador acompaña"

**Nota inicial al capacitador (½ página)**
- Esta NO es demo: el sistema ya fue aprobado. El usuario ejecuta cada flujo.
- Cómo usar el documento: resumen ejecutivo → bloques cronometrados → para cada bloque: contexto del capacitador, ejercicio práctico paso a paso, criterios de validación, error frecuente y corrección.
- Recordatorio: cada sesión es autónoma. Inicio de Sesión 2 incluye un resumen de 2 min de Sesión 1.

---

### Sesión 1 — Operación base del acreditador/supervisor (90 min)

**Resumen ejecutivo (3 líneas):** Al terminar, el usuario sabrá iniciar sesión, cambiar de rol activo, postular o aceptar un evento, firmar digitalmente el contrato, registrar asistencia con su puntaje (7/5/0), cargar gastos personales y emitir su boleta con el monto total correcto.

**Bloques (suman 90 min):**

1. **Login, rol activo y navegación (10 min)** — Login en `/auth/login`, selector de rol activo desde sidebar/perfil, sidebar dinámico por permisos.
   - Ejercicio: ingresar, cambiar de rol, identificar 3 módulos visibles.
   - Validar: el sidebar cambia al cambiar rol activo; URL `/app/...` accesible.
   - Error frecuente: confundir "rol global" con "rol activo" → mostrar `localStorage` y `RoleSelectDialog`.

2. **Eventos – vista usuario (postulación y aceptación) (20 min)** — `EventsUserTable`, ciclo postulación → aceptación → contrato pendiente.
   - Ejercicio: postularse a un evento abierto, esperar aceptación (capacitador la ejecuta desde admin), revisar notificación WhatsApp.
   - Validar: estado pasa a "Aceptado", aparece botón de firma.
   - Error frecuente: intentar firmar antes de ser aceptado → explicar las 4 fases.

3. **Firma digital del contrato (15 min)** — `DigitalSignatureDialog`, variables dinámicas de plantilla.
   - Ejercicio: abrir contrato, leerlo, escribir nombre completo, firmar.
   - Validar: registro en `digital_signatures`, contrato descargable.
   - Error frecuente: nombre no coincide con perfil → mostrar comparación.

4. **Asistencia y gastos personales (25 min)** — `attendance_records` (7/5/0), `event_expenses` personales con evidencia.
   - Ejercicio: registrar asistencia del día, cargar 1 gasto con boleta de respaldo.
   - Validar: puntaje correcto según horario, gasto en estado "Pendiente".
   - Error frecuente: subir evidencia con URL absoluta o formato inválido → ruta relativa en Storage.

5. **Boletas – emisión propia (20 min)** — `InvoicesTable` vista usuario, total = base + gastos aprobados, fecha de pago automática según ciclo.
   - Ejercicio: revisar su boleta auto-creada, ver desglose, subir comprobante SII (rol acreditador).
   - Validar: total coincide con base + gastos aprobados; fecha de pago corresponde al día configurado.
   - Error frecuente: editar monto manualmente esperando que se sume → explicar que es calculado.

---

### Sesión 2 — Administración, configuración y soporte (90 min)

**Resumen de 2 min de Sesión 1** (recap para quien faltó: login, rol activo, ciclo evento→firma→asistencia→gasto→boleta).

**Resumen ejecutivo (3 líneas):** Al terminar, el administrador sabrá sincronizar HubSpot, asignar equipos a eventos con turnos AM/PM/Full, gestionar usuarios (alta, carga masiva, aprobación, eliminación), procesar rendiciones masivas, atender tickets de soporte y configurar integraciones, permisos, plantillas WhatsApp y firma digital.

**Bloques (suman 90 min):**

1. **Gestión de usuarios (20 min)** — `UsersTable`, pestañas pendientes/aprobados/rechazados, `UserBulkUploadDialog`, `delete-user` edge function, `ConfirmDialog`.
   - Ejercicio: aprobar 1 pendiente, crear 1 usuario manual, cargar CSV de 2 usuarios, enviar WhatsApp masivo de bienvenida.
   - Validar: usuarios aparecen en "Aprobados", reciben WhatsApp, RUT con formato XX.XXX.XXX-X.
   - Error frecuente: CSV con RUT sin formato → mostrar normalización.

2. **Eventos – administración y asignación (20 min)** — `EventsAdminTable`, sync HubSpot (`hubspot-deals`), `EventTeamDialog` con turnos, `EventGeneralExpensesDialog`, descarga masiva de contratos.
   - Ejercicio: sincronizar HubSpot, asignar 2 acreditadores con turnos distintos (AM/Full), cargar 1 gasto general del evento, descargar contratos.
   - Validar: equipo guardado con `assigned_role`, sin conflictos de agenda, contratos PDF descargables.
   - Error frecuente: asignar mismo usuario en horarios traslapados → validación de conflicto de agenda.

3. **Rendiciones masivas (15 min)** — `Reimbursements`, selección masiva, barra flotante, comprobante único compartido, export CSV.
   - Ejercicio: filtrar boletas pendientes, seleccionar 3, marcar como pagadas con un único comprobante, enviar WhatsApp masivo, exportar CSV.
   - Validar: `payment_date` actualizado, mismo `evidence_path` en las 3, CSV con columnas correctas.
   - Error frecuente: "Seleccionar todo" cuando hay filtros activos → recordar que solo afecta lo visible.

4. **Soporte – tickets (10 min)** — `TicketsTable`, prioridad, evidencia bidireccional (creador / resolvedor).
   - Ejercicio: el usuario crea un ticket con evidencia, el admin lo resuelve adjuntando su propia evidencia.
   - Validar: ambos archivos visibles en `TicketDetailDialog`, estado "Resuelto".
   - Error frecuente: confundir el campo de evidencia del resolvedor con el del creador.

5. **Configuración del sistema (20 min)** — `Settings`: HubSpot token, Meta/WABA, días de pago, glosa SII, roles dinámicos, permisos por rol, plantillas WhatsApp, firma digital, FAQs, categorías de tickets, visibilidad de campos de perfil.
   - Ejercicio: cambiar 1 día de ciclo de pago, editar glosa SII, crear 1 plantilla WhatsApp y enviarla a aprobación de Meta, ajustar 1 permiso de sidebar.
   - Validar: nuevos cálculos de fecha respetan el ciclo, plantilla aparece con estado "Pendiente", sidebar de rol afectado cambia.
   - Error frecuente: editar plantilla aprobada y perder aprobación → mostrar motivos de rechazo Meta.

6. **Cierre y dudas (5 min)** — Preguntas abiertas, recordatorio: el sistema es el canal único oficial.

---

### Anexo — 5 ejercicios de repaso autónomo

1. Crear evento de prueba, asignarse a sí mismo en turno PM, firmar contrato y registrar asistencia incompleta (5 pts).
2. Cargar CSV de 3 usuarios con un RUT mal formateado y corregir el error reportado.
3. Procesar pago masivo de 5 boletas filtradas por mes con un único comprobante.
4. Crear ticket con evidencia, cambiarlo a otro rol activo y resolverlo desde admin.
5. Crear plantilla WhatsApp con 2 variables posicionales `{{1}} {{2}}`, enviarla a aprobación y simular reintento tras rechazo.

## Generación técnica

Script Python con `reportlab` (US Letter, márgenes 1", Helvetica, azul primario `#0A84FF` para títulos, tablas para bloques con columnas Tiempo / Contexto / Ejercicio / Validar / Error). QA visual convirtiendo a PNG antes de entregar como `<presentation-artifact>`.
