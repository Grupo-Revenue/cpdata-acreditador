

## Corregir acciones en tablas para que los permisos dinamicos funcionen

### Problema

Es el mismo patron que ocurria con el sidebar: las acciones en las tablas combinan verificaciones estaticas de rol (`isAdmin`, `hasRole(...)`) con `canAccess(...)` usando `&&`. Esto significa que aunque habilites un permiso en Configuracion, si el rol no pasa la verificacion estatica, el boton nunca se muestra.

### Archivos afectados y cambios

**1. `src/components/events/EventsAdminTable.tsx` (linea 54-55)**

Actualmente:
```typescript
const canEdit = (hasRole('superadmin') || hasRole('administracion')) && canAccess('action.events.edit');
const canAssignTeam = hasRole('superadmin') || canAccess('action.events.team');
```

Cambiar a usar solo `canAccess` (ya que `usePermissions` siempre retorna `true` para superadmin):
```typescript
const canEdit = canAccess('action.events.edit');
const canAssignTeam = canAccess('action.events.team');
```

**2. `src/components/invoices/InvoicesTable.tsx` (linea 275)**

Actualmente los botones de editar y WhatsApp estan envueltos en `{isAdmin ? ( ... ) : ( ... )}`, lo que bloquea a roles no-admin incluso si tienen el permiso habilitado.

Cambiar la logica para que cada boton use solo `canAccess`:
- Boton Editar: mostrar si `canAccess('action.invoices.edit')` (sin verificar `isAdmin`)
- Boton WhatsApp: mostrar si `canAccess('action.invoices.whatsapp')` (sin verificar `isAdmin`)
- Boton Upload: mostrar si `canAccess('action.invoices.upload')` (sin verificar `isAdmin`)

Eliminar la estructura condicional `isAdmin ? ... : ...` y mostrar cada boton independientemente segun su permiso.

**3. `src/pages/app/Support.tsx` (lineas 165, 174)**

Actualmente:
```typescript
canEdit={isAdmin && canAccess('action.support.edit')}
```

Cambiar a:
```typescript
canEdit={canAccess('action.support.edit')}
```

Esto aplica en las dos instancias de `TicketsTable` (pendientes y resueltos).

### Resumen de cambios

| Archivo | Linea | Antes | Despues |
|---|---|---|---|
| EventsAdminTable.tsx | 54 | `(hasRole(...)) && canAccess(...)` | `canAccess('action.events.edit')` |
| EventsAdminTable.tsx | 55 | `hasRole(...) \|\| canAccess(...)` | `canAccess('action.events.team')` |
| InvoicesTable.tsx | 275 | `isAdmin ? (botones) : (upload)` | Cada boton con su `canAccess` independiente |
| Support.tsx | 165 | `isAdmin && canAccess(...)` | `canAccess('action.support.edit')` |
| Support.tsx | 174 | `isAdmin && canAccess(...)` | `canAccess('action.support.edit')` |

### Principio

El hook `usePermissions` ya maneja que superadmin siempre tenga acceso total. Por lo tanto, no es necesario agregar verificaciones de rol adicionales. Solo se necesita `canAccess('permiso')` para decidir si mostrar o no una accion.

