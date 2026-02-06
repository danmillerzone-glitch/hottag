-- ============================================
-- HOTTAG MIGRATION: Add TikTok Handle
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(100);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(100);

DO $$
BEGIN
    RAISE NOTICE 'TikTok handle columns added successfully!';
END $$;
