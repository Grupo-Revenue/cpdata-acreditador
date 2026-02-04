

## Plan: Corregir Trigger de Creación de Perfiles

### Problema Identificado

El trigger `on_auth_user_created` que debería crear automáticamente un perfil cuando un usuario se registra **NO EXISTE** en la base de datos.

**Razón**: La migración intentó crear un trigger en `auth.users`, pero Supabase **no permite** crear triggers en schemas reservados (auth, storage, etc.) a través de migraciones regulares. La migración falló silenciosamente.

### Estado Actual

| Componente | Estado |
|------------|--------|
| Función `handle_new_user()` | Existe |
| Trigger `on_auth_user_created` | **NO EXISTE** |
| Usuario `test@test.cl` en auth.users | Existe |
| Perfil de `test@test.cl` | **NO EXISTE** |

---

### Solución

#### Paso 1: Crear el trigger manualmente en Supabase Dashboard

Debes ir al **SQL Editor** de Supabase y ejecutar este SQL:

```sql
-- Crear el trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Enlace directo**: https://supabase.com/dashboard/project/wodzysrgdsforiuliejo/sql/new

---

#### Paso 2: Crear perfil para el usuario existente

Una vez que el trigger esté activo, los nuevos usuarios funcionarán. Para el usuario `test@test.cl` que ya existe, necesitamos crear su perfil manualmente.

Ejecutar en el SQL Editor:

```sql
-- Primero, verificar el ID del usuario en auth.users
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'test@test.cl';

-- Luego, insertar el perfil con los datos del metadata
INSERT INTO public.profiles (id, email, rut, nombre, apellido, telefono, referencia_contacto)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'rut', ''),
  COALESCE(raw_user_meta_data->>'nombre', ''),
  COALESCE(raw_user_meta_data->>'apellido', ''),
  raw_user_meta_data->>'telefono',
  raw_user_meta_data->>'referencia_contacto'
FROM auth.users 
WHERE email = 'test@test.cl'
ON CONFLICT (id) DO NOTHING;
```

---

### Flujo de Solución

```text
1. Ir a Supabase SQL Editor
         │
         ▼
2. Crear trigger en auth.users
         │
         ▼
3. Crear perfil para test@test.cl
         │
         ▼
4. Verificar en /app/users que aparece
         │
         ▼
5. Probar registro de nuevo usuario
```

---

### Cambios en Código

**No se requieren cambios en el código**. El problema es puramente de base de datos.

### Limpieza Opcional

Eliminar la migración que falló (no es crítico pero mantiene orden):
- `supabase/migrations/20260204170920_791d01c8-7b4d-4e93-a1f3-cfadd5eac004.sql`

---

### Acciones Requeridas del Usuario

1. **Ejecutar SQL en el Dashboard** para crear el trigger (no puede hacerse desde Lovable)
2. **Crear perfil manualmente** para el usuario test@test.cl

