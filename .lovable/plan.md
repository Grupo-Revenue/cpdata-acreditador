

## Problema

La query del ranking consulta 3 tablas (`user_roles`, `profiles`, `attendance_records`) que tienen RLS restrictivo. Un supervisor o acreditador solo puede ver sus propios datos en `profiles` y `attendance_records`, y solo sus propios roles en `user_roles`. Por lo tanto, el ranking aparece vacio o incompleto para roles no-admin.

## Solucion

Crear una funcion de base de datos `SECURITY DEFINER` que retorne el ranking completo, accesible por cualquier usuario autenticado. Luego actualizar `RankingTable.tsx` para usar `.rpc()` en lugar de las 3 queries separadas.

### Paso 1: Migracion SQL

```sql
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
```

### Paso 2: Actualizar `RankingTable.tsx`

Reemplazar las 3 queries por una sola llamada `.rpc('get_accreditor_ranking', { _limit: limit })`. El resultado ya viene ordenado y limitado.

### Archivos a modificar
1. **Migracion SQL** — crear funcion `get_accreditor_ranking`
2. **`src/components/dashboard/RankingTable.tsx`** — usar `.rpc()` y simplificar la query

