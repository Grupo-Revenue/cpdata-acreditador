
## Filtrar sidebar por rol activo en lugar de todos los roles

### Problema

Actualmente el sidebar filtra los items de navegacion usando la lista completa de roles del usuario (`roles`), en lugar del rol activo (`activeRole`). Esto significa que un usuario con roles `superadmin` y `administracion`, al ingresar como `administracion`, sigue viendo "Configuracion" porque su lista de roles incluye `superadmin`.

### Solucion

Un cambio de una sola linea en `src/components/layout/Sidebar.tsx`:

| Archivo | Cambio |
|---------|--------|
| `src/components/layout/Sidebar.tsx` | Cambiar el filtro de navegacion para usar `activeRole` en vez de `roles`. Si el item tiene restriccion de roles, verificar que `activeRole` este incluido en esa lista. |

### Detalle tecnico

**Linea 46**: Agregar `activeRole` al destructuring de `useAuth()`.

**Linea 48-51**: Cambiar la logica de filtrado:

```text
// Antes (usa todos los roles del usuario):
const filteredNavItems = navItems.filter(item => {
  if (!item.roles) return true;
  return item.roles.some(role => roles.includes(role as any));
});

// Despues (usa solo el rol activo):
const filteredNavItems = navItems.filter(item => {
  if (!item.roles) return true;
  return activeRole ? item.roles.includes(activeRole) : false;
});
```

Con este cambio, al ingresar como `administracion`, no se vera "Configuracion" en el sidebar. Solo al ingresar como `superadmin` aparecera.
