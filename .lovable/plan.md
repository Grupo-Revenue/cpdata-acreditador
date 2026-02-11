

## Plan: Mostrar nombre_del_evento en lugar de dealname

### Problema

Los eventos existentes en la base de datos ya tienen guardado el `dealname` (ej: `#5104`, `#5095`) en el campo `name`, no el `nombre_del_evento` descriptivo. El cambio anterior en `Events.tsx` solo afecta a eventos **nuevos**. Los 3 eventos existentes siguen mostrando el nombre incorrecto.

### Solucion

Dos cambios son necesarios:

#### 1. Actualizar el nombre del evento existente al guardar equipo

En `src/components/events/EventTeamDialog.tsx`, cuando el evento ya existe (linea 233-237), tambien actualizar el campo `name` con el `dealName` recibido como prop.

#### 2. Mostrar `nombre_del_evento` en la tabla de eventos

En `src/pages/app/Events.tsx`, la columna "Nombre del Evento" ya muestra `deal.nombre_del_evento`. Esto esta correcto para la vista de eventos.

El problema principal esta en la tabla de **boletas**, que muestra `events.name` desde la base de datos, y ese campo tiene el valor viejo.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` | Cuando el evento ya existe, actualizar su `name` con el `dealName` actual |

### Detalle tecnico

En `EventTeamDialog.tsx`, despues de encontrar el evento existente (linea 237), agregar un update:

```text
if (evt && dealName) {
  await supabase.from('events').update({ name: dealName }).eq('id', evt.id);
}
```

Esto corregira el nombre de los eventos existentes la proxima vez que se guarde una asignacion de equipo. Los 3 eventos actuales (`#5104`, `#5095`, `#5088`) se actualizaran automaticamente.
