-- Vegas Weekend: Add tagging columns to events
-- vegas_weekend: boolean flag to include event on the Vegas Weekend page
-- vegas_collective: which collective group the event belongs to (e.g. 'the-collective', 'shooting-star-fest')

ALTER TABLE events ADD COLUMN IF NOT EXISTS vegas_weekend boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vegas_collective text;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_events_vegas_weekend ON events (vegas_weekend) WHERE vegas_weekend = true;

-- Tag all Las Vegas events between April 15-19 as Vegas Weekend
UPDATE events 
SET vegas_weekend = true
WHERE event_date >= '2026-04-15' 
  AND event_date <= '2026-04-19'
  AND (city ILIKE '%las vegas%' OR state = 'NV');

-- Tag Horseshoe Las Vegas events as "the-collective"
UPDATE events 
SET vegas_collective = 'the-collective'
WHERE vegas_weekend = true
  AND venue_name ILIKE '%horseshoe%';

-- Tag Swan Dive / Bizarre Bar events as "shooting-star-fest"
UPDATE events 
SET vegas_collective = 'shooting-star-fest'
WHERE vegas_weekend = true
  AND (venue_name ILIKE '%swan dive%' OR venue_name ILIKE '%bizarre%' OR venue_name ILIKE '%bizzare%');

-- Vegas Weekend collective hero images table
CREATE TABLE IF NOT EXISTS vegas_weekend_collectives (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed the two collectives
INSERT INTO vegas_weekend_collectives (key, name, description, sort_order) VALUES
  ('the-collective', 'The Collective', 'GCW''s massive multi-show event series at the Horseshoe Las Vegas. Featuring Spring Break, Bloodsport, Big Gay Brunch, and more — the largest independent wrestling gathering of the year.', 1),
  ('shooting-star-fest', 'Shooting Star Fest', 'An eclectic mix of indie promotions taking over the Swan Dive and Bizarre Bar on Fremont East. Expect the unexpected from some of the most creative promotions in wrestling.', 2)
ON CONFLICT (key) DO NOTHING;

-- Also add a hero_image_url column to the main page
-- This will be the banner at the top of the Vegas Weekend page
ALTER TABLE vegas_weekend_collectives ADD COLUMN IF NOT EXISTS image_url text;
