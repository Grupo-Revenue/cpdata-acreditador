
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
