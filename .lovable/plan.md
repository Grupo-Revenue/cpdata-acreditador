

## Agregar adicionales a nivel de evento para Supervisores en Rendiciones

### Problema actual

La tabla `event_expenses` tiene `user_id` como `NOT NULL`, lo que obliga a vincular cada gasto a un acreditador. El supervisor necesita poder agregar gastos a nivel de evento (sin asociarlos a un acreditador especifico).

### Cambios necesarios

| Archivo / Recurso | Cambio |
|---|---|
| Migracion SQL | Hacer `user_id` nullable en `event_expenses` y ajustar RLS para supervisores |
| `src/pages/app/Reimbursements.tsx` | Agregar formulario inline para que el supervisor cree nuevos gastos a nivel de evento, con nombre, monto y comprobante opcional |

### Detalle tecnico

**1. Migracion SQL:**
- `ALTER TABLE event_expenses ALTER COLUMN user_id DROP NOT NULL` para permitir gastos sin acreditador asociado
- Actualizar las politicas RLS de supervisores para que validen la asignacion via `event_accreditors` (el supervisor esta asignado al evento como acreditador, lo cual ya funciona)

**2. Formulario de agregar adicional (Supervisor):**
- Dentro de cada Card de evento, agregar un boton "Agregar adicional" visible solo para supervisores cuando las rendiciones no estan cerradas
- Al hacer clic, se muestra un formulario inline con:
  - Nombre del adicional (input text)
  - Monto en CLP (input number)
  - Comprobante (file upload al bucket `expense-receipts`)
- Al guardar, se inserta en `event_expenses` con `user_id = null` (gasto a nivel de evento), `event_id` del evento y `created_by` del supervisor autenticado
- Los gastos sin `user_id` se muestran en la tabla con "Evento" en la columna Acreditador en vez de un nombre
- El supervisor tambien puede eliminar gastos que el haya creado (cuando las rendiciones no estan cerradas)

**3. Ajustes en la tabla de gastos:**
- La columna "Acreditador" muestra "Evento" cuando `user_id` es null
- El boton y formulario se ocultan cuando `reimbursement_closed_at` no es null (modo solo lectura)

