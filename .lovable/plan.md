

## Plan: Aprobar usuarios sin forzar rol de Acreditador

### Problema
Al aprobar un usuario pendiente, el sistema automaticamente le asigna el rol `acreditador` (hardcoded en linea 146). Si el usuario ya fue creado con roles especificos (ej: supervisor), esto le agrega un rol adicional no deseado. Y si no tiene roles, siempre queda como acreditador sin opcion a elegir.

### Solucion
Separar la aprobacion de la asignacion de roles:

1. **Aprobar** solo cambia el `approval_status` a `approved`, sin tocar roles.
2. Si el usuario **no tiene roles asignados**, se asigna `acreditador` como rol por defecto (ya que necesita al menos un rol para acceder al sistema).
3. Si el usuario **ya tiene roles** (porque fue creado manualmente con roles), no se modifica nada de roles.

### Cambio

**`src/pages/app/Users.tsx`** - funcion `handleApprove` (lineas 131-170):

- Antes de insertar el rol, verificar si el usuario ya tiene roles en `user_roles`.
- Si ya tiene roles: solo actualizar `approval_status` a `approved`.
- Si no tiene roles: actualizar `approval_status` y asignar `acreditador` como rol por defecto.
- Actualizar el mensaje de confirmacion para reflejar este comportamiento: "Se aprobara el acceso. Si no tiene roles asignados, se le asignara Acreditador por defecto."

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/app/Users.tsx` | Condicionar la asignacion de rol en `handleApprove` |

No se requieren cambios en la base de datos.

