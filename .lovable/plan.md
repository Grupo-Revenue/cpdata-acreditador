

## Plan: Filtros para supervisores y paginacion en ambas tablas

### Cambios en `src/components/events/EventTeamDialog.tsx`

#### 1. Filtros para la tabla de supervisores

Agregar filtros de busqueda (Nombre, RUT, Email) en la seccion de supervisores, siguiendo el mismo patron que ya existe para acreditadores. Se agregaran estados `supFilterNombre`, `supFilterRut`, `supFilterEmail` y un `filteredSupervisors` con `useMemo`.

#### 2. Paginacion en ambas tablas

Agregar paginacion local de 10 registros por pagina en ambas tablas (supervisores y acreditadores):

- Nuevos estados: `supPage` y `accPage` (inician en 1).
- Calcular `paginatedSupervisors` y `paginatedAccreditors` a partir de los datos filtrados.
- Mostrar controles de paginacion debajo de cada tabla con botones "Anterior" / "Siguiente" y el indicador "Pagina X de Y".
- Los filtros reinician la pagina a 1 cuando cambian.

#### 3. Reset al cerrar

Agregar los nuevos estados de filtro de supervisores y las paginas al bloque de reset existente (lineas 127-138).

### Resumen de cambios

| Aspecto | Detalle |
|---------|---------|
| Filtros supervisores | Nombre, RUT, Email (3 inputs con grid) |
| Paginacion supervisores | 10 por pagina, botones Anterior/Siguiente |
| Paginacion acreditadores | 10 por pagina, botones Anterior/Siguiente |
| Archivo afectado | `src/components/events/EventTeamDialog.tsx` (unico) |

No se requieren cambios en base de datos ni en otros archivos.
