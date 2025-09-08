-- Fix Row Level Security policies for user registration
-- Run this in your Supabase SQL editor

-- First, drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a new policy that allows authenticated users to insert their own profile
-- This allows Supabase Auth to create user records after successful authentication
CREATE POLICY "Allow authenticated users to insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Also create a policy to allow service role to insert (for admin operations)
CREATE POLICY "Allow service role to insert users" ON public.users
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Make sure we can also allow anon users to insert during registration
-- This is needed for the signup process
CREATE POLICY "Allow anon users to insert during signup" ON public.users
  FOR INSERT 
  WITH CHECK (true);

-- The above policy is temporary and broad - in production you'd want more specific rules