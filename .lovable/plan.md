## Entregable

Un archivo PDF imprimible con el guion completo de las 2 sesiones de capacitación (90 min c/u), listo para usar en la reunión.

## Contenido del PDF

**Portada**
- Título: "Guion de Capacitación – Sistema CPData Acreditador"
- Subtítulo: 2 sesiones de 90 minutos
- Fecha

**Sección 0 – Preparación previa (1 día antes)**
- Checklist de datos de prueba: 8 usuarios (superadmin, admin, 2 supervisores, 3 acreditadores aprobados, 2 pendientes), 3 eventos HubSpot, 3 plantillas WhatsApp aprobadas, días de pago, glosa SII, plantilla de contrato, FAQs, categorías de tickets, asistencia, gastos (1 aprobado / 1 pendiente / 1 rechazado), 1 ticket pendiente y 1 resuelto.
- Tips logísticos: HubSpot abierto en otra pestaña, WhatsApp Web visible, rol activo según módulo.

**Sesión 1 – Fundamentos, Usuarios y Eventos (90 min)**
Para cada bloque: tiempo estimado, qué decir (script en primera persona), qué hacer en pantalla, puntos clave a enfatizar.
- Bloque 1 (10 min): Login, selector de rol activo, sidebar y diferencias por rol.
- Bloque 2 (20 min): Usuarios – pendientes, aprobación, roles, edición, carga CSV, WhatsApp masivo, eliminación con ConfirmDialog.
- Bloque 3 (25 min): Eventos vista admin – sync HubSpot, asignación de equipo (Full/AM/PM), postulantes, gastos generales, contrato PDF, WhatsApp a supervisores.
- Bloque 4 (20 min): Eventos vista acreditador/supervisor – ciclo postulación→aceptación→firma digital→asistencia (7/5/0)→gastos personales.
- Bloque 5 (15 min): Boletas – creación, fecha de pago automática, total = base + gastos aprobados, subida comprobante SII, WhatsApp masivo.

**Sesión 2 – Rendiciones, Soporte, Ranking y Configuración (90 min)**
- Bloque 1 (25 min): Rendiciones – flujo de pago masivo (checkbox, barra flotante, comprobante único), filtros, WhatsApp, export CSV.
- Bloque 2 (15 min): Soporte – tickets, prioridad, evidencia bidireccional, vista admin vs usuario.
- Bloque 3 (10 min): Ranking – cálculo por asistencia, comentarios admin.
- Bloque 4 (30 min): Configuración – días de pago, glosa SII, roles, permisos, HubSpot, Meta/WhatsApp, plantillas, firma digital, FAQs, categorías de tickets.
- Bloque 5 (10 min): Cierre – recap, soporte continuo, preguntas.

**Anexo**
- Frases clave para enfatizar (ConfirmDialog, exclusividad del sistema, rol activo).
- Posibles preguntas del cliente y respuestas sugeridas.

## Cómo se genera

Script Python con `reportlab` que produce un PDF profesional (US Letter, márgenes 1", tipografía Helvetica, títulos en azul primario del sistema, tablas para checklists y bloques de tiempo). Se guarda en `/mnt/documents/guion_capacitacion.pdf` y se entrega vía `<presentation-artifact>`. QA visual convirtiendo a imágenes antes de entregar.

## Sin cambios en el código del proyecto

Solo se genera el PDF como artefacto descargable. No se modifica la app.