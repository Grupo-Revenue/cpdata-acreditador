-- Parte 1: Crear perfiles faltantes para usuarios existentes en auth.users
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

-- Parte 2: Mejorar el trigger para manejar conflictos
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
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;