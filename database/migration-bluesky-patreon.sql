-- Add Bluesky and Patreon social links

ALTER TABLE wrestlers
  ADD COLUMN IF NOT EXISTS bluesky_handle TEXT,
  ADD COLUMN IF NOT EXISTS patreon_url TEXT;

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS bluesky_handle TEXT,
  ADD COLUMN IF NOT EXISTS patreon_url TEXT;
