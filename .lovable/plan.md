

## Plan: Corregir creacion automatica de boletas y agregar eliminacion al desasignar

### Problema identificado

1. **Las boletas no se crean**: El insert a `invoices` puede fallar silenciosamente si hay un problema con la politica RLS o si el error no se captura correctamente. Se debe agregar manejo de errores explicito.

2. **No se eliminan boletas al desasignar**: Actualmente, cuando se quita a un usuario del equipo, su boleta permanece en la tabla `invoices`. Se debe eliminar el registro correspondiente.

### Cambios en `src/components/events/EventTeamDialog.tsx`

Modificar la funcion `handleSave` para:

#### 1. Eliminar boletas de usuarios desasignados

Despues de actualizar `event_accreditors`, calcular los usuarios que fueron **removidos** (`previousAssignments` que no estan en `allSelected`) y borrar sus registros en `invoices` para ese `event_id`.

#### 2. Crear boletas para todos los nuevos asignados

Mantener la logica existente de creacion, pero asegurar que los errores se capturen y muestren correctamente.

### Logica actualizada

```text
handleSave():
  1. Obtener/crear evento -> eventId
  2. Guardar previousAssignments = [...existingAssignments]
  3. Borrar event_accreditors del evento
  4. Insertar nuevas asignaciones
  5. Calcular removedUserIds = previousAssignments que NO estan en allSelected
  6. Si hay removedUserIds:
     -> DELETE FROM invoices WHERE event_id = eventId AND user_id IN (removedUserIds)
  7. Calcular newUserIds = allSelected que NO estaban en previousAssignments
  8. Si hay newUserIds:
     a. Consultar invoices existentes para ese event_id + user_ids
     b. Filtrar los que ya tienen boleta
     c. Insertar invoices para los restantes (amount: 0)
  9. Invalidar queries de invoices y event-assignments
```

### Detalle tecnico

| Archivo | Cambio |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` | Agregar eliminacion de boletas al desasignar, mejorar manejo de errores en creacion |

No se requieren cambios en base de datos.

