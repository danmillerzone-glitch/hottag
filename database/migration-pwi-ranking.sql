-- ============================================
-- HOTTAG MIGRATION: Add PWI 500 ranking
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE wrestlers ADD COLUMN IF NOT EXISTS pwi_ranking INTEGER;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_wrestlers_pwi_ranking ON wrestlers(pwi_ranking) WHERE pwi_ranking IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'PWI ranking column added successfully!';
END $$;
