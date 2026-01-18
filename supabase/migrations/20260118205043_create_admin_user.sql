-- Create admin user seed data migration
-- This migration creates a helper function to assign admin role to users
-- 
-- ADMIN USER CREDENTIALS:
--   Email: ap79020@gmail.com
--   Password: Login@12
--
-- IMPORTANT: This migration only creates the helper function.
-- To actually create the admin user, you must either:
--   1. Run: npm run create-admin (recommended)
--   2. Sign up via the app and then run: SELECT public.assign_admin_role_by_email('ap79020@gmail.com');
--   3. Create user manually in Supabase dashboard and assign role via SQL
--
-- See ADMIN_SETUP.md for detailed instructions.

-- Create or replace function to assign admin role to specific user by email
CREATE OR REPLACE FUNCTION public.assign_admin_role_by_email(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- If user exists, assign admin role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user: %', user_email;
  ELSE
    RAISE NOTICE 'User not found: %', user_email;
  END IF;
END;
$$;

-- Comment explaining usage
COMMENT ON FUNCTION public.assign_admin_role_by_email IS 
'Assigns admin role to a user by email. Usage: SELECT public.assign_admin_role_by_email(''ap79020@gmail.com'');';
