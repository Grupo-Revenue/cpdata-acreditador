
-- Make user_id nullable to allow event-level expenses
ALTER TABLE public.event_expenses ALTER COLUMN user_id DROP NOT NULL;

-- Update the "Users can view own expenses" policy to handle null user_id
DROP POLICY IF EXISTS "Users can view own expenses" ON public.event_expenses;
CREATE POLICY "Users can view own expenses"
ON public.event_expenses
FOR SELECT
USING ((user_id = auth.uid()) OR (created_by = auth.uid()));

-- Supervisors can also view expenses for their assigned events
DROP POLICY IF EXISTS "Supervisors can view event expenses" ON public.event_expenses;
CREATE POLICY "Supervisors can view event expenses"
ON public.event_expenses
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM event_accreditors ea
  WHERE ea.event_id = event_expenses.event_id AND ea.user_id = auth.uid()
));
