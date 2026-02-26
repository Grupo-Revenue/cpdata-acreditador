CREATE OR REPLACE FUNCTION public.get_accreditor_ranking(_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  nombre text,
  apellido text,
  total_points bigint,
  events_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.nombre,
    p.apellido,
    COALESCE(SUM(ar.ranking_points), 0) AS total_points,
    COUNT(ar.id) AS events_count
  FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  LEFT JOIN attendance_records ar ON ar.user_id = ur.user_id
  WHERE ur.role = 'acreditador'
  GROUP BY p.id, p.nombre, p.apellido
  ORDER BY total_points DESC
  LIMIT _limit;
$$;