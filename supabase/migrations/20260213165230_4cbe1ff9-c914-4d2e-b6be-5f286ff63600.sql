
-- Create attendance_comments table
CREATE TABLE public.attendance_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_attendance_comments_user_id ON public.attendance_comments(user_id);
CREATE INDEX idx_attendance_comments_attendance_record_id ON public.attendance_comments(attendance_record_id);

-- Enable RLS
ALTER TABLE public.attendance_comments ENABLE ROW LEVEL SECURITY;

-- Admins can view all comments
CREATE POLICY "Admins can view all attendance_comments"
ON public.attendance_comments FOR SELECT
USING (is_admin(auth.uid()));

-- Admins full access
CREATE POLICY "Admins full access attendance_comments"
ON public.attendance_comments FOR ALL
USING (is_admin(auth.uid()));

-- Supervisors can insert comments for events they are assigned to
CREATE POLICY "Supervisors can insert attendance_comments"
ON public.attendance_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.attendance_records ar
    JOIN public.event_accreditors ea ON ea.event_id = ar.event_id AND ea.user_id = auth.uid()
    WHERE ar.id = attendance_record_id
  )
);

-- Supervisors can view comments they created
CREATE POLICY "Supervisors can view own attendance_comments"
ON public.attendance_comments FOR SELECT
USING (created_by = auth.uid());
