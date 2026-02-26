

## Diagnóstico: Recursión infinita en RLS de `event_accreditors`

La política recién creada "Event members can view co-assigned accreditors" consulta la misma tabla `event_accreditors` dentro de su `USING`, causando recursión infinita. Esto rompe **todas** las consultas que tocan `event_accreditors`, incluyendo eventos, boletas y postulantes.

### Solución: Migración SQL

1. **Eliminar** la política recursiva.
2. **Crear una función `SECURITY DEFINER`** que verifique si un usuario está asignado a un evento sin pasar por RLS.
3. **Crear la política corregida** usando esa función.

```sql
-- 1. Drop recursive policy
DROP POLICY "Event members can view co-assigned accreditors" ON event_accreditors;

-- 2. Security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_event_member(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_accreditors
    WHERE user_id = _user_id AND event_id = _event_id
  )
$$;

-- 3. Recreate policy using the function
CREATE POLICY "Event members can view co-assigned accreditors"
  ON event_accreditors FOR SELECT
  USING (public.is_event_member(auth.uid(), event_id));
```

No se requieren cambios en el frontend.

