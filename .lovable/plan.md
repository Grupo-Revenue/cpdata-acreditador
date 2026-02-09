

## Plan: Filtros de nombre, RUT, email y estado en tablas de usuarios

### Resumen
Agregar una barra de filtros (nombre, RUT, email, estado de aprobacion) directamente en el componente `UsersTable`, de modo que cada tabla en cada tab tenga sus propios filtros. Esto evita duplicar logica de filtrado en la pagina padre.

---

### Cambios

#### 1. `src/components/users/UsersTable.tsx`

Agregar filtros internos al componente:

- Importar `Input`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` y `Search` (icono de lucide).
- Agregar estados locales: `searchName`, `searchRut`, `searchEmail`, `filterStatus`.
- Calcular `filteredUsers` con `useMemo` aplicando los 4 filtros sobre la prop `users`:
  - **Nombre**: busca en `nombre + apellido` (case insensitive)
  - **RUT**: busca parcialmente en `rut`
  - **Email**: busca parcialmente en `email` (case insensitive)
  - **Estado**: filtra por `approval_status` (opciones: Todos, Pendiente, Aprobado, Rechazado)
- Renderizar una barra de filtros encima de la tabla con:
  - Input de nombre con icono de busqueda
  - Input de RUT
  - Input de email
  - Select de estado
- Mostrar contador: "Mostrando X de Y usuarios"
- Usar `filteredUsers` en lugar de `users` para renderizar las filas

#### 2. `src/pages/app/Users.tsx`

- Sin cambios de logica. Los filtros viven dentro de `UsersTable` y se aplican automaticamente en cada tab (Todos, Acreditadores, Supervisores, Administradores).
- La seccion de "Pendientes" usa un layout diferente (cards, no tabla), por lo que no se ve afectada por estos filtros. Si se desea, se puede agregar un filtro similar ahi en una iteracion futura.

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/components/users/UsersTable.tsx` | Agregar barra de filtros internos y logica de filtrado con `useMemo` |

No se requieren cambios en la base de datos.

