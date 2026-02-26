CREATE TABLE public.user_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access user_comments"
ON public.user_comments FOR ALL TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view user_comments"
ON public.user_comments FOR SELECT TO authenticated
USING (is_admin(auth.uid()));