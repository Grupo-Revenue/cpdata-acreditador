

## Plan: Flujo de postulación de usuarios a eventos

### Contexto
Actualmente al asignar un supervisor/acreditador a un evento, quedan con estado `pendiente` y el admin los acepta directamente. El cambio es agregar un paso intermedio: el usuario asignado debe **postular** activamente, y luego el admin/supervisor confirma.

### Nuevo flujo
```text
Admin asigna → asignado → Usuario postula → pendiente → Admin acepta/rechaza → aceptado/rechazado
```

### Cambios

**1. Migración SQL**
- Agregar valor `'asignado'` al enum `application_status`
- Cambiar el default de `event_accreditors.application_status` de `'pendiente'` a `'asignado'`

**2. `src/components/events/EventsUserTable.tsx`**
- Agregar estado `'asignado'` al `getDisplayStatus`: mostrar badge "Asignado" (azul/info)
- Agregar botón "Postular" en la columna de acciones cuando `applicationStatus === 'asignado'` y el evento está abierto
- Al hacer clic en "Postular", actualizar `application_status` a `'pendiente'` en `event_accreditors`
- Deshabilitar firma digital cuando el estado es `'asignado'`

**3. `src/components/events/EventApplicantsDialog.tsx`**
- Agregar `'asignado'` a `statusStyles` y `statusLabels` (badge "Asignado")
- Agregar opción "Asignado" al filtro de postulación
- Los botones de aceptar/rechazar solo se muestran cuando `application_status === 'pendiente'` (ya es así)

**4. `src/components/events/EventTeamDialog.tsx`**
- Sin cambios de lógica; al insertar registros el default del DB será `'asignado'`

### Archivos a modificar
- Nueva migración SQL (enum + default)
- `src/components/events/EventsUserTable.tsx`
- `src/components/events/EventApplicantsDialog.tsx`

