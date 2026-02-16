
-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage all permissions
CREATE POLICY "Superadmins can manage permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- All authenticated users can read permissions
CREATE POLICY "Authenticated users can read permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for all 3 configurable roles
INSERT INTO public.role_permissions (role, permission_key, enabled) VALUES
  -- administracion
  ('administracion', 'nav.dashboard', true),
  ('administracion', 'nav.users', true),
  ('administracion', 'nav.events', true),
  ('administracion', 'nav.invoices', true),
  ('administracion', 'nav.reimbursements', true),
  ('administracion', 'nav.support', true),
  ('administracion', 'nav.ranking', true),
  ('administracion', 'action.invoices.edit', true),
  ('administracion', 'action.invoices.whatsapp', true),
  ('administracion', 'action.invoices.upload', true),
  ('administracion', 'action.events.edit', true),
  ('administracion', 'action.events.team', true),
  ('administracion', 'action.events.contract', true),
  ('administracion', 'action.support.create', true),
  ('administracion', 'action.support.edit', true),
  -- supervisor
  ('supervisor', 'nav.dashboard', true),
  ('supervisor', 'nav.users', true),
  ('supervisor', 'nav.events', true),
  ('supervisor', 'nav.invoices', true),
  ('supervisor', 'nav.reimbursements', true),
  ('supervisor', 'nav.support', true),
  ('supervisor', 'nav.ranking', true),
  ('supervisor', 'action.invoices.edit', true),
  ('supervisor', 'action.invoices.whatsapp', true),
  ('supervisor', 'action.invoices.upload', true),
  ('supervisor', 'action.events.edit', true),
  ('supervisor', 'action.events.team', true),
  ('supervisor', 'action.events.contract', true),
  ('supervisor', 'action.support.create', true),
  ('supervisor', 'action.support.edit', true),
  -- acreditador
  ('acreditador', 'nav.dashboard', true),
  ('acreditador', 'nav.users', true),
  ('acreditador', 'nav.events', true),
  ('acreditador', 'nav.invoices', true),
  ('acreditador', 'nav.reimbursements', true),
  ('acreditador', 'nav.support', true),
  ('acreditador', 'nav.ranking', true),
  ('acreditador', 'action.invoices.edit', true),
  ('acreditador', 'action.invoices.whatsapp', true),
  ('acreditador', 'action.invoices.upload', true),
  ('acreditador', 'action.events.edit', true),
  ('acreditador', 'action.events.team', true),
  ('acreditador', 'action.events.contract', true),
  ('acreditador', 'action.support.create', true),
  ('acreditador', 'action.support.edit', true);
