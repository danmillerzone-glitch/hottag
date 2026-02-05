-- ============================================
-- HOTTAG MIGRATION: Address, Email, Merch
-- Run this in Supabase SQL Editor
-- ============================================

-- Add address field to events (for Google Maps accuracy)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address VARCHAR(500);

-- Ensure booking_email and merch_url exist on promotions (they should from schema)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotions' AND column_name = 'booking_email') THEN
        ALTER TABLE promotions ADD COLUMN booking_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotions' AND column_name = 'merch_url') THEN
        ALTER TABLE promotions ADD COLUMN merch_url VARCHAR(500);
    END IF;
END $$;

DO $$ BEGIN RAISE NOTICE 'Migration complete!'; END $$;
