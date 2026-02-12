
## Agregar cambio de rol en la pagina de Perfil

### Objetivo

Permitir a los usuarios con mas de un rol cambiar su rol activo directamente desde la pagina de perfil, sin necesidad de cerrar sesion.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/app/Profile.tsx` | Agregar una nueva Card entre la seccion de cuenta y la de informacion personal. Muestra el rol activo actual y, si el usuario tiene mas de un rol, un boton para abrir el `RoleSelectDialog` y cambiar de rol. Al seleccionar un nuevo rol, se actualiza el `activeRole` en el contexto y se redirige al dashboard correspondiente. |

### Detalle tecnico

**Nueva seccion "Rol activo":**

- Se ubica despues de la card "Informacion de cuenta"
- Muestra el rol activo actual con su icono correspondiente (Shield, Settings, Eye, BadgeCheck)
- Si el usuario tiene mas de 1 rol, muestra un boton "Cambiar rol"
- Al hacer clic, abre el `RoleSelectDialog` ya existente
- Al seleccionar un nuevo rol, se llama a `setActiveRole(role)` y se usa `useNavigate` para redirigir a `getDashboardForRole(role)`
- Si el usuario tiene un solo rol, la card muestra el rol sin boton de cambio

**Imports adicionales necesarios:**
- `RoleSelectDialog` desde `@/components/auth/RoleSelectDialog`
- `getDashboardForRole` desde `@/contexts/AuthContext`
- `useNavigate` desde `react-router-dom`
- Iconos: `Shield`, `Settings`, `Eye`, `BadgeCheck`, `RefreshCw` desde `lucide-react`

**Estructura de la card:**

```text
Card "Rol activo"
  - Icono + titulo "Rol activo"
  - Descripcion: "Actualmente operando como [rol]"
  - Si tiene multiples roles: boton "Cambiar rol" que abre RoleSelectDialog
  - Al seleccionar nuevo rol -> setActiveRole + navigate al dashboard
```
