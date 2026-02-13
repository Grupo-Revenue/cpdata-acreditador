
-- Allow supervisors to delete comments they created (needed for comment updates)
CREATE POLICY "Supervisors can delete own attendance_comments"
ON public.attendance_comments FOR DELETE
USING (created_by = auth.uid());
