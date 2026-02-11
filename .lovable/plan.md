

## Plan: Ajustar columnas de boletas y nombre de evento

### Cambios

#### 1. Eliminar columna "Fecha evento" de la tabla de boletas

En `src/components/invoices/InvoicesTable.tsx`:
- Eliminar la columna "Fecha evento" del header
- Eliminar la celda correspondiente del body
- Actualizar el `colSpan` del estado vacio de 9 a 8

#### 2. Mostrar `nombre_del_evento` en vez de `dealname` como nombre del evento

En `src/components/events/EventTeamDialog.tsx`:
- Al crear el registro en la tabla `events`, pasar el `nombre_del_evento` del deal en lugar del `dealname`
- Esto requiere recibir el nombre del evento como prop adicional o buscarlo del deal

En `src/pages/app/Events.tsx`:
- Pasar `teamDeal?.nombre_del_evento` como `dealName` al componente `EventTeamDialog`, en lugar de `teamDeal?.dealname`

### Detalle tecnico

| Archivo | Cambio |
|---------|--------|
| `src/components/invoices/InvoicesTable.tsx` | Eliminar columna "Fecha evento", actualizar colSpan |
| `src/pages/app/Events.tsx` | Cambiar `dealName={teamDeal?.dealname}` a `dealName={teamDeal?.nombre_del_evento}` |

No se requieren cambios en base de datos. Los registros de eventos existentes mantendran el nombre anterior; los nuevos usaran el nombre correcto del evento.

