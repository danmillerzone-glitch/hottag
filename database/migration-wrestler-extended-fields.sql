-- ============================================
-- HOTTAG MIGRATION: Wrestler Extended Profile Fields
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new fields to wrestlers table
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS moniker VARCHAR(200);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS birthplace VARCHAR(200);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS residence VARCHAR(200);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS height VARCHAR(20);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS weight VARCHAR(20);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS debut_year INTEGER;
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS trainer VARCHAR(200);

-- Note: the existing "hometown" field will be kept for backward compat
-- but we'll migrate data from hometown → residence if needed

DO $$
BEGIN
    RAISE NOTICE 'Wrestler extended profile fields added!';
END $$;
