

## Filtros externos en EventsUserTable

### Resumen

Mover los filtros de la tabla de eventos (vista supervisor/acreditador) desde dentro del `TableHeader` hacia una fila externa de inputs por encima de la tabla, siguiendo el mismo patron de diseno usado en el dialogo de Postulantes (`EventApplicantsDialog`).

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/EventsUserTable.tsx` | Mover los 6 inputs de filtro fuera del `TableHeader` a un `div` con grid encima del `Card` |

### Detalle tecnico

**Antes (actual):** Los filtros estan en una segunda fila `<TableRow>` dentro de `<TableHeader>`, con cada input dentro de un `<TableHead>`.

**Despues:** Los filtros se mueven a un `div` con clase `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4` ubicado antes del `<Card>`, con cada input usando un placeholder descriptivo:

- Id (dealname)
- Nombre del Evento
- Tipo
- Locacion
- Fecha Inicio
- Horario

Cada input mantiene las mismas clases (`h-8 text-xs`) y la misma logica de filtrado. Solo cambia la ubicacion en el DOM: de dentro del header de la tabla a un bloque externo superior.

La tabla queda con una sola fila de encabezados (sin la fila de filtros), identica visualmente al patron de `EventApplicantsDialog`.

