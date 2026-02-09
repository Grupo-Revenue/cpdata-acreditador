
-- Create enums
CREATE TYPE public.ticket_status AS ENUM ('pendiente', 'resuelto', 'inactivo');
CREATE TYPE public.ticket_priority AS ENUM ('alta', 'media', 'baja');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number serial NOT NULL,
  motivo text NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'pendiente',
  priority public.ticket_priority NOT NULL DEFAULT 'media',
  observaciones text,
  evidence_url text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets
FOR SELECT
USING (created_by = auth.uid());

-- RLS: Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
USING (is_admin(auth.uid()));

-- RLS: Authenticated users can create tickets
CREATE POLICY "Authenticated users can create tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- RLS: Only admins can update tickets
CREATE POLICY "Admins can update tickets"
ON public.support_tickets
FOR UPDATE
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-evidence', 'ticket-evidence', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ticket-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view evidence"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ticket-evidence');

CREATE POLICY "Admins can delete evidence"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ticket-evidence' AND is_admin(auth.uid()));
