

## Plan: Manejar error de duplicado en asignación de equipo

### Problema
Cuando se intenta asignar el mismo usuario dos veces (ej: como supervisor y acreditador), el `upsert` recibe filas duplicadas con el mismo `(event_id, user_id)`, lo que causa el error de Postgres "ON CONFLICT DO UPDATE command cannot affect row a second time".

### Solución

**Archivo: `src/components/events/EventTeamDialog.tsx`**

1. **Deduplicar filas antes del upsert**: Usar un `Map` por `user_id` para quedarse solo con la última asignación, evitando duplicados en el array.

2. **Capturar el error específico**: En el `catch`, si el mensaje contiene "cannot affect row a second time", mostrar el toast: **"Ya existe seleccionado y no puede estar duplicado"** en vez del error técnico.

### Cambios concretos
- Antes de línea 340: deduplicar `rows` por `user_id` usando un Map
- En el bloque `catch` del save: detectar el mensaje de error y mostrar el toast personalizado

