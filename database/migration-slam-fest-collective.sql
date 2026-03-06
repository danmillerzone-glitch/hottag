-- Add SLAM FEST collective for Vegas Weekend
INSERT INTO vegas_weekend_collectives (key, name, description, sort_order, ticket_url)
VALUES (
  'slam-fest',
  'SLAM FEST',
  'Live wrestling at the Palms Casino Resort.',
  4,
  ''
)
ON CONFLICT (key) DO NOTHING;

-- Auto-assign any existing Vegas Weekend events at the Palms to this collective
UPDATE events
SET vegas_collective = 'slam-fest'
WHERE vegas_weekend = true
  AND venue_name ILIKE '%palms%'
  AND vegas_collective IS NULL;
