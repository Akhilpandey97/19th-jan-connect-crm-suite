# Creating an Admin User

This guide explains how to create an admin user in the CRM system.

## Prerequisites

- Node.js installed
- Access to the Supabase project
- Valid `.env` file with Supabase credentials

## Method 1: Using the Admin Creation Script (Recommended)

The easiest way to create an admin user is to use the provided script:

```bash
npm run create-admin
```

This script will:
1. Create a user with email: `ap79020@gmail.com`
2. Set the password to: `Login@12`
3. Assign the admin role to the user

### Script Features

- ✅ Checks if the user already exists
- ✅ Assigns admin role automatically
- ✅ Handles errors gracefully
- ✅ Provides detailed console output

## Method 2: Manual Creation via Supabase Dashboard

If you prefer to create the admin user manually:

1. **Sign up the user** through the application's sign-up page or Supabase dashboard
   - Email: `ap79020@gmail.com`
   - Password: `Login@12`
   - Full Name: Admin User (or any name)

2. **Assign the admin role** via Supabase SQL Editor:
   ```sql
   -- Find the user's UUID
   SELECT id, email FROM auth.users WHERE email = 'ap79020@gmail.com';
   
   -- Assign admin role (replace USER_UUID with the actual UUID from above)
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_UUID', 'admin');
   ```

3. **Or use the helper function** (available after running migrations):
   ```sql
   SELECT public.assign_admin_role_by_email('ap79020@gmail.com');
   ```

## Method 3: Using Supabase CLI

If you have the Supabase CLI installed locally:

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Create user via the application or admin dashboard
# Then assign role using SQL editor
```

## Verifying Admin Access

After creating the admin user:

1. Log in to the application with:
   - Email: `ap79020@gmail.com`
   - Password: `Login@12`

2. You should have access to:
   - Admin Dashboard
   - User Role Management
   - Lead Assignment
   - CRM Connect features
   - All administrative functions

## Troubleshooting

### User created but no admin role

If the user was created but doesn't have admin access:

```sql
-- Check current roles
SELECT ur.*, u.email 
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'ap79020@gmail.com';

-- Add admin role if missing
SELECT public.assign_admin_role_by_email('ap79020@gmail.com');
```

### Script fails with network error

If running in a sandboxed environment without internet access:
- Use Method 2 (Manual Creation via Dashboard)
- Or run the script in an environment with access to Supabase

### Email confirmation required

If Supabase requires email confirmation:
- Check the email inbox for confirmation link
- Or disable email confirmation in Supabase project settings (Auth > Email Auth > Confirm email)
- Or manually confirm user in Supabase dashboard (Authentication > Users > click user > Confirm)

## Security Notes

⚠️ **Important**: After creating the admin user in production:
1. Change the default password immediately
2. Enable two-factor authentication if available
3. Review the user's permissions regularly
4. Use strong, unique passwords

## Files

- `scripts/create-admin.mjs` - Admin user creation script
- `supabase/migrations/20260118205043_create_admin_user.sql` - Helper function migration
- `package.json` - Contains `create-admin` npm script

## Support

For issues or questions, please refer to the project documentation or contact the development team.
