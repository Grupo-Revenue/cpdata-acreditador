

## Plan: Crear boletas automaticamente al asignar equipo

### Cambio en `src/components/events/EventTeamDialog.tsx`

Modificar la funcion `handleSave` (linea 229) para que, despues de insertar las asignaciones en `event_accreditors`, tambien cree un registro en `invoices` por cada usuario **nuevo** (que no tenia asignacion previa).

### Logica

1. Antes de borrar las asignaciones existentes, guardar la lista actual de `existingAssignments` para saber quienes ya estaban asignados.
2. Despues de insertar en `event_accreditors`, calcular los usuarios nuevos: los que estan en `allSelected` pero no estaban en `existingAssignments`.
3. Para cada usuario nuevo, verificar si ya existe una boleta para ese `user_id` + `event_id` en la tabla `invoices` (para evitar duplicados si se reasigna).
4. Insertar registros en `invoices` solo para los que no tengan boleta existente, con:
   - `user_id`: el ID del usuario
   - `event_id`: el ID del evento
   - `amount`: 0 (valor por defecto, el admin lo editara despues)
   - `status`: 'pendiente'
   - Los demas campos toman sus valores default (emission_date = hoy, created_by = auth.uid())

### Detalle tecnico

```text
handleSave():
  1. Obtener/crear evento -> eventId
  2. Guardar previousAssignments = [...existingAssignments]
  3. Borrar event_accreditors del evento
  4. Insertar nuevas asignaciones
  5. Calcular newUserIds = allSelected.filter(id => !previousAssignments.includes(id))
  6. Si hay newUserIds:
     a. Consultar invoices existentes para ese event_id + user_ids
     b. Filtrar los que ya tienen boleta
     c. Insertar invoices para los restantes
  7. Invalidar query de invoices
```

### Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` | Agregar creacion automatica de boletas en `handleSave` |

No se requieren cambios en base de datos.

