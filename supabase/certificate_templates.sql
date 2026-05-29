-- Certificate templates table
-- Stores the uploaded certificate background images (as base64) per event per type
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES public.events(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,  -- 'Winner', '1st Runner-up', '2nd Runner-up', 'Participation'
  template_data TEXT NOT NULL,  -- base64 data URL
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, template_type)
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view templates
CREATE POLICY "certificate_templates_select" ON public.certificate_templates
  FOR SELECT USING (true);

-- Only organizers/admins can insert/update
CREATE POLICY "certificate_templates_insert" ON public.certificate_templates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "certificate_templates_update" ON public.certificate_templates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "certificate_templates_delete" ON public.certificate_templates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );
