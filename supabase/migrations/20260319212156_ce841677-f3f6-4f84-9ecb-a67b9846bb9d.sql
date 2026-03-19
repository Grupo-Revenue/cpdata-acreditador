ALTER TABLE public.event_accreditors ADD COLUMN assigned_role text NOT NULL DEFAULT 'acreditador';

-- Backfill existing rows: set supervisor where user has supervisor role
UPDATE public.event_accreditors ea
SET assigned_role = 'supervisor'
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = ea.user_id AND ur.role = 'supervisor'
);