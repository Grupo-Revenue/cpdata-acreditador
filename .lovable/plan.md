

## Plan: Permitir a superadmin y administracion agregar gastos en rendiciones

### Problema
Actualmente solo el rol `supervisor` puede agregar gastos adicionales en la vista de rendiciones. Los roles `superadmin` y `administracion` solo pueden ver y aprobar/rechazar, pero no agregar.

### Cambios en `src/pages/app/Reimbursements.tsx`

1. **Formulario de agregar gasto (linea 574)**: Cambiar la condicion `isSupervisor && !isReimbursementClosed` a `(isSupervisor || isAdmin) && !isReimbursementClosed` para que el boton "Agregar adicional" y el formulario aparezcan tambien para superadmin y administracion.

2. **Columna de acciones en tabla (linea 526)**: Actualizar la condicion del `<TableHead>` de acciones para incluir `isAdmin` cuando la rendicion no esta cerrada, de modo que admin pueda ver botones de eliminar sus propios gastos.

3. **Celda de eliminar (linea 555-562)**: Agregar una celda de acciones para `isAdmin && !isReimbursementClosed` que permita eliminar gastos creados por el admin (misma logica: `exp.created_by === user!.id`).

### Archivos a modificar
- `src/pages/app/Reimbursements.tsx` (unico archivo)

