-- Add featured title match columns to event_matches
ALTER TABLE event_matches
  ADD COLUMN IF NOT EXISTS featured_title_match BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_sort_order INTEGER DEFAULT 0;

-- Partial index for homepage query performance (very few rows will be featured)
CREATE INDEX IF NOT EXISTS idx_event_matches_featured
  ON event_matches (featured_title_match)
  WHERE featured_title_match = TRUE;
