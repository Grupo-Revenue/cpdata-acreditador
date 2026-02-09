
## Plan: Corregir error al aprobar usuarios

### Problema
Al aprobar un usuario, el sistema intenta insertar el rol `acreditador` en `user_roles`. Si el usuario ya tiene ese rol asignado (por ejemplo, fue creado manualmente con roles), la insercion falla con un error de clave duplicada: `duplicate key value violates unique constraint "user_roles_user_id_role_key"`.

### Solucion
Cambiar el `insert` por un `upsert` con `onConflict` para que si el rol ya existe, simplemente lo ignore en lugar de fallar.

### Cambio

**`src/pages/app/Users.tsx`** (linea 143-145):

Reemplazar:
```typescript
const { error: roleError } = await supabase
  .from('user_roles')
  .insert({ user_id: selectedUser.id, role: 'acreditador' });
```

Por:
```typescript
const { error: roleError } = await supabase
  .from('user_roles')
  .upsert(
    { user_id: selectedUser.id, role: 'acreditador' },
    { onConflict: 'user_id,role' }
  );
```

Esto evita el error cuando el rol ya existe previamente asignado al usuario.

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/app/Users.tsx` | Cambiar `insert` por `upsert` con `onConflict` en la funcion `handleApprove` |
