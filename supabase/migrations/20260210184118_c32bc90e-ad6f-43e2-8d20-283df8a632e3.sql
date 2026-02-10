
-- 1. Create invoice_status enum
CREATE TYPE public.invoice_status AS ENUM ('pendiente', 'pagado', 'rechazado');

-- 2. Create invoices table
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number serial NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  event_id uuid NOT NULL REFERENCES public.events(id),
  status public.invoice_status NOT NULL DEFAULT 'pendiente',
  amount integer NOT NULL,
  emission_date date NOT NULL DEFAULT CURRENT_DATE,
  file_url text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins full access on invoices"
  ON public.invoices FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own file_url"
  ON public.invoices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create invoices storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- 7. Storage RLS policies
CREATE POLICY "Public read access on invoices bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices');

CREATE POLICY "Admins can upload to invoices bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update invoices bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete from invoices bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND public.is_admin(auth.uid()));

CREATE POLICY "Users can upload own invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own invoices"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
