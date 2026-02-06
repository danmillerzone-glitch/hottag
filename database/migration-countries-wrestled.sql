-- ============================================
-- HOTTAG MIGRATION: Add countries wrestled
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS countries_wrestled TEXT[] DEFAULT '{}';

DO $$
BEGIN
    RAISE NOTICE 'countries_wrestled column added successfully!';
END $$;
