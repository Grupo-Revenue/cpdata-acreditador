

## Plan: Agregar Botón de Eliminar Usuario

### Objetivo
Permitir a los superadmins eliminar usuarios desde la tabla de gestión de usuarios.

---

### Cambios Necesarios

#### 1. Agregar política RLS para DELETE en `profiles`

Actualmente la tabla `profiles` no permite operaciones DELETE. Necesitamos agregar una política:

```sql
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
```

Esta política permitirá que solo usuarios con rol `superadmin` o `administracion` puedan eliminar perfiles.

---

#### 2. Modificar `UsersTable.tsx`

- Agregar prop `onDelete` para manejar la eliminación
- Agregar botón con icono `Trash2` en la columna de acciones
- Estilo destructivo para indicar acción peligrosa

```tsx
interface UsersTableProps {
  users: UserWithRoles[];
  onEdit: (user: UserWithRoles) => void;
  onManageRoles: (user: UserWithRoles) => void;
  onDelete: (user: UserWithRoles) => void;  // Nueva prop
}
```

---

#### 3. Modificar `Users.tsx`

- Agregar estado para usuario a eliminar: `deletingUser`
- Agregar función `handleDelete` que:
  1. Elimina los roles del usuario de `user_roles`
  2. Elimina el perfil de `profiles`
- Agregar un nuevo `ConfirmDialog` para confirmar la eliminación
- Pasar `onDelete` al componente `UsersTable`

---

### Flujo de Eliminación

```text
Usuario clickea botón Eliminar
         │
         ▼
Mostrar ConfirmDialog
         │
         ▼
Usuario confirma ────────────┐
         │                   │
        Sí                  No
         │                   │
         ▼                   ▼
DELETE user_roles        Cerrar dialog
WHERE user_id = X
         │
         ▼
DELETE profiles
WHERE id = X
         │
         ▼
Toast de éxito + refrescar lista
```

---

### Consideraciones de Seguridad

- Solo superadmins/admins pueden ver la tabla de todos los usuarios
- La política RLS verificará en el servidor que el usuario tiene permisos
- Se eliminan primero los roles para evitar referencias huérfanas
- Se muestra confirmación antes de eliminar

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/users/UsersTable.tsx` | Agregar botón de eliminar y prop `onDelete` |
| `src/pages/app/Users.tsx` | Agregar estado, handler y ConfirmDialog para eliminación |

### Base de Datos

| Cambio | Descripción |
|--------|-------------|
| Nueva política RLS | Permitir DELETE en `profiles` para admins |

