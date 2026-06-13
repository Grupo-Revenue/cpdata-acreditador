
-- evaluation_items
CREATE TABLE public.evaluation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_items TO authenticated;
GRANT ALL ON public.evaluation_items TO service_role;
ALTER TABLE public.evaluation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read evaluation_items" ON public.evaluation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmin manage evaluation_items" ON public.evaluation_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE TRIGGER update_evaluation_items_updated_at BEFORE UPDATE ON public.evaluation_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- evaluation_options
CREATE TABLE public.evaluation_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.evaluation_items(id) ON DELETE CASCADE,
  label text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_options TO authenticated;
GRANT ALL ON public.evaluation_options TO service_role;
ALTER TABLE public.evaluation_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read evaluation_options" ON public.evaluation_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmin manage evaluation_options" ON public.evaluation_options FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE TRIGGER update_evaluation_options_updated_at BEFORE UPDATE ON public.evaluation_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- evaluation_records
CREATE TABLE public.evaluation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.evaluation_items(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.evaluation_options(id) ON DELETE RESTRICT,
  points integer NOT NULL DEFAULT 0,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_records TO authenticated;
GRANT ALL ON public.evaluation_records TO service_role;
ALTER TABLE public.evaluation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members and admins read evaluation_records" ON public.evaluation_records FOR SELECT TO authenticated
  USING (public.is_event_member(auth.uid(), event_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Members and admins insert evaluation_records" ON public.evaluation_records FOR INSERT TO authenticated
  WITH CHECK (public.is_event_member(auth.uid(), event_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Members and admins update evaluation_records" ON public.evaluation_records FOR UPDATE TO authenticated
  USING (public.is_event_member(auth.uid(), event_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_event_member(auth.uid(), event_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins delete evaluation_records" ON public.evaluation_records FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE TRIGGER update_evaluation_records_updated_at BEFORE UPDATE ON public.evaluation_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default items
WITH desempeno AS (
  INSERT INTO public.evaluation_items (name, sort_order) VALUES ('Desempeño', 1) RETURNING id
), presentacion AS (
  INSERT INTO public.evaluation_items (name, sort_order) VALUES ('Presentación personal', 2) RETURNING id
)
INSERT INTO public.evaluation_options (item_id, label, points, sort_order)
SELECT id, 'Excelente', 7, 1 FROM desempeno UNION ALL
SELECT id, 'Bueno', 5, 2 FROM desempeno UNION ALL
SELECT id, 'Malo', 0, 3 FROM desempeno UNION ALL
SELECT id, 'Excelente', 7, 1 FROM presentacion UNION ALL
SELECT id, 'Bueno', 5, 2 FROM presentacion UNION ALL
SELECT id, 'Regular', 3, 3 FROM presentacion;

-- Update ranking RPC to include evaluation points
CREATE OR REPLACE FUNCTION public.get_accreditor_ranking(_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, nombre text, apellido text, total_points bigint, events_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id,
    p.nombre,
    p.apellido,
    COALESCE((SELECT SUM(ar.ranking_points) FROM attendance_records ar WHERE ar.user_id = p.id), 0)
      + COALESCE((SELECT SUM(er.points) FROM evaluation_records er WHERE er.user_id = p.id), 0) AS total_points,
    (SELECT COUNT(*) FROM attendance_records ar WHERE ar.user_id = p.id) AS events_count
  FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE ur.role = 'acreditador'
  GROUP BY p.id, p.nombre, p.apellido
  ORDER BY total_points DESC
  LIMIT _limit;
$$;
