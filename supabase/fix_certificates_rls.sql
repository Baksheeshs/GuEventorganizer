-- Fix certificates RLS policies
-- Run this in the Supabase Dashboard > SQL Editor

-- 1. Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "certificates_select" ON public.certificates;

-- 2. Create a new SELECT policy that lets students see certificates
--    matched by user_id OR by their profile name (for older registrations)
CREATE POLICY "certificates_select" ON public.certificates
  FOR SELECT USING (
    auth.uid() = user_id
    OR student_name = (SELECT name FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

-- 3. Keep the INSERT policy (organizers/admins only) - no change needed
-- The existing policy is correct:
-- CREATE POLICY "certificates_insert" ON public.certificates
--   FOR INSERT WITH CHECK (
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
--   );
