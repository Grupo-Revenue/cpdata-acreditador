

## Plan: Vista de detalle de ticket para Supervisor y Acreditador

### Resumen
Crear un dialog de solo lectura (`TicketDetailDialog`) para que los roles Supervisor y Acreditador puedan ver el detalle completo de sus tickets, incluyendo observaciones del responsable y archivo adjunto. Agregar un boton "Ver" en la tabla para estos roles.

---

### 1. Nuevo archivo: `src/components/support/TicketDetailDialog.tsx`

Dialog de solo lectura que muestra:
- ID del ticket y fecha de creacion (bloqueados)
- Datos del creador (nombre, email, telefono, RUT, rol)
- Datos del ultimo editor/responsable (si existe)
- Motivo del ticket
- Prioridad y estado (como texto, no editables)
- Observaciones del responsable (si las hay)
- Enlace para ver/descargar la evidencia adjunta (si existe)
- Un unico boton "Cerrar"

### 2. Cambios en `TicketsTable.tsx`

- Agregar prop `onView` (callback) y `canView` (boolean)
- Agregar un boton con icono de "ojo" (Eye de lucide-react) en la columna de acciones
- Si `canEdit` es true, mostrar boton Editar (como ahora)
- Si `canView` es true y `canEdit` es false, mostrar boton Ver
- Siempre mostrar la columna de acciones cuando haya al menos una accion disponible

### 3. Cambios en `Support.tsx`

- Importar `TicketDetailDialog`
- Agregar estado para controlar el dialog de detalle (`detailOpen`, `detailTicket`)
- Crear handler `handleView` que abre el `TicketDetailDialog`
- Pasar `onView={handleView}` y `canView={!isAdmin}` a `TicketsTable`
- Resultado: admins ven boton Editar, supervisores/acreditadores ven boton Ver

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/components/support/TicketDetailDialog.tsx` | Crear (dialog solo lectura) |
| `src/components/support/TicketsTable.tsx` | Agregar boton "Ver" y props `onView`/`canView` |
| `src/pages/app/Support.tsx` | Agregar estado y logica para el dialog de detalle |

No se requieren cambios en la base de datos.
