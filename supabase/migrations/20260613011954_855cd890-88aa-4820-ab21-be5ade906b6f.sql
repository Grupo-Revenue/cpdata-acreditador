CREATE OR REPLACE FUNCTION public.get_accreditor_ranking(_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nombre text, apellido text, total_points bigint, events_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.nombre,
    p.apellido,
    COALESCE((SELECT SUM(er.points) FROM evaluation_records er WHERE er.user_id = p.id), 0)::bigint AS total_points,
    (SELECT COUNT(*) FROM attendance_records ar WHERE ar.user_id = p.id)::bigint AS events_count
  FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE ur.role = 'acreditador'
  GROUP BY p.id, p.nombre, p.apellido
  ORDER BY total_points DESC
  LIMIT _limit;
$function$;