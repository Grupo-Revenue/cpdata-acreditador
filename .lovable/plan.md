## Panel de Clasificación de Tickets de Soporte

Permitir al superadmin definir categorías (ej. "Boletas", "Asistencia a eventos") con su prioridad asociada (alta/media/baja). Al crear un ticket, el usuario elige la categoría y la prioridad se asigna automáticamente.

### 1. Almacenamiento
Usar la tabla `settings` existente (patrón de FAQs). Una sola fila con `key='ticket_categories'` y `value` como JSON:
```json
[
  { "name": "Boletas", "priority": "media" },
  { "name": "Asistencia a eventos", "priority": "alta" },
  { "name": "Otro", "priority": "baja" }
]
```
No requiere migración.

### 2. Nuevo componente
**`src/components/settings/TicketCategoriesSettings.tsx`** (basado en `FaqSettings.tsx`)
- Lista editable de categorías: input `name` + select `priority` (alta/media/baja).
- Botones "Agregar categoría", "Eliminar" por fila, "Guardar cambios".
- Lectura: `settings.select` por `key='ticket_categories'`.
- Escritura: `upsert` en `settings`.

### 3. Integrar en Settings
**`src/pages/app/Settings.tsx`** — Añadir nueva pestaña `<TabsTrigger value="tickets">Tickets</TabsTrigger>` con `<TabsContent>` que renderice `<TicketCategoriesSettings />`.

### 4. Usar en creación de tickets
**`src/components/support/TicketCreateDialog.tsx`**
- Agregar campo "Categoría" (Select) cargado desde `settings.ticket_categories`.
- Al seleccionar una categoría, se asigna automáticamente `priority` según la configuración.
- Mantener el select de prioridad pero deshabilitado/auto (muestra la prioridad inferida; sigue siendo overridable solo si no se eligió categoría, o se puede mantener bloqueado tras elección — propongo bloquearlo para respetar la clasificación).
- Si no hay categorías configuradas, fallback al comportamiento actual (select manual).
- Guardar también `motivo` con prefijo `[Categoría] motivo` para que se vea en la tabla, sin nueva columna.

### Detalle técnico
- Sólo el superadmin puede editar `settings` (política RLS ya existente).
- Lectura abierta a `authenticated`.
- Sin cambios en esquema ni en `support_tickets`.