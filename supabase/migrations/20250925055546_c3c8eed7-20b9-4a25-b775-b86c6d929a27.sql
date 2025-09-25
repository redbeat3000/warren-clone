-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create meetings table for meeting management
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  agenda TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.users(id),
  expected_attendees INTEGER DEFAULT 0,
  actual_attendees INTEGER DEFAULT 0,
  minutes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings
CREATE POLICY "Admin full access to meetings" ON public.meetings
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Members can view meetings" ON public.meetings
FOR SELECT USING (true);

-- Create documents table for document management  
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('registration', 'minutes', 'policies', 'financial', 'legal', 'other')),
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Admin full access to documents" ON public.documents
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Members can view documents" ON public.documents
FOR SELECT USING (true);

-- Create attendance table for meeting attendance tracking
CREATE TABLE IF NOT EXISTS public.meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'attended', 'absent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, member_id)
);

-- Enable RLS on meeting_attendance table
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting attendance
CREATE POLICY "Admin full access to attendance" ON public.meeting_attendance
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Members can view own attendance" ON public.meeting_attendance
FOR SELECT USING (
  member_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()) OR is_admin()
);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_attendance_updated_at
    BEFORE UPDATE ON public.meeting_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();