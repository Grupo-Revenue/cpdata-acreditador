## Problema
La tabla de eventos para roles de acreditador/supervisor (`EventsUserTable`) ya cuenta con un panel de filtros por columna. Sin embargo, la tabla de eventos para administradores (`EventsAdminTable`) **no tiene ningún panel de búsqueda ni filtros**.

## Solución
Agregar a `EventsAdminTable` un panel de filtros equivalente al que ya existe en `EventsUserTable`, adaptado a las columnas que muestra la tabla admin:

- **Filtro por Id** (`dealname`)
- **Filtro por Nombre del Evento** (`nombre_del_evento`)
- **Filtro por Tipo** (`tipo_de_evento`)
- **Filtro por Locación** (`locacion_del_evento`)
- **Filtro por Fecha Inicio** (`fecha_inicio_del_evento`)
- **Filtro por Horario** (`hora_de_inicio_y_fin_del_evento`)
- **Filtro por Etapa** (`dealstage`)
- **Filtro por Estado** (estado interno del evento: Abierto/Cerrado)

## Cambios técnicos
1. **`src/components/events/EventsAdminTable.tsx`**:
   - Agregar estado `filters` con las claves correspondientes.
   - Agregar `filteredDeals` con `useMemo` que aplique los filtros sobre `deals` (igual que en `EventsUserTable`).
   - Agregar la grilla de inputs `<Input>` debajo de los botones de acción y sobre la tabla.
   - Usar `filteredDeals` para la paginación en lugar de `deals`.
   - Resetear `currentPage` a 1 cuando cambien los filtros.

No se modifican otras páginas ni componentes. La tabla de usuarios (`EventsUserTable`) ya tiene filtros y no necesita cambios.