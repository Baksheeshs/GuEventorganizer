-- ═══════════════════════════════════════════════════════════════════
-- GuEventorganizer — Supabase Database Schema
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────
-- 1. PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'organizer', 'admin')),
  department TEXT,
  year TEXT,
  avatar TEXT,
  enrollment_id TEXT,
  club TEXT,
  designation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department, year, enrollment_id, club, designation, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'year', ''),
    COALESCE(NEW.raw_user_meta_data->>'enrollment_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'club', ''),
    COALESCE(NEW.raw_user_meta_data->>'designation', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────
-- 2. EVENTS
-- ─────────────────────────────────────────────────
CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  venue TEXT,
  date DATE,
  end_date DATE,
  time TEXT,
  organizer TEXT,
  department TEXT,
  registrations INT DEFAULT 0,
  max_capacity INT DEFAULT 100,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT false,
  poster TEXT,
  gallery TEXT[],
  tags TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────
-- 3. EVENT_DETAILS (extended info per event)
-- ─────────────────────────────────────────────────
CREATE TABLE public.event_details (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  long_description TEXT,
  eligibility TEXT,
  schedule JSONB,
  prizes JSONB,
  rules TEXT[],
  coordinator_name TEXT,
  coordinator_phone TEXT,
  coordinator_email TEXT,
  whatsapp_group TEXT
);


-- ─────────────────────────────────────────────────
-- 4. CLUBS
-- ─────────────────────────────────────────────────
CREATE TABLE public.clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  members INT DEFAULT 0,
  logo TEXT,
  abbr TEXT,
  color TEXT,
  events_count INT DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────
-- 5. VENUES
-- ─────────────────────────────────────────────────
CREATE TABLE public.venues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INT,
  type TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked')),
  image TEXT,
  amenities TEXT[],
  floor TEXT,
  building TEXT,
  booked_by TEXT,
  booked_date DATE
);


-- ─────────────────────────────────────────────────
-- 6. REGISTRATIONS
-- ─────────────────────────────────────────────────
CREATE TABLE public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id INT REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  admission_no TEXT,
  year TEXT,
  course TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);


-- ─────────────────────────────────────────────────
-- 7. ATTENDANCE_CODES
-- ─────────────────────────────────────────────────
CREATE TABLE public.attendance_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id INT REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  admission_no TEXT,
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id),
  UNIQUE(event_id, code)
);


-- ─────────────────────────────────────────────────
-- 8. CERTIFICATES
-- ─────────────────────────────────────────────────
CREATE TABLE public.certificates (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES public.events(id),
  user_id UUID REFERENCES public.profiles(id),
  student_name TEXT,
  event_name TEXT,
  date DATE,
  type TEXT,
  grade TEXT,
  template_type TEXT,
  template_url TEXT,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────
-- 9. FEEDBACK + FEEDBACK_SETTINGS
-- ─────────────────────────────────────────────────
CREATE TABLE public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id INT REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  student_id TEXT,
  name TEXT,
  venue_rating INT CHECK (venue_rating BETWEEN 1 AND 5),
  facilitator_rating INT CHECK (facilitator_rating BETWEEN 1 AND 5),
  event_rating INT CHECK (event_rating BETWEEN 1 AND 5),
  experience TEXT,
  submitted_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(event_id, user_id)
);

CREATE TABLE public.feedback_settings (
  event_id INT REFERENCES public.events(id) ON DELETE CASCADE PRIMARY KEY,
  enabled BOOLEAN DEFAULT false
);


-- ─────────────────────────────────────────────────
-- 10. NOTIFICATIONS
-- ─────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  icon TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Enable on ALL tables
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ── PROFILES Policies ──
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── EVENTS Policies ──
CREATE POLICY "events_select" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "events_update" ON public.events
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "events_delete" ON public.events
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── EVENT_DETAILS Policies ──
CREATE POLICY "event_details_select" ON public.event_details
  FOR SELECT USING (true);

CREATE POLICY "event_details_insert" ON public.event_details
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "event_details_update" ON public.event_details
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_details.event_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── CLUBS Policies ──
CREATE POLICY "clubs_select" ON public.clubs
  FOR SELECT USING (true);

CREATE POLICY "clubs_insert" ON public.clubs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "clubs_update" ON public.clubs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "clubs_delete" ON public.clubs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── VENUES Policies ──
CREATE POLICY "venues_select" ON public.venues
  FOR SELECT USING (true);

-- ── REGISTRATIONS Policies ──
CREATE POLICY "registrations_select" ON public.registrations
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "registrations_insert" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations_update" ON public.registrations
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "registrations_delete" ON public.registrations
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

-- ── ATTENDANCE_CODES Policies ──
CREATE POLICY "attendance_select" ON public.attendance_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "attendance_insert" ON public.attendance_codes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "attendance_update" ON public.attendance_codes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

-- ── CERTIFICATES Policies ──
CREATE POLICY "certificates_select" ON public.certificates
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "certificates_insert" ON public.certificates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

-- ── FEEDBACK Policies ──
CREATE POLICY "feedback_select" ON public.feedback
  FOR SELECT USING (true);

CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── FEEDBACK_SETTINGS Policies ──
CREATE POLICY "feedback_settings_select" ON public.feedback_settings
  FOR SELECT USING (true);

CREATE POLICY "feedback_settings_insert" ON public.feedback_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "feedback_settings_update" ON public.feedback_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

-- ── NOTIFICATIONS Policies ──
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
