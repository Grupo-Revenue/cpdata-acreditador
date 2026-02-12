

## Selector de Rol al Iniciar Sesion

### Objetivo

Cuando un usuario con mas de un rol inicia sesion (o recarga la pagina), mostrar un dialogo modal para que seleccione con cual rol desea operar. Si el usuario tiene un solo rol, se salta este paso y entra directamente.

### Flujo

1. Usuario inicia sesion -> AuthContext carga roles
2. `DashboardRedirect` detecta que el usuario tiene multiples roles
3. Se muestra un dialogo modal con los roles disponibles como opciones
4. El usuario selecciona un rol -> se guarda como `activeRole` en el contexto
5. Se redirige al dashboard correspondiente al rol seleccionado

### Concepto de "Rol Activo"

Se agrega un nuevo estado `activeRole` al `AuthContext`. Este rol activo determina:
- A cual dashboard se redirige
- Que items del sidebar se muestran
- Que permisos se aplican en las vistas

El usuario podra cambiar de rol en cualquier momento desde el sidebar (sin cerrar sesion).

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/contexts/AuthContext.tsx` | Agregar estado `activeRole: AppRole | null` y funcion `setActiveRole`. Exponer ambos en el contexto. Modificar `isAdmin` para que use `activeRole` en lugar de revisar todos los roles. Agregar `getDefaultDashboard` que use `activeRole`. |
| `src/components/auth/RoleSelectDialog.tsx` | **Nuevo componente**. Dialogo modal que muestra los roles del usuario como tarjetas seleccionables. Recibe los roles disponibles y un callback `onSelect`. No se puede cerrar sin seleccionar (sin boton X). |
| `src/pages/dashboard/DashboardRedirect.tsx` | Si el usuario tiene mas de 1 rol y no tiene `activeRole` seleccionado, mostrar `RoleSelectDialog`. Si tiene 1 solo rol, asignarlo automaticamente como `activeRole`. Si ya tiene `activeRole`, redirigir al dashboard correspondiente. |
| `src/components/layout/Sidebar.tsx` | Agregar boton/indicador del rol activo en el footer del sidebar, con opcion de cambiar rol (abre el mismo `RoleSelectDialog`). Filtrar items del sidebar segun `activeRole` en lugar de todos los roles. |
| `src/components/auth/ProtectedRoute.tsx` | Actualizar verificacion de `requiredRoles` para comparar contra `activeRole` en lugar de todos los roles del usuario. |

### Detalle tecnico

**Nuevo estado en AuthContext:**

```text
const [activeRole, setActiveRole] = useState<AppRole | null>(null);

// Se resetea al cerrar sesion
const signOut = async () => {
  setActiveRole(null);
  await supabase.auth.signOut();
  ...
};
```

**RoleSelectDialog (nuevo componente):**

- Dialogo no descartable (sin overlay click ni boton X)
- Muestra cada rol como una tarjeta con icono y nombre
- Al seleccionar, llama a `setActiveRole(role)` del contexto

**Logica en DashboardRedirect:**

```text
if (roles.length === 1) {
  setActiveRole(roles[0]);
  return <Navigate to={getDefaultDashboard(roles[0])} />;
}

if (roles.length > 1 && !activeRole) {
  return <RoleSelectDialog roles={roles} onSelect={setActiveRole} />;
}

if (activeRole) {
  return <Navigate to={getDefaultDashboard(activeRole)} />;
}
```

**Sidebar - Cambio de rol:**

- Se muestra el rol activo actual como badge en el footer
- Boton "Cambiar rol" que abre el RoleSelectDialog
- Solo visible si el usuario tiene mas de 1 rol

**ProtectedRoute - Verificacion por rol activo:**

```text
if (requiredRoles && requiredRoles.length > 0) {
  const hasAccess = requiredRoles.includes(activeRole);
  if (!hasAccess) return <Navigate to="/app/dashboard" />;
}
```

### Iconos por rol

| Rol | Icono |
|-----|-------|
| superadmin | Shield |
| administracion | Settings |
| supervisor | Eye |
| acreditador | BadgeCheck |

