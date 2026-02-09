

## Plan: Filtros de busqueda en tickets de soporte

### Resumen
Agregar una barra de filtros encima de la tabla de tickets con busqueda por nombre del creador, filtro por estado y filtro por prioridad. Los filtros se aplican del lado del cliente sobre los tickets ya cargados.

---

### Cambios en `src/pages/app/Support.tsx`

1. Agregar estados para los filtros:
   - `searchCreator` (string) - texto libre para buscar por nombre/apellido del creador
   - `filterStatus` (string) - valor seleccionado: "todos", "pendiente", "resuelto", "inactivo"
   - `filterPriority` (string) - valor seleccionado: "todas", "alta", "media", "baja"

2. Reemplazar las tabs de "Pendientes"/"Resueltos" por una vista unica con filtros, ya que el filtro por estado hace redundante la separacion por tabs.

3. Agregar una barra de filtros con:
   - Un `Input` con placeholder "Buscar por nombre del creador..." e icono de busqueda
   - Un `Select` para estado con opciones: Todos, Pendiente, Resuelto, Inactivo
   - Un `Select` para prioridad con opciones: Todas, Alta, Media, Baja

4. Filtrar los tickets en el cliente:
   ```
   filteredTickets = tickets
     .filter(por searchCreator en creator_nombre + creator_apellido)
     .filter(por filterStatus si no es "todos")
     .filter(por filterPriority si no es "todas")
   ```

5. Mostrar contador de resultados: "Mostrando X de Y tickets"

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/app/Support.tsx` | Agregar filtros, reemplazar tabs por vista unica filtrada |

No se requieren cambios en la base de datos ni en otros componentes.

