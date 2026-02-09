
ALTER TABLE public.support_tickets
  ADD COLUMN updated_by uuid,
  ADD COLUMN creator_nombre text NOT NULL DEFAULT '',
  ADD COLUMN creator_apellido text NOT NULL DEFAULT '',
  ADD COLUMN creator_email text NOT NULL DEFAULT '',
  ADD COLUMN creator_telefono text,
  ADD COLUMN creator_rut text NOT NULL DEFAULT '',
  ADD COLUMN creator_role text NOT NULL DEFAULT '',
  ADD COLUMN editor_nombre text,
  ADD COLUMN editor_apellido text,
  ADD COLUMN editor_email text,
  ADD COLUMN editor_telefono text,
  ADD COLUMN editor_rut text,
  ADD COLUMN editor_role text;
