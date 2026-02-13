
CREATE TABLE public.digital_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contract_text text NOT NULL,
  signer_name text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signatures"
  ON public.digital_signatures FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own signature"
  ON public.digital_signatures FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins full access signatures"
  ON public.digital_signatures FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all signatures"
  ON public.digital_signatures FOR SELECT
  USING (is_admin(auth.uid()));
