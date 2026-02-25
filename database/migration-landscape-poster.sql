-- Add landscape_poster_url column to events table
-- Portrait poster (poster_url) = 3:4, used in event cards on homepage/browse
-- Landscape poster (landscape_poster_url) = 16:9, used for social sharing OG images and event detail hero
ALTER TABLE events ADD COLUMN IF NOT EXISTS landscape_poster_url TEXT;
