-- ═══════════════════════════════════════════════════════════════════
-- Club Registrations — Audition Workflow
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.club_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id INT REFERENCES public.clubs(id) ON DELETE CASCADE,
  club_name TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  reg_no TEXT,
  course TEXT,
  year TEXT,
  about TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'audition_selected', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.club_registrations ENABLE ROW LEVEL SECURITY;

-- Everyone can read club registrations (organizers need to see all)
CREATE POLICY "club_registrations_select" ON public.club_registrations
  FOR SELECT USING (true);

-- Anyone can insert (students submit applications)
CREATE POLICY "club_registrations_insert" ON public.club_registrations
  FOR INSERT WITH CHECK (true);

-- Organizers and admins can update status
CREATE POLICY "club_registrations_update" ON public.club_registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

-- Organizers and admins can delete
CREATE POLICY "club_registrations_delete" ON public.club_registrations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );
