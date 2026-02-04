

## Plan: Cambiar "Preaprobado" por "Rechazado"

### Objetivo
Reemplazar el estado `preapproved` por `rejected` en el sistema. Un usuario rechazado:
- No podrá acceder al sistema
- No podrá registrarse nuevamente con el mismo email (Supabase bloquea emails duplicados en `auth.users`)
- Solo un superadmin podrá cambiarlo a `approved` para desbloquear el acceso

---

### Cambios Necesarios

#### 1. Migración de Base de Datos (nuevo archivo)
Actualizar el enum `approval_status` para reemplazar `preapproved` por `rejected`:

```sql
-- Actualizar registros existentes de preapproved a pending
UPDATE public.profiles 
SET approval_status = 'pending' 
WHERE approval_status = 'preapproved';

-- Recrear el enum con el nuevo valor
ALTER TYPE approval_status RENAME TO approval_status_old;

CREATE TYPE approval_status AS ENUM ('pending', 'rejected', 'approved');

ALTER TABLE public.profiles 
  ALTER COLUMN approval_status TYPE approval_status 
  USING approval_status::text::approval_status;

DROP TYPE approval_status_old;
```

#### 2. Actualizar Tipos TypeScript
**Archivo**: `src/integrations/supabase/types.ts`

Cambiar el enum:
```typescript
approval_status: "pending" | "rejected" | "approved"
```

Y en Constants:
```typescript
approval_status: ["pending", "rejected", "approved"]
```

#### 3. Actualizar AuthContext
**Archivo**: `src/contexts/AuthContext.tsx`

Cambiar el tipo:
```typescript
export type ApprovalStatus = 'pending' | 'rejected' | 'approved';
```

#### 4. Actualizar Diálogo de Edición de Usuario
**Archivo**: `src/components/users/UserEditDialog.tsx`

Cambiar las opciones del select:
```tsx
<SelectItem value="pending">Pendiente</SelectItem>
<SelectItem value="rejected">Rechazado</SelectItem>
<SelectItem value="approved">Aprobado</SelectItem>
```

#### 5. Actualizar StatusBadge
**Archivo**: `src/components/ui/StatusBadge.tsx`

Eliminar `preapproved` del tipo (ya tiene `rejected` configurado correctamente con estilo rojo/destructivo).

#### 6. Actualizar Página Pending (opcional pero recomendado)
**Archivo**: `src/pages/auth/Pending.tsx`

Agregar lógica para mostrar mensaje diferente si el usuario fue rechazado:
```tsx
// Si el perfil tiene estado rejected, mostrar mensaje de rechazo
if (profile?.approval_status === 'rejected') {
  return (
    <AuthLayout title="Cuenta rechazada" subtitle="">
      {/* Mostrar mensaje indicando que la cuenta fue rechazada */}
    </AuthLayout>
  );
}
```

---

### Flujo de Estados Final

| Estado | Descripción | ¿Puede acceder? |
|--------|-------------|-----------------|
| `pending` | Registro nuevo, esperando revisión | No |
| `rejected` | Rechazado por superadmin, bloqueado | No |
| `approved` | Aprobado, acceso permitido | Sí |

---

### Comportamiento de Bloqueo

El bloqueo funciona automáticamente porque:
1. Al registrarse, se crea un usuario en `auth.users` con el email
2. Si alguien intenta registrarse con el mismo email, Supabase devuelve error "User already registered"
3. El único que puede cambiar `rejected` → `approved` es un superadmin desde la gestión de usuarios

---

### Archivos a Modificar

| Archivo | Tipo de cambio |
|---------|----------------|
| Nueva migración SQL | Cambio de enum en BD |
| `src/integrations/supabase/types.ts` | Actualizar tipo enum |
| `src/contexts/AuthContext.tsx` | Actualizar tipo TypeScript |
| `src/components/users/UserEditDialog.tsx` | Cambiar opciones del select |
| `src/components/ui/StatusBadge.tsx` | Limpiar tipo (remover preapproved) |
| `src/pages/auth/Pending.tsx` | Agregar UI para estado rechazado |

