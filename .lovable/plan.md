

## Corregir prioridad de permisos sobre restricciones estaticas

### Problema

El Sidebar tiene dos sistemas de control de acceso que entran en conflicto:

1. **Restriccion estatica** (`roles`): lista fija de roles permitidos en el codigo (ej: Users solo para `superadmin` y `administracion`).
2. **Permisos dinamicos** (`permissionKey`): configurados por el superadmin desde Configuracion > Permisos.

Actualmente, la restriccion estatica se evalua **primero** y bloquea el acceso sin importar lo que digan los permisos dinamicos. Esto hace que habilitar un permiso desde la UI no tenga efecto si el rol no esta en la lista estatica.

### Solucion

Cambiar la logica de filtrado en el Sidebar para que:
- Si un item tiene `permissionKey`, se use **solo** el sistema de permisos dinamicos (la tabla `role_permissions`).
- Si un item **no** tiene `permissionKey` (como Configuracion), se mantenga la restriccion estatica por `roles`.
- El superadmin sigue viendo todo sin restricciones (ya lo maneja `usePermissions`).

### Cambio tecnico

**Archivo: `src/components/layout/Sidebar.tsx`**

Modificar la funcion `filteredNavItems` (linea 51-55):

```text
// Antes:
if (item.roles && ...) return false;
if (item.permissionKey && !canAccess(...)) return false;

// Despues:
if (item.permissionKey) {
  // Si tiene permissionKey, usar solo el sistema dinamico
  if (!canAccess(item.permissionKey)) return false;
} else if (item.roles) {
  // Si solo tiene roles estaticos (ej: Configuracion), usar la lista fija
  if (!(activeRole ? item.roles.includes(activeRole) : false)) return false;
}
```

Ademas, eliminar el campo `roles` de los items que ya tienen `permissionKey` (como Usuarios), ya que el control se delega completamente al sistema de permisos.

Tambien se debe verificar que la ruta `/app/users` en `App.tsx` permita el acceso a roles adicionales cuando el permiso este habilitado. Actualmente tiene `requiredRoles={['superadmin', 'administracion']}`, lo que bloquearia el acceso incluso si el sidebar muestra el enlace. Se ajustara el `ProtectedRoute` para que no restrinja por rol cuando hay un permiso dinamico habilitado.

**Archivo: `src/pages/app/Users.tsx` o `src/App.tsx`**

Ampliar los roles permitidos en la ruta de Users para incluir todos los roles que podrian tener el permiso habilitado, o remover la restriccion de roles y dejar que el sistema de permisos maneje el acceso.

**Archivos modificados:**
| Archivo | Cambio |
|---|---|
| `src/components/layout/Sidebar.tsx` | Priorizar `permissionKey` sobre `roles` en el filtrado |
| `src/App.tsx` | Ajustar `requiredRoles` en rutas que tienen permisos dinamicos |

