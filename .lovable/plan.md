

## Plan: Arreglar Error RLS en Registro de Usuario

### Problema

El registro falla con `new row violates row-level security policy for table "profiles"` porque:

1. Cuando se llama `supabase.auth.signUp()`, el usuario se crea en `auth.users`
2. La sesión NO está activa inmediatamente (especialmente con confirmación de email pendiente)
3. El código intenta insertar en `profiles` pero `auth.uid()` retorna `NULL`
4. La política RLS `WITH CHECK (id = auth.uid())` falla porque `NULL ≠ user_id`

### Solución: Trigger Automático en Base de Datos

Crear un trigger que automáticamente genere el perfil cuando un usuario se registra. Este trigger:
- Se ejecuta con `SECURITY DEFINER` (privilegios elevados)
- No está sujeto a políticas RLS
- Garantiza que siempre se cree el perfil

---

### Paso 1: Migración SQL - Crear Función y Trigger

```sql
-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, rut, nombre, apellido, telefono, referencia_contacto)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rut', ''),
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.raw_user_meta_data->>'telefono',
    NEW.raw_user_meta_data->>'referencia_contacto'
  );
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta cuando se crea un usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Paso 2: Modificar el Código de Registro

**Archivo:** `src/contexts/AuthContext.tsx`

Pasar los datos adicionales como `metadata` en el signup, y **eliminar** la inserción manual del perfil:

**Antes:**
```typescript
const signUp = async (data: SignUpData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (authData.user) {
    // Inserción manual que FALLA por RLS
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ ... });
  }
};
```

**Después:**
```typescript
const signUp = async (data: SignUpData) => {
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        // Estos datos van al trigger via raw_user_meta_data
        rut: data.rut,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono || null,
        referencia_contacto: data.referencia_contacto || null,
      },
    },
  });

  if (error) throw error;
  // El perfil se crea automáticamente por el trigger
  return { error: null };
};
```

---

### Flujo Resultante

```text
Usuario completa formulario
         │
         ▼
supabase.auth.signUp() con metadata
         │
         ▼
  auth.users recibe nuevo registro
         │
         ▼
  TRIGGER on_auth_user_created
         │
         ▼
  handle_new_user() inserta en profiles
  (con SECURITY DEFINER, sin RLS)
         │
         ▼
  Perfil creado exitosamente
```

---

### Beneficios

| Aspecto | Antes | Después |
|---------|-------|---------|
| RLS | Bloquea inserción | No aplica (SECURITY DEFINER) |
| Timing | Dependiente de sesión | Automático e inmediato |
| Consistencia | Puede fallar dejando usuario sin perfil | Siempre crea el perfil |
| Código | Lógica duplicada en cliente | Centralizado en DB |

---

### Archivos a Modificar

1. **Nueva migración SQL** - Crear función `handle_new_user()` y trigger
2. **`src/contexts/AuthContext.tsx`** - Simplificar función `signUp()`

