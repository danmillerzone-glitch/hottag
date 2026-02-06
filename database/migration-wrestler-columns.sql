-- ============================================
-- HOTTAG MIGRATION: Add missing wrestler columns
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS booking_email VARCHAR(255);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);
ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(100);

DO $$
BEGIN
    RAISE NOTICE 'Missing wrestler columns added successfully!';
END $$;
