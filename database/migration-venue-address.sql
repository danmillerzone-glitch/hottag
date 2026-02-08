-- Add venue_address to events table (if not already present)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;
