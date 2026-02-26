

## Diagnostico

El usuario `gabriel@revopslatam.com` tiene 4 roles: superadmin, administracion, supervisor y acreditador. La funcion RLS `is_admin(auth.uid())` verifica la tabla `user_roles` directamente, donde este usuario **siempre** es admin, sin importar que rol activo haya elegido en la interfaz.

Por lo tanto, la politica `"Admins can view all invoices"` siempre se cumple para este usuario, mostrando todas las boletas incluso cuando opera como supervisor.

## Solucion

Este es un problema de **diseño de seguridad vs UX**. Hay dos caminos:

### Opcion A: Filtrar en el frontend (recomendado, rapido)

En `Invoices.tsx`, cuando el usuario NO tiene rol activo admin, filtrar las boletas del lado cliente para mostrar solo las propias:

```tsx
// En la query o despues de obtener datos:
const filtered = isAdmin ? invoices : invoices.filter(inv => inv.user_id === user?.id);
```

Esto respeta el concepto de "rol activo" sin modificar RLS (que correctamente protege a nivel DB). Un usuario con rol admin en BD siempre podra ver todo via API, pero la UI respeta su eleccion de contexto.

### Opcion B: Modificar RLS para respetar rol activo (complejo, no recomendado)

Requeriria pasar el rol activo como parametro de sesion en cada request (`set_config`), lo cual implica cambios profundos en el cliente Supabase y todas las funciones RLS. Demasiado invasivo.

## Plan de implementacion (Opcion A)

**1 archivo**: `src/pages/app/Invoices.tsx`

- Despues de obtener `invoices` del query, aplicar filtro basado en `isAdmin`:
  - Si `isAdmin` es `true` → mostrar todas
  - Si `isAdmin` es `false` → filtrar por `user_id === user.id`
- Usar `user` del `useAuth()` para obtener el ID

