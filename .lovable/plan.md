
## Plan: Arreglar Usuarios Pendientes que No Aparecen

### Diagnóstico

Después de investigar, identifiqué **dos problemas**:

1. **Problema principal**: El usuario `test@test.cl` existe en `auth.users` pero **NO tiene perfil** en la tabla `profiles`. El trigger `handle_new_user` no creó el perfil.

2. **Por qué no se creó el perfil**: Aunque el trigger existe, probablemente hubo un problema con la ejecución. Los registros previos al trigger tampoco tendrían perfil.

### Solución en 2 Partes

---

### Parte 1: Crear perfiles faltantes para usuarios existentes

Ejecutar una migración SQL que cree perfiles para cualquier usuario en `auth.users` que no tenga perfil:

```sql
-- Crear perfiles faltantes para usuarios que ya existen en auth.users
INSERT INTO public.profiles (id, email, rut, nombre, apellido, telefono, referencia_contacto)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'rut', ''),
    COALESCE(au.raw_user_meta_data->>'nombre', ''),
    COALESCE(au.raw_user_meta_data->>'apellido', ''),
    au.raw_user_meta_data->>'telefono',
    au.raw_user_meta_data->>'referencia_contacto'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

Esta migración:
- Busca usuarios en `auth.users` sin perfil en `profiles`
- Crea el perfil usando los metadatos del registro
- El perfil tendrá `approval_status = 'pending'` (valor por defecto)

---

### Parte 2: Hacer el trigger más robusto (opcional pero recomendado)

Modificar el trigger para manejar conflictos y evitar errores silenciosos:

```sql
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
  )
  ON CONFLICT (id) DO NOTHING;  -- Evitar errores si el perfil ya existe
  
  RETURN NEW;
END;
$$;
```

---

### Resultado Esperado

| Antes | Después |
|-------|---------|
| 1 perfil (solo admin) | N perfiles (admin + usuarios pendientes) |
| Usuarios registrados sin perfil | Todos los usuarios tienen perfil |
| Lista vacía en gestión de usuarios | Usuarios pendientes visibles |

---

### Archivos/Cambios

1. **Nueva migración SQL** - Crear perfiles faltantes y mejorar el trigger
