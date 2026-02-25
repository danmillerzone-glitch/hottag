-- =============================================
-- VEGAS WEEKEND: ticket_url on collectives,
-- HyperX Arena collective, Swan Dive → Bizarre Bar
-- =============================================

-- 1. Add ticket_url column to collectives
ALTER TABLE vegas_weekend_collectives ADD COLUMN IF NOT EXISTS ticket_url TEXT;

-- 2. Create HyperX Arena collective
INSERT INTO vegas_weekend_collectives (key, name, description, sort_order) VALUES
  ('hyperx-arena', 'HyperX Arena', 'High-energy shows at the HyperX Arena in Las Vegas. Multiple promotions bring their biggest cards to this iconic venue during Vegas Weekend.', 3)
ON CONFLICT (key) DO NOTHING;

-- 3. Tag HyperX Arena events
UPDATE events
SET vegas_collective = 'hyperx-arena'
WHERE vegas_weekend = true
  AND venue_name ILIKE '%hyperx%';

-- 4. Rename Swan Dive → Bizarre Bar globally in events
UPDATE events
SET venue_name = 'Bizarre Bar'
WHERE venue_name ILIKE '%swan dive%';

-- 5. Update Shooting Star Fest description (remove Swan Dive reference)
UPDATE vegas_weekend_collectives
SET description = 'An eclectic mix of indie promotions taking over the Bizarre Bar on Fremont East. Expect the unexpected from some of the most creative promotions in wrestling.'
WHERE key = 'shooting-star-fest';

-- Verify
SELECT key, name, ticket_url FROM vegas_weekend_collectives ORDER BY sort_order;
SELECT COUNT(*) AS remaining_swan_dive FROM events WHERE venue_name ILIKE '%swan dive%';
