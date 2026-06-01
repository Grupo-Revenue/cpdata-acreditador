## Cambios en `src/pages/app/Reimbursements.tsx`

Unificar la columna **Acciones** del panel de rendiciones para que, igual que en boletas, muestre todas las acciones en una sola celda para superadmin y administración.

### 1. Visibilidad de la columna

- Mostrar la columna **Acciones** para `superadmin`, `administracion` y `supervisor` mientras la rendición no esté cerrada (`!isReimbursementClosed`).
- Eliminar la celda duplicada actual (una para superadmin con aprobar/rechazar y otra separada para eliminar). Combinar en un único `<TableCell>`.

### 2. Botones por fila

En la celda Acciones, renderizar (en este orden) usando íconos `lucide-react` ya importados:

| Botón | Icono | Condición | Acción |
|---|---|---|---|
| Aprobar | `CheckCircle` | `isAdmin` y `approval_status === 'pendiente'` | `approveExpense(exp.id)` |
| Rechazar | `XCircle` | `isAdmin` y `approval_status !== 'rechazado'` | `rejectExpense(exp.id)` |
| Subir comprobante | `Upload` | `isAdmin` o `isSupervisor`, y `!exp.receipt_url` y `!isReimbursementClosed` | input file oculto + upload a bucket `expense-receipts` (reusar lógica existente del supervisor) |
| WhatsApp | `MessageSquare` | `isAdmin` y existe `sup?.phone` del evento | reusar `sendWhatsapp(event.id)` (mensaje al supervisor del evento, igual que el botón actual de la cabecera) |
| Eliminar | `Trash2` | (supervisor) creador propio sin user_id, igual que hoy; (admin) cualquier gasto del evento | `deleteExpense(exp.id)` con `ConfirmDialog` |

Todos con `Button variant="ghost" size="icon" className="h-7 w-7"` y `title` descriptivo (consistente con boletas/tickets).

### 3. Ajustes mínimos

- Mantener la columna **Comprobante** existente; el botón Subir en Acciones es atajo para admin. Si ya hay comprobante, sigue mostrándose el "Ver".
- Quitar el botón WhatsApp de la cabecera del card (queda redundante con el de fila). Mantener solo el masivo "Notificar pendientes".
- `isAdmin` ya cubre superadmin + administracion, no se requieren nuevos permisos ni cambios en RLS (la política `Admins full access event_expenses` permite update/delete/insert).

### 4. Verificación

- Como superadmin/administración: en cada gasto pendiente aparecen los 5 botones (según corresponda); aprobar/rechazar actualiza estado, WhatsApp envía al supervisor del evento, Subir guarda comprobante, Eliminar quita el gasto.
- Como supervisor: ve Subir (si falta) y Eliminar (sus propios gastos), sin Aprobar/Rechazar/WhatsApp.
- Como acreditador o supervisor sin permisos: sin columna Acciones.

No hay cambios en base de datos.