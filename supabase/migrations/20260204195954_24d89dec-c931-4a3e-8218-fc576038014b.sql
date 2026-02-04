-- Actualizar registros existentes de preapproved a pending
UPDATE public.profiles 
SET approval_status = 'pending' 
WHERE approval_status = 'preapproved';

-- Eliminar el default antes del cambio de tipo
ALTER TABLE public.profiles ALTER COLUMN approval_status DROP DEFAULT;

-- Recrear el enum con el nuevo valor
ALTER TYPE approval_status RENAME TO approval_status_old;

CREATE TYPE approval_status AS ENUM ('pending', 'rejected', 'approved');

ALTER TABLE public.profiles 
  ALTER COLUMN approval_status TYPE approval_status 
  USING approval_status::text::approval_status;

-- Restaurar el default con el nuevo tipo
ALTER TABLE public.profiles ALTER COLUMN approval_status SET DEFAULT 'pending'::approval_status;

DROP TYPE approval_status_old;