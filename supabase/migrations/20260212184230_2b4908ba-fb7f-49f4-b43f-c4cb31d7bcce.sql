CREATE TYPE public.application_status AS ENUM ('pendiente', 'aceptado', 'rechazado');
CREATE TYPE public.contract_status AS ENUM ('pendiente', 'firmado', 'rechazado');

ALTER TABLE public.event_accreditors
  ADD COLUMN application_status application_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN contract_status contract_status NOT NULL DEFAULT 'pendiente';