

## Plan: Sincronizar nombre_del_evento de HubSpot a la tabla events

### Problema

La tabla `events` almacena el `dealname` (ej: `#5095`, `#5104`) en el campo `name` para 2 de 3 eventos. El evento `#5088` ya se corrigio a "Entel Suppliers Day" porque alguien guardo su equipo. Pero los otros 2 solo se actualizaran si alguien abre y guarda manualmente la asignacion de equipo, lo cual no es practico.

### Solucion

Agregar una sincronizacion automatica en la pagina de Eventos: cuando se cargan los deals de HubSpot, actualizar el campo `name` de los eventos existentes en la base de datos con el `nombre_del_evento` del deal correspondiente.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/app/Events.tsx` | Despues de cargar los deals de HubSpot, ejecutar un update en la tabla `events` para sincronizar el `name` con `nombre_del_evento` de cada deal que tenga un evento local asociado |

### Detalle tecnico

En `Events.tsx`, dentro del `queryFn` de `hubspot-deals` (o en un `useEffect` posterior), recorrer los deals obtenidos y para cada uno que tenga `nombre_del_evento`, ejecutar:

```text
await supabase
  .from('events')
  .update({ name: deal.nombre_del_evento })
  .eq('hubspot_deal_id', deal.id);
```

Esto se ejecutara cada vez que se cargue la pagina de Eventos, asegurando que todos los nombres esten siempre actualizados sin intervencion manual. El costo es minimo (unas pocas queries de update que no cambian nada si el nombre ya es correcto).

