

## Plan: Agregar columna "Estado" (Abierto/Cerrado) en ambas tablas de eventos

### Contexto
El estado abierto/cerrado es del sistema interno (tabla `events.status`), no de HubSpot. Cuando un supervisor cierra un evento, todos los roles deben poder ver ese estado.

### Cambios

**1. `src/components/events/EventsAdminTable.tsx`**
- Agregar query a la tabla `events` para obtener `status` por `hubspot_deal_id` de todos los deals visibles
- Agregar columna "Estado" con badge:
  - `pending` / `in_progress` → Badge verde "Abierto"
  - `completed` / `cancelled` → Badge gris "Cerrado"

**2. `src/components/events/EventsUserTable.tsx`**
- Ya tiene `eventStatus` en el `statusMap` existente (línea 68)
- Agregar columna "Estado Evento" separada de la columna "Estado" actual (que muestra estado de postulación)
- Usar `eventStatus` para mostrar "Abierto" o "Cerrado" con el mismo esquema de badges

### Sin cambios de base de datos
La columna `events.status` ya existe con los valores necesarios.

