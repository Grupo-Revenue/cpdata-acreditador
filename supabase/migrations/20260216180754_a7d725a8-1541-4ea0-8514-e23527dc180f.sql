
-- Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN fecha_nacimiento date,
  ADD COLUMN semestre text,
  ADD COLUMN disponibilidad_horaria text,
  ADD COLUMN comuna text,
  ADD COLUMN instagram text,
  ADD COLUMN facebook text,
  ADD COLUMN talla_polera text,
  ADD COLUMN contacto_emergencia_nombre text,
  ADD COLUMN contacto_emergencia_email text,
  ADD COLUMN contacto_emergencia_telefono text;

-- Update the handle_new_user function to capture new metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, rut, nombre, apellido, telefono, referencia_contacto,
    universidad, carrera, idioma, altura,
    fecha_nacimiento, semestre, disponibilidad_horaria, comuna,
    instagram, facebook, talla_polera,
    contacto_emergencia_nombre, contacto_emergencia_email, contacto_emergencia_telefono
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rut', ''),
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.raw_user_meta_data->>'telefono',
    NEW.raw_user_meta_data->>'referencia_contacto',
    NEW.raw_user_meta_data->>'universidad',
    NEW.raw_user_meta_data->>'carrera',
    NEW.raw_user_meta_data->>'idioma',
    NEW.raw_user_meta_data->>'altura',
    (NEW.raw_user_meta_data->>'fecha_nacimiento')::date,
    NEW.raw_user_meta_data->>'semestre',
    NEW.raw_user_meta_data->>'disponibilidad_horaria',
    NEW.raw_user_meta_data->>'comuna',
    NEW.raw_user_meta_data->>'instagram',
    NEW.raw_user_meta_data->>'facebook',
    NEW.raw_user_meta_data->>'talla_polera',
    NEW.raw_user_meta_data->>'contacto_emergencia_nombre',
    NEW.raw_user_meta_data->>'contacto_emergencia_email',
    NEW.raw_user_meta_data->>'contacto_emergencia_telefono'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;
