-- ================================================================
-- MAFAZA PMS – Complete Setup Script
-- Run this ONCE in Supabase SQL Editor to set everything up
-- ================================================================

-- (Paste the full schema.sql content here, then this adds your admin user)

-- After running schema.sql, run this to create your first admin:
INSERT INTO public.profiles (id, email, full_name, role, is_active, password_hash)
VALUES (
  gen_random_uuid(),
  'admin@mafaza.com',       -- ← Change this to your email
  'مدير النظام',
  'super_admin',
  true,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- password: Admin@123
)
ON CONFLICT (email) DO NOTHING;
