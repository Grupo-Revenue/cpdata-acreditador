

## Plan: Corregir error de clave duplicada al asignar equipo

### Problema
Al guardar el equipo de un evento, el código hace `DELETE` seguido de `INSERT` en `event_accreditors`. Si el `DELETE` falla silenciosamente (por RLS o timing), el `INSERT` encuentra registros existentes y lanza el error `duplicate key value violates unique constraint "event_accreditors_event_id_user_id_key"`.

### Solución
Cambiar el `INSERT` en `EventTeamDialog.tsx` (línea 340) a `upsert` con `onConflict: 'event_id,user_id'`, de modo que si un registro ya existe se actualice en vez de fallar.

### Archivo: `src/components/events/EventTeamDialog.tsx`
- Línea 340: cambiar `.insert(rows as any)` por `.upsert(rows as any, { onConflict: 'event_id,user_id' })`

### Archivos a modificar
- `src/components/events/EventTeamDialog.tsx` (1 línea)

