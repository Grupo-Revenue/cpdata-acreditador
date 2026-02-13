
-- Enum: attendance_status
CREATE TYPE public.attendance_status AS ENUM ('presente', 'atrasado', 'ausente');

-- Enum: expense_approval_status
CREATE TYPE public.expense_approval_status AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Table: attendance_records
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'presente',
  ranking_points integer NOT NULL DEFAULT 7,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time time WITHOUT TIME ZONE,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS for attendance_records
CREATE POLICY "Admins full access attendance_records" ON public.attendance_records FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all attendance_records" ON public.attendance_records FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own attendance" ON public.attendance_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Supervisors can insert attendance" ON public.attendance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_accreditors ea WHERE ea.event_id = attendance_records.event_id AND ea.user_id = auth.uid()
    )
  );
CREATE POLICY "Supervisors can update attendance" ON public.attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_accreditors ea WHERE ea.event_id = attendance_records.event_id AND ea.user_id = auth.uid()
    )
  );

-- Table: event_expenses
CREATE TABLE public.event_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount integer NOT NULL,
  receipt_url text,
  approval_status public.expense_approval_status NOT NULL DEFAULT 'pendiente',
  approved_by uuid,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;

-- RLS for event_expenses
CREATE POLICY "Admins full access event_expenses" ON public.event_expenses FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all event_expenses" ON public.event_expenses FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can view own expenses" ON public.event_expenses FOR SELECT USING (user_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Supervisors can insert expenses" ON public.event_expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_accreditors ea WHERE ea.event_id = event_expenses.event_id AND ea.user_id = auth.uid()
    )
  );
CREATE POLICY "Supervisors can update expenses" ON public.event_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_accreditors ea WHERE ea.event_id = event_expenses.event_id AND ea.user_id = auth.uid()
    )
  );
CREATE POLICY "Supervisors can delete expenses" ON public.event_expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM event_accreditors ea WHERE ea.event_id = event_expenses.event_id AND ea.user_id = auth.uid()
    )
  );

-- Add columns to events
ALTER TABLE public.events ADD COLUMN closed_at timestamptz;
ALTER TABLE public.events ADD COLUMN closed_by uuid;
ALTER TABLE public.events ADD COLUMN reimbursement_closed_at timestamptz;
ALTER TABLE public.events ADD COLUMN reimbursement_closed_by uuid;

-- Trigger for updated_at on attendance_records
CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on event_expenses
CREATE TRIGGER update_event_expenses_updated_at
  BEFORE UPDATE ON public.event_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', true);

CREATE POLICY "Anyone can view expense receipts" ON storage.objects FOR SELECT USING (bucket_id = 'expense-receipts');
CREATE POLICY "Authenticated users can upload expense receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'expense-receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own expense receipts" ON storage.objects FOR UPDATE USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own expense receipts" ON storage.objects FOR DELETE USING (bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
