#!/usr/bin/env node
/**
 * Script to create an admin user in the CRM system
 * 
 * Usage: node scripts/create-admin.mjs
 * 
 * This script will:
 * 1. Create a user with email ap79020@gmail.com and password Login@12
 * 2. Assign the admin role to that user
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(__dirname, '..', '.env');
const envFile = readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Admin credentials as specified in requirements
// NOTE: These are the initial setup credentials for the first admin user.
// After running this script, you should:
// 1. Log in with these credentials
// 2. Change the password immediately
// 3. Enable two-factor authentication if available
// For production use, consider using environment variables for credentials.
const ADMIN_EMAIL = 'ap79020@gmail.com';
const ADMIN_PASSWORD = 'Login@12';
const ADMIN_FULL_NAME = 'Admin User';

async function createAdminUser() {
  console.log('🚀 Starting admin user creation process...\n');

  try {
    // Step 1: Check if user already exists
    console.log(`Checking if user ${ADMIN_EMAIL} already exists...`);
    
    // Try to sign in first to check if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (signInData.user) {
      console.log('✅ User already exists, checking role...');
      const userId = signInData.user.id;

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (roleData) {
        console.log('✅ User already has admin role');
        await supabase.auth.signOut();
        return;
      }

      // Assign admin role
      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (insertRoleError) {
        console.error('❌ Error assigning admin role:', insertRoleError.message);
      } else {
        console.log('✅ Admin role assigned successfully');
      }

      await supabase.auth.signOut();
      return;
    }

    // Step 2: Create new user if doesn't exist
    console.log(`Creating new user ${ADMIN_EMAIL}...`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          full_name: ADMIN_FULL_NAME,
        },
      },
    });

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError.message);
      process.exit(1);
    }

    if (!signUpData.user) {
      console.error('❌ User creation failed - no user returned');
      process.exit(1);
    }

    console.log('✅ User created successfully');
    console.log(`   User ID: ${signUpData.user.id}`);
    console.log(`   Email: ${signUpData.user.email}`);

    // Step 3: Assign admin role
    console.log('\nAssigning admin role...');
    
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: signUpData.user.id,
        role: 'admin',
      });

    if (roleError) {
      console.error('❌ Error assigning admin role:', roleError.message);
      console.log('\n⚠️  User was created but admin role assignment failed.');
      console.log('   You may need to manually assign the admin role in the database.');
      process.exit(1);
    }

    console.log('✅ Admin role assigned successfully');
    
    console.log('\n✨ Admin user setup complete!');
    console.log('\nLogin credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  Note: If email confirmation is required, check your inbox.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
