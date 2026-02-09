
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  language text NOT NULL DEFAULT 'es',
  category text NOT NULL DEFAULT 'MARKETING',
  header_type text NOT NULL DEFAULT 'none',
  header_text text,
  header_image_url text,
  body_text text NOT NULL,
  footer_text text,
  buttons jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  meta_template_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view whatsapp_templates"
ON public.whatsapp_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Superadmins can manage whatsapp_templates"
ON public.whatsapp_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
