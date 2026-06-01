ALTER TYPE expense_approval_status ADD VALUE IF NOT EXISTS 'pagado';
ALTER TABLE public.event_expenses ADD COLUMN IF NOT EXISTS payment_date date;
ALTER TABLE public.event_expenses ADD COLUMN IF NOT EXISTS paid_by uuid;