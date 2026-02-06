-- Create event_status enum
CREATE TYPE event_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create accreditor_assignment_status enum
CREATE TYPE accreditor_assignment_status AS ENUM ('assigned', 'completed');

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  status event_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_accreditors table (junction table for events and accreditors)
CREATE TABLE public.event_accreditors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status accreditor_assignment_status NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_accreditors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Accreditors can view assigned events"
ON public.events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_accreditors ea
    WHERE ea.event_id = events.id AND ea.user_id = auth.uid()
  )
);

-- RLS Policies for event_accreditors table
CREATE POLICY "Admins can view all event_accreditors"
ON public.event_accreditors FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage event_accreditors"
ON public.event_accreditors FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own assignments"
ON public.event_accreditors FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for updated_at on events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_event_accreditors_user_id ON public.event_accreditors(user_id);
CREATE INDEX idx_event_accreditors_status ON public.event_accreditors(status);