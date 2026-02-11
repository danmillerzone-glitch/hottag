-- Fix: Ensure promotions table has a public read policy
-- This is needed for client-side queries (onboarding, search, etc.)
-- Run this in your Supabase SQL editor

-- Check if policy exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'promotions' 
    AND policyname = 'promotions_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "promotions_public_read" ON promotions FOR SELECT USING (true)';
  END IF;
END $$;

-- Also ensure wrestlers table has public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'wrestlers' 
    AND policyname = 'wrestlers_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "wrestlers_public_read" ON wrestlers FOR SELECT USING (true)';
  END IF;
END $$;
