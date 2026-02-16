

## Simplificar permisos: solo controlar el menu de navegacion

### Objetivo

Eliminar la seccion de "Acciones en tablas" del sistema de permisos y revertir la logica de las tablas para que usen las verificaciones originales por rol (`isAdmin`, `hasRole`). Los permisos solo controlaran que items del sidebar son visibles para cada rol.

### Cambios

**1. `src/components/settings/PermissionsSettings.tsx`**
- Eliminar la constante `ACTION_GROUPS` y los iconos asociados (`Pencil`, `MessageSquare`, `Upload`, `UserCheck`, `Download`, `Plus`)
- Eliminar la seccion "Acciones en tablas" del JSX (el `<Separator />` y todo el bloque de actions)
- Actualizar la descripcion del card a solo mencionar "elementos del menu"

**2. `src/components/invoices/InvoicesTable.tsx`**
- Eliminar el import y uso de `usePermissions`
- Restaurar la logica original basada en un prop `isAdmin` para mostrar/ocultar botones de Editar, WhatsApp y Upload

**3. `src/components/events/EventsAdminTable.tsx`**
- Eliminar el import y uso de `usePermissions`
- Restaurar la logica original basada en `hasRole` para `canEdit` y `canAssignTeam`

**4. `src/pages/app/Support.tsx`**
- Revertir `canEdit` para usar `isAdmin` en lugar de `canAccess('action.support.edit')`
- Eliminar el import y uso de `usePermissions` si ya no se necesita

### Resultado

La pestana de Permisos en Configuracion solo mostrara los switches del menu de navegacion (Dashboard, Usuarios, Eventos, Boletas, Rendiciones, Soporte, Ranking). Las acciones dentro de las tablas volveran a funcionar con la logica original de roles.
