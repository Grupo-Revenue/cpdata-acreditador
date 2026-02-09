

## Plan: Reemplazar filtro de estado por tabs Pendientes/Resueltos

### Resumen
Volver al diseno con tabs para separar tickets por estado (Pendientes y Resueltos), eliminando el select de filtro de estado. Se mantienen los filtros de busqueda por nombre del creador y por prioridad.

---

### Cambios en `src/pages/app/Support.tsx`

1. Eliminar el estado `filterStatus` y su select correspondiente
2. Agregar componente `Tabs` con dos secciones:
   - **Pendientes**: muestra tickets con `status === 'pendiente'`
   - **Resueltos**: muestra tickets con `status === 'resuelto'` o `status === 'inactivo'`
3. Mantener los filtros de busqueda por nombre y prioridad, aplicandolos dentro de cada tab
4. Mostrar el contador de resultados filtrados en cada tab

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/app/Support.tsx` | Reemplazar filtro de estado por Tabs, mantener filtros de nombre y prioridad |

No se requieren cambios en la base de datos ni en otros componentes.

