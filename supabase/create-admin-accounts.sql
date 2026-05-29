-- ═══════════════════════════════════════════════════════════════════
-- Pre-create Admin & Organizer Accounts
-- ═══════════════════════════════════════════════════════════════════
--
-- You CANNOT create auth users via SQL alone.
-- Instead, create them in the Supabase Dashboard:
--
-- 1. Go to: Authentication → Users → "Add User"
-- 2. Create these accounts:
--
--    ADMIN ACCOUNT:
--    ├── Email:    admin@galgotias.edu.in
--    └── Password: Admin@GU2026
--
--    ORGANIZER ACCOUNT:
--    ├── Email:    organizer@galgotias.edu.in
--    └── Password: Organizer@GU2026
--
-- 3. IMPORTANT: After creating both users, run the SQL below
--    to set their roles in the profiles table.
-- ═══════════════════════════════════════════════════════════════════

-- After creating users in Dashboard → Authentication → Users,
-- update their profiles with the correct roles and details:

UPDATE public.profiles
SET
  name = 'Saksham',
  role = 'admin',
  department = 'Administration',
  avatar = 'RK',
  designation = 'Dean of Student Affairs'
WHERE email = 'admin@galgotias.edu.in';

UPDATE public.profiles
SET
  name = 'Priya Verma',
  role = 'organizer',
  department = 'Student Council',
  avatar = 'PV',
  club = 'Technical Society'
WHERE email = 'organizer@galgotias.edu.in';
