-- ============================================
-- HOTTAG MIGRATION: Admin Role System
-- Run this in Supabase SQL Editor
-- ============================================

-- Add is_admin flag to a profiles table or directly check by email
-- Simplest approach: admin_users table with user IDs
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin_users table
CREATE POLICY "Admins can read admin_users"
  ON admin_users FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Add your user as the first admin (replace with your actual user ID)
-- You can find your user ID in Supabase Auth > Users
-- INSERT INTO admin_users (user_id) VALUES ('YOUR-USER-ID-HERE');

-- Create a helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant admin full access to key tables
-- Promotion claims
CREATE POLICY "Admins can view all promotion claims"
  ON promotion_claims FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update promotion claims"
  ON promotion_claims FOR UPDATE
  USING (is_admin(auth.uid()));

-- Wrestler claims
CREATE POLICY "Admins can view all wrestler claims"
  ON wrestler_claims FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update wrestler claims"
  ON wrestler_claims FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can update any wrestler
CREATE POLICY "Admins can update any wrestler"
  ON wrestlers FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can update any promotion
CREATE POLICY "Admins can update any promotion"
  ON promotions FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can insert wrestlers
CREATE POLICY "Admins can insert wrestlers"
  ON wrestlers FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete wrestlers
CREATE POLICY "Admins can delete wrestlers"
  ON wrestlers FOR DELETE
  USING (is_admin(auth.uid()));

DO $$
BEGIN
    RAISE NOTICE 'Admin role system created! Remember to add your user ID to admin_users table.';
END $$;
