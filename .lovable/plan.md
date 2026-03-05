

## Plan: Cambiar etiqueta "Administradores" a "Administración" en Users.tsx

### Cambio

**Archivo: `src/pages/app/Users.tsx`**

- Línea 465: Cambiar el texto del `TabsTrigger` de `Administradores` a `Administración`
- Línea 486: Cambiar el `title` del `RoleTabContent` de `"Administradores"` a `"Administración"`

Son solo 2 cambios de texto en el mismo archivo. El resto del sistema (RoleSelectDialog, Topbar, Sidebar) ya usa "Administración" correctamente.

