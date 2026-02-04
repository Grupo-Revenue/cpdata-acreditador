
## Objetivo

Mostrar el rol del usuario junto al botón de notificaciones en la barra superior (Topbar), para que sea visible inmediatamente al ingresar al sistema.

## Cambio Propuesto

### Archivo: `src/components/layout/Topbar.tsx`

Agregar un badge/etiqueta con el rol principal del usuario entre el botón de notificaciones y el avatar del usuario.

**Lógica para mostrar el rol:**
- Si el usuario tiene múltiples roles, mostrar el rol de mayor jerarquía (superadmin > administracion > supervisor > acreditador)
- Usar el mismo mapeo `roleLabels` que ya existe para mostrar el nombre legible

**Diseño visual:**
- Badge con fondo suave y texto del color primario
- Tamaño pequeño para no ocupar demasiado espacio
- Responsive: visible en todos los tamaños de pantalla

## Código a Agregar

```tsx
// Obtener el rol principal (el de mayor jerarquía)
const getPrimaryRole = () => {
  const hierarchy: AppRole[] = ['superadmin', 'administracion', 'supervisor', 'acreditador'];
  for (const role of hierarchy) {
    if (roles.includes(role)) {
      return roleLabels[role] || role;
    }
  }
  return null;
};

const primaryRole = getPrimaryRole();
```

Y en el JSX, entre el botón de notificaciones y el menú de usuario:

```tsx
{/* Right side */}
<div className="flex items-center gap-2">
  {/* Notifications */}
  <Button variant="ghost" size="icon" className="relative">
    <Bell className="w-5 h-5" />
    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
  </Button>

  {/* Role badge - NUEVO */}
  {primaryRole && (
    <span className="hidden sm:inline-flex text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
      {primaryRole}
    </span>
  )}

  {/* User menu */}
  ...
</div>
```

## Resultado Esperado

| Rol del Usuario | Texto Mostrado |
|-----------------|----------------|
| superadmin | Super Admin |
| administracion | Administración |
| supervisor | Supervisor |
| acreditador | Acreditador |

## Notas Adicionales

- El badge se oculta en pantallas muy pequeñas (móvil) usando `hidden sm:inline-flex` para mantener el diseño limpio
- Si el usuario tiene múltiples roles, solo se muestra el principal en la barra; los demás siguen visibles en el menú desplegable del avatar
- El import de `AppRole` ya está disponible desde `@/contexts/AuthContext`
